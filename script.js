// -------------- SETUP ----------------- //

const svgNS = "http://www.w3.org/2000/svg";
const svgContainer = document.getElementById("flower");


// -------------- DESIGN CONSTANTS ----------------- //
const stepGoal = 10000; // according to my suunto watch
const petalPath = "M 0,0 C 30,60 30,60 0,100 C -30,60 -30,60 0,0";

const objectSize = d3.scaleLinear() // distance -> flower size
    .domain([0, 12000])
    .range([0.2, 0.3])
    .clamp(true)
    .unknown(0.05);

const flowerColor = d3.scaleSequential(d3.interpolateWarm) // steps -> flower color
    .domain([0, 20000])
    .clamp(false);

// Sample values used across the wearables legend
const SAMPLE_STEPS = 7500;
const SAMPLE_DISTANCE = 5000;
const SAMPLE_COMPLETION = 0.7;

// Distance samples (in meters) used to drive legend flower sizes and pad radii
const DISTANCE_SAMPLES = [3000, 7000, 11000];


// -------------- RESPONSIVE LAYOUT CONFIG ----------------- //

function getLayoutConfig(containerWidth) {
    if (containerWidth < 600) {
        // Mobile
        return {
            breakpoint: "mobile",
            CELL_SIZE: 20,
            ROW_HEIGHT: 28,
            PADDING_LEFT: 40,
            PADDING_TOP: 30,
            LEGEND_HEIGHT: 680,
            LEGEND_COL_WIDTH: 280,
            LEGEND_HEADER_Y: 40,
            LEGEND_LABEL_X: 70,
            LEGEND_GRID_OFFSET_X: 80,
            ROW_Y: [60, 160, 320, 500],
            HIT_SIZE: 20,
            legendLayout: "stacked",
            fontSize: {
                colHeader: 13,
                rowHeader: 11,
                sectionLabel: 10,
                cellLabel: 8,
                gradientLabel: 7,
                dayLabel: 6,
                monthLabel: 10,
                yearLabel: 13,
            },
            legendSpacing: {
                itemGap: 50,
                subSectionY: [20, 70, 130],
                budOffset: 20,
                flowerOffset: 20,
                barWidth: 140,
                distGap: 55,
                stepsGap: 40,
                padDistGap: 55,
            },
        };
    } else if (containerWidth < 1024) {
        // Tablet
        return {
            breakpoint: "tablet",
            CELL_SIZE: 32,
            ROW_HEIGHT: 50,
            PADDING_LEFT: 75,
            PADDING_TOP: 45,
            LEGEND_HEIGHT: 420,
            LEGEND_COL_WIDTH: 220,
            LEGEND_HEADER_Y: 50,
            LEGEND_LABEL_X: 80,
            LEGEND_GRID_OFFSET_X: 120,
            ROW_Y: [80, 170],
            HIT_SIZE: 26,
            legendLayout: "grid",
            fontSize: {
                colHeader: 16,
                rowHeader: 14,
                sectionLabel: 11,
                cellLabel: 9,
                gradientLabel: 8,
                dayLabel: 7,
                monthLabel: 12,
                yearLabel: 16,
            },
            legendSpacing: {
                itemGap: 60,
                subSectionY: [25, 90, 170],
                budOffset: 25,
                flowerOffset: 25,
                barWidth: 140,
                distGap: 60,
                stepsGap: 45,
                padDistGap: 60,
            },
        };
    } else {
        // Desktop
        return {
            breakpoint: "desktop",
            CELL_SIZE: 54,
            ROW_HEIGHT: 60 * 1.55,
            PADDING_LEFT: 120,
            PADDING_TOP: 60,
            LEGEND_HEIGHT: 490,
            LEGEND_COL_WIDTH: 350,
            LEGEND_HEADER_Y: 60,
            LEGEND_LABEL_X: 100,
            LEGEND_GRID_OFFSET_X: 180,
            ROW_Y: [90, 190],
            HIT_SIZE: 36,
            legendLayout: "grid",
            fontSize: {
                colHeader: 20,
                rowHeader: 18,
                sectionLabel: 14,
                cellLabel: 12,
                gradientLabel: 10,
                dayLabel: 9,
                monthLabel: 15,
                yearLabel: 20,
            },
            legendSpacing: {
                itemGap: 80,
                subSectionY: [30, 110, 200],
                budOffset: 40,
                flowerOffset: 40,
                barWidth: 200,
                distGap: 80,
                stepsGap: 60,
                padDistGap: 80,
            },
        };
    }
}


// -------------- FUNCTIONS ----------------- //

function drawFlower(selection, options) {
    const petalCount = 5;
    const { numberOfLayers, size, color } = options;

    // Build petal data: one entry per petal across all layers
    const petals = [];
    for (let i = 0; i < numberOfLayers; i++) {
        for (let j = 0; j < petalCount; j++) {
            petals.push({
                angle: j * (360 / petalCount) + i * ((360 / petalCount) / numberOfLayers),
                layer: i,
            });
        }
    }

    selection.append("g")
        .attr("class", "flower")
        .selectAll("path.petal")
        .data(petals)
        .join("path")
        .attr("class", "petal")
        .attr("d", petalPath)
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("fill", color)
        .attr("fill-opacity", d => 1 - 0.1 * d.layer)
        .attr("transform", d => `rotate(${d.angle}) scale(${size})`);
}

function drawBuds(selection) {
    const budColor = "#1e32eb";
    selection.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 4)
        .attr("fill", budColor);
}

function drawBudsWithRings(selection, options) {
    const { intensity } = options;
    const budColor = "#1e32eb";
    const ringColor = "#1e32eb";

    selection.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 4)
        .attr("fill", budColor);

    selection.selectAll("circle.ring")
        .data(d3.range(intensity))   // [0, 1, 2, ...intensity-1]
        .join("circle")
        .attr("class", "ring")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", i => 8 + 5 * i)
        .attr("fill", "none")
        .attr("stroke", ringColor);
}

// opacityDimmed == true  -> pad rendered faded (used behind a flower)
// opacityDimmed == false -> pad rendered solid (standalone)
function drawLilypads(selection, options, opacityDimmed) {
    const backgroundColor = opacityDimmed ? "#fefec169" : "#fefec1fd";
    const mainColor = opacityDimmed ? "#65ad3e6e" : "#65ad3e";
    const overlapColor = opacityDimmed ? "#06420e6f" : "#06420e";
    const lilypadRadius = opacityDimmed ? 6 : options.lilypadRadius;
    const completion = options.completion;

    const baseCompletion = Math.min(completion, 1);
    const excessCompletion = Math.max(0, Math.min(completion - 1, 1));

    // Build the data array for the arcs we want to draw
    const arcs = [];
    if (baseCompletion > 0) {
        arcs.push({
            startAngle: 0,
            endAngle: -Math.PI * 2 * baseCompletion,
            fill: mainColor,
        });
    }
    if (excessCompletion > 0) {
        arcs.push({
            startAngle: 0,
            endAngle: -Math.PI * 2 * excessCompletion,
            fill: overlapColor,
        });
    }

    const arcGen = d3.arc().innerRadius(0).outerRadius(lilypadRadius);

    // Create a group for this lily pad
    const padGroup = selection.append("g")
        .attr("class", "lilypad");

    // The pad background (one circle)
    padGroup.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", lilypadRadius)
        .attr("fill", backgroundColor);

    // The arcs (zero, one, or two of them)
    padGroup.selectAll("path.arc")
        .data(arcs)
        .join("path")
        .attr("class", "arc")
        .attr("d", d => arcGen({ startAngle: d.startAngle, endAngle: d.endAngle }))
        .attr("fill", d => d.fill);
}

function legendCell(col, row, config) {
    return {
        x: config.LEGEND_GRID_OFFSET_X + col * config.LEGEND_COL_WIDTH,
        y: config.ROW_Y[row],
    };
}

function lilypadOptionsForDay(day, lilypadRadius) {
    const rawCompletion = day.steps != null ? day.steps / stepGoal : 0;
    return {
        lilypadRadius: lilypadRadius(day.distance),  // radius ~ distance
        completion: rawCompletion,                    // completion ~ steps
    };
}

function flowerOptionsForDay(day) {
    return {
        numberOfLayers: day.intensity,
        size: objectSize(day.distance),       // flower size ~ distance
        color: flowerColor(day.steps),        // flower color ~ steps
    };
}

function positionForDate(startDate, date, config) {
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();

    const monthsSinceStart = (date.getFullYear() - startYear) * 12 + (date.getMonth() - startMonth);
    const dayOfMonth = date.getDate();
    return {
        x: config.PADDING_LEFT + (dayOfMonth - 1) * config.CELL_SIZE,
        y: config.PADDING_TOP + monthsSinceStart * config.ROW_HEIGHT,
    };
}

function drawCurlyBrace(parent, x, y1, y2, w, label, fontSize) {
    const mid = (y1 + y2) / 2;
    const armW = w * 0.6;

    parent.append("path")
        .attr("d",
            `M ${x},${y1}` +
            ` C ${x - armW},${y1} ${x - armW},${mid} ${x - w},${mid}` +
            ` C ${x - armW},${mid} ${x - armW},${y2} ${x},${y2}`)
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-width", 1.5);

    parent.append("text")
        .attr("transform", `translate(${x - w - fontSize}, ${mid}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", fontSize)
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .text(label);
}

function getGroupBounds(group) {
    const bbox = group.node().getBBox();
    const t = group.attr("transform") || "";
    const m = t.match(/translate\(\s*([\d.e+-]+)\s*[,\s]\s*([\d.e+-]+)\s*\)/);
    const tx = m ? +m[1] : 0;
    const ty = m ? +m[2] : 0;
    return {
        x1: bbox.x + tx,
        y1: bbox.y + ty,
        x2: bbox.x + tx + bbox.width,
        y2: bbox.y + ty + bbox.height,
    };
}


// -------------- RENDER FUNCTION ----------------- //

function render(data, lilypadRadius, config) {
    const svg = d3.select("#flower");
    svg.selectAll("*").remove();

    const isMobile = config.breakpoint === "mobile";
    const sp = config.legendSpacing;
    const fs = config.fontSize;

    // Compute content width upfront (for legend centering)
    const startDate = data[0].date;
    const allPositions = data.map(d => positionForDate(startDate, d.date, config));
    const maxX = Math.max(...allPositions.map(p => p.x));
    const maxY = Math.max(...allPositions.map(p => p.y));
    const contentWidth = maxX + config.CELL_SIZE;
    const contentHeight = maxY + config.CELL_SIZE;

    // -------------- LEGEND -------------- //

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(0, 20)`);

    if (config.legendLayout === "stacked") {
        // Mobile: single-column stacked layout
        // Row 0: period day, non-wearable (buds-with-rings)
        // Row 1: non-period day, non-wearable (bud)
        // Row 2: period day, wearables (flowers)
        // Row 3: non-period day, wearables (lilypads)

        // Section headers
        const sectionHeaders = [
            { label: "period day", row: 0 },
            { label: "non-period day", row: 1 },
            { label: "period day", row: 2 },
            { label: "non-period day", row: 3 },
        ];
        sectionHeaders.forEach(h => {
            legend.append("text")
                .attr("x", 0)
                .attr("y", config.ROW_Y[h.row] - 10)
                .attr("font-size", fs.rowHeader)
                .attr("font-weight", "bold")
                .attr("fill", "#333")
                .text(h.label);
        });

        // Row 0: buds with rings (intensity 1,2,3)
        const row0 = legend.append("g")
            .attr("transform", `translate(0, ${config.ROW_Y[0]})`);
        [1, 2, 3].forEach((intensity, i) => {
            const bud = row0.append("g")
                .attr("transform", `translate(${i * sp.itemGap + sp.budOffset}, 20)`);
            drawBudsWithRings(bud, { intensity });
            row0.append("text")
                .attr("x", i * sp.itemGap + sp.budOffset)
                .attr("y", 55)
                .attr("text-anchor", "middle")
                .attr("font-size", fs.cellLabel)
                .attr("fill", "#666")
                .text(intensity);
        });
        row0.append("text")
            .attr("x", -5)
            .attr("y", 20)
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", fs.sectionLabel)
            .attr("fill", "#333")
            .text("intensity");

        // Row 1: single bud
        const row1 = legend.append("g")
            .attr("transform", `translate(0, ${config.ROW_Y[1]})`);
        const budG = row1.append("g")
            .attr("transform", `translate(${sp.budOffset}, 20)`);
        drawBuds(budG);

        // Row 2: flowers (intensity, steps gradient, distance)
        const row2 = legend.append("g")
            .attr("transform", `translate(0, ${config.ROW_Y[2]})`);

        // Intensity flowers
        [1, 2, 3].forEach((intensity, i) => {
            const flower = row2.append("g")
                .attr("transform", `translate(${i * sp.itemGap + sp.flowerOffset}, ${sp.subSectionY[0]})`);
            drawFlower(flower, {
                numberOfLayers: intensity,
                size: 0.25,
                color: flowerColor(SAMPLE_STEPS),
            });
            row2.append("text")
                .attr("x", i * sp.itemGap + sp.flowerOffset)
                .attr("y", sp.subSectionY[0] + 40)
                .attr("text-anchor", "middle")
                .attr("font-size", fs.cellLabel)
                .attr("fill", "#666")
                .text(intensity);
        });
        row2.append("text")
            .attr("x", -5)
            .attr("y", sp.subSectionY[0])
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", fs.sectionLabel)
            .attr("fill", "#333")
            .text("intensity");

        // Steps gradient bar
        const gradientSteps = 50;
        row2.selectAll("rect.gradient")
            .data(d3.range(gradientSteps))
            .join("rect")
            .attr("class", "gradient")
            .attr("x", i => sp.flowerOffset + (i / gradientSteps) * sp.barWidth)
            .attr("y", sp.subSectionY[1])
            .attr("width", sp.barWidth / gradientSteps + 1)
            .attr("height", 12)
            .attr("fill", i => flowerColor((i / gradientSteps) * 20000));
        row2.append("text")
            .attr("x", sp.flowerOffset)
            .attr("y", sp.subSectionY[1] + 24)
            .attr("text-anchor", "start")
            .attr("font-size", fs.gradientLabel)
            .attr("fill", "#666")
            .text("0 steps");
        row2.append("text")
            .attr("x", sp.flowerOffset + sp.barWidth)
            .attr("y", sp.subSectionY[1] + 24)
            .attr("text-anchor", "end")
            .attr("font-size", fs.gradientLabel)
            .attr("fill", "#666")
            .text("20,000 steps");
        row2.append("text")
            .attr("x", -5)
            .attr("y", sp.subSectionY[1] + 6)
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", fs.sectionLabel)
            .attr("fill", "#333")
            .text("steps");

        // Distance flowers
        DISTANCE_SAMPLES.forEach((distance, i) => {
            const flower = row2.append("g")
                .attr("transform", `translate(${i * sp.distGap + sp.flowerOffset}, ${sp.subSectionY[2]})`);
            drawFlower(flower, {
                numberOfLayers: 2,
                size: objectSize(distance),
                color: flowerColor(SAMPLE_STEPS),
            });
            row2.append("text")
                .attr("x", i * sp.distGap + sp.flowerOffset)
                .attr("y", sp.subSectionY[2] + 35)
                .attr("text-anchor", "middle")
                .attr("font-size", fs.gradientLabel)
                .attr("fill", "#666")
                .text(`${(distance / 1000).toFixed(1)} km`);
        });
        row2.append("text")
            .attr("x", -5)
            .attr("y", sp.subSectionY[2])
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", fs.sectionLabel)
            .attr("fill", "#333")
            .text("distance");

        // Row 3: lilypads (steps completion + distance radius)
        const row3 = legend.append("g")
            .attr("transform", `translate(0, ${config.ROW_Y[3]})`);

        const STEPS_COMPLETION_SAMPLES = [2500, 7500, 10000, 15000];
        STEPS_COMPLETION_SAMPLES.forEach((steps, i) => {
            const completion = steps / stepGoal;
            const pad = row3.append("g")
                .attr("transform", `translate(${i * sp.stepsGap + sp.flowerOffset}, 20)`);
            drawLilypads(pad, { lilypadRadius: 14, completion }, false);
            row3.append("text")
                .attr("x", i * sp.stepsGap + sp.flowerOffset)
                .attr("y", 50)
                .attr("text-anchor", "middle")
                .attr("font-size", fs.gradientLabel)
                .attr("fill", "#666")
                .text(steps.toLocaleString());
        });
        row3.append("text")
            .attr("x", -5)
            .attr("y", 20)
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", fs.sectionLabel)
            .attr("fill", "#333")
            .text("steps");

        DISTANCE_SAMPLES.forEach((distance, i) => {
            const pad = row3.append("g")
                .attr("transform", `translate(${i * sp.padDistGap + sp.flowerOffset}, 90)`);
            const radius = lilypadRadius(distance);
            drawLilypads(pad, { lilypadRadius: radius, completion: SAMPLE_COMPLETION }, false);
            row3.append("text")
                .attr("x", i * sp.padDistGap + sp.flowerOffset)
                .attr("y", 125)
                .attr("text-anchor", "middle")
                .attr("font-size", fs.gradientLabel)
                .attr("fill", "#666")
                .text(`${(distance / 1000).toFixed(1)} km`);
        });
        row3.append("text")
            .attr("x", -5)
            .attr("y", 90)
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", fs.sectionLabel)
            .attr("fill", "#333")
            .text("distance");

        // Curly braces for non-wearable / wearables grouping
        const r0B = getGroupBounds(row0);
        const r1B = getGroupBounds(row1);
        const r2B = getGroupBounds(row2);
        const r3B = getGroupBounds(row3);

        const nwTop = config.ROW_Y[0] - 15;
        const nwBot = Math.max(r0B.y2, r1B.y2);
        const wTop = config.ROW_Y[2] - 15;
        const wBot = Math.max(r2B.y2, r3B.y2);

        const stackBraceX = Math.min(r0B.x1, r1B.x1, r2B.x1, r3B.x1) - 8;
        drawCurlyBrace(legend, stackBraceX, nwTop, nwBot, 10, "non-wearable", fs.sectionLabel);
        drawCurlyBrace(legend, stackBraceX, wTop, wBot, 10, "wearables", fs.sectionLabel);

    } else {
        // Grid layout (tablet + desktop): original 2×2 grid

        const topLeft = legend.append("g")
            .attr("class", "legend-cell")
            .attr("transform", `translate(${legendCell(0, 0, config).x}, ${legendCell(0, 0, config).y})`);

        const topRight = legend.append("g")
            .attr("class", "legend-cell")
            .attr("transform", `translate(${legendCell(1, 0, config).x}, ${legendCell(1, 0, config).y})`);

        const bottomLeft = legend.append("g")
            .attr("class", "legend-cell")
            .attr("transform", `translate(${legendCell(0, 1, config).x}, ${legendCell(0, 1, config).y})`);

        const bottomRight = legend.append("g")
            .attr("class", "legend-cell")
            .attr("transform", `translate(${legendCell(1, 1, config).x}, ${legendCell(1, 1, config).y})`);

        // Column headers
        legend.selectAll("text.col-header")
            .data(["period day", "non-period day"])
            .join("text")
            .attr("class", "col-header")
            .attr("x", (d, i) => legendCell(i, 0, config).x + sp.itemGap)
            .attr("y", config.LEGEND_HEADER_Y)
            .attr("text-anchor", "middle")
            .attr("font-size", fs.colHeader)
            .attr("font-weight", "bold")
            .attr("fill", "#333")
            .text(d => d);

        // TOP LEFT: period day, non-wearable (buds-with-rings)
        [1, 2, 3].forEach((intensity, i) => {
            const bud = topLeft.append("g")
                .attr("transform", `translate(${i * sp.itemGap + sp.budOffset}, ${sp.subSectionY[0]})`);
            drawBudsWithRings(bud, { intensity });
            topLeft.append("text")
                .attr("x", i * sp.itemGap + sp.budOffset)
                .attr("y", sp.subSectionY[0] + 50)
                .attr("text-anchor", "middle")
                .attr("font-size", fs.cellLabel)
                .attr("fill", "#666")
                .text(intensity);
        });
        topLeft.append("text")
            .attr("x", 10)
            .attr("y", sp.subSectionY[0])
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", fs.sectionLabel)
            .attr("fill", "#333")
            .text("intensity");

        // TOP RIGHT: non-period day, non-wearable (single bud)
        const bud = topRight.append("g")
            .attr("transform", `translate(${sp.budOffset}, ${sp.subSectionY[0]})`);
        drawBuds(bud);

        // BOTTOM LEFT: period day, wearables
        // Intensity
        [1, 2, 3].forEach((intensity, i) => {
            const flower = bottomLeft.append("g")
                .attr("transform", `translate(${i * sp.itemGap + sp.flowerOffset}, ${sp.subSectionY[0]})`);
            drawFlower(flower, {
                numberOfLayers: intensity,
                size: 0.25,
                color: flowerColor(SAMPLE_STEPS),
            });
            bottomLeft.append("text")
                .attr("x", i * sp.itemGap + sp.flowerOffset)
                .attr("y", sp.subSectionY[0] + 50)
                .attr("text-anchor", "middle")
                .attr("font-size", fs.cellLabel)
                .attr("fill", "#666")
                .text(intensity);
        });
        bottomLeft.append("text")
            .attr("x", 10)
            .attr("y", sp.subSectionY[0])
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", fs.sectionLabel)
            .attr("fill", "#333")
            .text("intensity");

        // Steps gradient bar
        const gradientSteps = 50;
        bottomLeft.selectAll("rect.gradient")
            .data(d3.range(gradientSteps))
            .join("rect")
            .attr("class", "gradient")
            .attr("x", i => sp.flowerOffset + (i / gradientSteps) * sp.barWidth)
            .attr("y", sp.subSectionY[1])
            .attr("width", sp.barWidth / gradientSteps + 1)
            .attr("height", 16)
            .attr("fill", i => flowerColor((i / gradientSteps) * 20000));
        bottomLeft.append("text")
            .attr("x", sp.flowerOffset)
            .attr("y", sp.subSectionY[1] + 30)
            .attr("text-anchor", "start")
            .attr("font-size", fs.gradientLabel)
            .attr("fill", "#666")
            .text("0 steps");
        bottomLeft.append("text")
            .attr("x", sp.flowerOffset + sp.barWidth)
            .attr("y", sp.subSectionY[1] + 30)
            .attr("text-anchor", "end")
            .attr("font-size", fs.gradientLabel)
            .attr("fill", "#666")
            .text("20,000 steps");
        bottomLeft.append("text")
            .attr("x", 10)
            .attr("y", sp.subSectionY[1] + 8)
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", fs.sectionLabel)
            .attr("fill", "#333")
            .text("steps");

        // Distance flowers
        DISTANCE_SAMPLES.forEach((distance, i) => {
            const flower = bottomLeft.append("g")
                .attr("transform", `translate(${i * sp.distGap + sp.flowerOffset}, ${sp.subSectionY[2]})`);
            drawFlower(flower, {
                numberOfLayers: 2,
                size: objectSize(distance),
                color: flowerColor(SAMPLE_STEPS),
            });
            bottomLeft.append("text")
                .attr("x", i * sp.distGap + sp.flowerOffset)
                .attr("y", sp.subSectionY[2] + 40)
                .attr("text-anchor", "middle")
                .attr("font-size", fs.gradientLabel)
                .attr("fill", "#666")
                .text(`${(distance / 1000).toFixed(1)} km`);
        });
        bottomLeft.append("text")
            .attr("x", 10)
            .attr("y", sp.subSectionY[2])
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", fs.sectionLabel)
            .attr("fill", "#333")
            .text("distance");

        // BOTTOM RIGHT: non-period day, wearables
        // Steps completion
        const STEPS_COMPLETION_SAMPLES = [2500, 7500, 10000, 15000];
        STEPS_COMPLETION_SAMPLES.forEach((steps, i) => {
            const completion = steps / stepGoal;
            const pad = bottomRight.append("g")
                .attr("transform", `translate(${i * sp.stepsGap + sp.flowerOffset}, ${sp.subSectionY[0]})`);
            drawLilypads(pad, { lilypadRadius: 14, completion }, false);
            bottomRight.append("text")
                .attr("x", i * sp.stepsGap + sp.flowerOffset)
                .attr("y", sp.subSectionY[0] + 35)
                .attr("text-anchor", "middle")
                .attr("font-size", fs.gradientLabel)
                .attr("fill", "#666")
                .text(steps.toLocaleString());
        });
        bottomRight.append("text")
            .attr("x", 10)
            .attr("y", sp.subSectionY[0])
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", fs.sectionLabel)
            .attr("fill", "#333")
            .text("steps");

        // Distance radius
        DISTANCE_SAMPLES.forEach((distance, i) => {
            const pad = bottomRight.append("g")
                .attr("transform", `translate(${i * sp.padDistGap + sp.flowerOffset}, ${sp.subSectionY[1] + 40})`);
            const radius = lilypadRadius(distance);
            drawLilypads(pad, { lilypadRadius: radius, completion: SAMPLE_COMPLETION }, false);
            bottomRight.append("text")
                .attr("x", i * sp.padDistGap + sp.flowerOffset)
                .attr("y", sp.subSectionY[1] + 80)
                .attr("text-anchor", "middle")
                .attr("font-size", fs.gradientLabel)
                .attr("fill", "#666")
                .text(`${(distance / 1000).toFixed(1)} km`);
        });
        bottomRight.append("text")
            .attr("x", 10)
            .attr("y", sp.subSectionY[1] + 40)
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", fs.sectionLabel)
            .attr("fill", "#333")
            .text("distance");

        // Curly braces for non-wearable / wearables grouping
        const tlB = getGroupBounds(topLeft);
        const trB = getGroupBounds(topRight);
        const blB = getGroupBounds(bottomLeft);
        const brB = getGroupBounds(bottomRight);

        const nwRowY1 = Math.min(tlB.y1, trB.y1) - 5;
        const nwRowY2 = Math.max(tlB.y2, trB.y2) + 5;
        const wRowY1 = Math.min(blB.y1, brB.y1) - 5;
        const wRowY2 = Math.max(blB.y2, brB.y2) + 5;

        const gridBraceX = Math.min(tlB.x1, blB.x1) - 8;
        const braceW = config.breakpoint === "tablet" ? 12 : 15;
        drawCurlyBrace(legend, gridBraceX, nwRowY1, nwRowY2, braceW, "non-wearable", fs.rowHeader);
        drawCurlyBrace(legend, gridBraceX, wRowY1, wRowY2, braceW, "wearables", fs.rowHeader);
    }

    // Center the legend within the content width
    const legendBBox = legend.node().getBBox();
    const legendCenterX = (contentWidth - legendBBox.width) / 2 - legendBBox.x;
    legend.attr("transform", `translate(${legendCenterX}, 20)`);


    // -------------- CALENDAR -------------- //

    const calendar = svg.append("g")
        .attr("class", "calendar")
        .attr("transform", `translate(0, ${config.LEGEND_HEIGHT})`);

    const monthsData = d3.group(data, d => `${d.date.getFullYear()}-${d.date.getMonth()}`);

    const monthGroups = calendar
        .selectAll("g.month")
        .data([...monthsData], ([key]) => key)
        .join("g")
        .attr("class", "month")
        .attr("transform", ([key, days]) => {
            const firstDay = days[0];
            const { y } = positionForDate(startDate, firstDay.date, config);
            return `translate(0, ${y})`;
        });

    const dayGroups = monthGroups.selectAll("g.day")
        .data(([key, days]) => days)
        .join("g")
        .attr("class", "day")
        .attr("transform", d => `translate(${config.PADDING_LEFT + (d.date.getDate() - 1) * config.CELL_SIZE}, 0)`);

    // Plot the data
    dayGroups.each(function (d) {
        const day = d3.select(this);

        if (d.cycleId != null) {
            if (d.steps == null && d.distance == null) {
                drawBudsWithRings(day, { intensity: d.intensity });
            } else {
                drawLilypads(day, lilypadOptionsForDay(d, lilypadRadius), true);
                drawFlower(day, flowerOptionsForDay(d));
            }
        } else {
            if (d.steps == null && d.distance == null) {
                drawBuds(day);
            } else {
                drawLilypads(day, lilypadOptionsForDay(d, lilypadRadius), false);
            }
        }
    });


    // -------------- TOOLTIPS -------------- //

    const tooltip = d3.select("#tooltip");

    dayGroups.insert("rect", ":first-child")
        .attr("class", "hit-area")
        .attr("x", -config.HIT_SIZE / 2)
        .attr("y", -config.HIT_SIZE / 2)
        .attr("width", config.HIT_SIZE)
        .attr("height", config.HIT_SIZE)
        .attr("fill", "transparent")
        .attr("pointer-events", "all");

    if (isMobile) {
        // Mobile: toast tooltip at bottom, tap to show, tap elsewhere to dismiss
        dayGroups
            .on("pointerenter", function (event, d) {
                tooltip
                    .html(tooltipContent(d))
                    .style("opacity", 1)
                    .style("left", "0")
                    .style("top", "auto")
                    .style("right", "0")
                    .style("bottom", "0");
            })
            .on("pointerleave", function () {
                // Don't immediately dismiss on mobile — let tap-elsewhere handle it
            });

        // Tap elsewhere to dismiss
        document.addEventListener("pointerdown", function (event) {
            if (!event.target.closest(".day") && !event.target.closest("#tooltip")) {
                tooltip.style("opacity", 0);
            }
        });
    } else {
        // Desktop/tablet: follow cursor with viewport clamping
        dayGroups
            .on("pointerenter", function (event, d) {
                tooltip
                    .html(tooltipContent(d))
                    .style("opacity", 1);
            })
            .on("pointermove", function (event) {
                const tooltipNode = tooltip.node();
                const tipW = tooltipNode.offsetWidth;
                const tipH = tooltipNode.offsetHeight;
                const container = document.getElementById("viz-container");
                const containerRect = container.getBoundingClientRect();

                // Position relative to the container
                let left = event.clientX - containerRect.left + 12;
                let top = event.clientY - containerRect.top + 12;

                // Clamp to stay within viewport
                if (left + tipW > containerRect.width) {
                    left = event.clientX - containerRect.left - tipW - 12;
                }
                if (top + tipH > containerRect.height) {
                    top = event.clientY - containerRect.top - tipH - 12;
                }
                if (left < 0) left = 4;
                if (top < 0) top = 4;

                tooltip
                    .style("left", left + "px")
                    .style("top", top + "px");
            })
            .on("pointerleave", function () {
                tooltip.style("opacity", 0);
            });
    }

    function tooltipContent(d) {
        const dateStr = d.date.toLocaleDateString("en-US", {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        const lines = [`<strong>${dateStr}</strong>`];

        if (d.cycleId != null) {
            const intensityWord = ["", "light", "medium", "heavy"][d.intensity] || `intensity ${d.intensity}`;
            lines.push(`Period day — ${intensityWord} flow`);
        }

        if (d.steps != null) {
            const completion = ((d.steps / stepGoal) * 100).toFixed(0);
            lines.push(`${d.steps.toLocaleString()} steps (${completion}% of goal)`);
        }

        if (d.distance != null) {
            lines.push(`${(d.distance / 1000).toFixed(2)} km walked`);
        }

        if (d.steps == null && d.distance == null) {
            lines.push(`<em>No movement data</em>`);
        }

        return lines.join("<br>");
    }


    // -------------- LABELS -------------- //

    svg
        .attr("viewBox", `0 0 ${contentWidth} ${contentHeight + config.LEGEND_HEIGHT}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    if (isMobile) {
        // On mobile, set explicit pixel width so container can scroll horizontally
        const scaleFactor = 1;
        svg.attr("width", contentWidth * scaleFactor);
        svg.attr("height", (contentHeight + config.LEGEND_HEIGHT) * scaleFactor);
    } else {
        // Tablet/desktop: fluid scaling via viewBox + CSS width:100%
        svg.attr("width", null);
        svg.attr("height", null);
    }

    monthGroups.append("text")
        .attr("class", "month-label")
        .attr("x", config.PADDING_LEFT - (isMobile ? 30 : 106))
        .attr("y", isMobile ? 0 : 74)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", fs.monthLabel)
        .attr("font-family", "sans-serif")
        .attr("fill", "#005b56")
        .text(([key, days]) => days[0].date.toLocaleDateString('en-US', { month: 'short' }));

    calendar
        .selectAll("text.day-label")
        .data(d3.range(1, 32))
        .join("text")
        .attr("class", "day-label")
        .attr("x", d => config.PADDING_LEFT + (d - 1) * config.CELL_SIZE)
        .attr("y", config.PADDING_TOP - (isMobile ? 15 : 30))
        .attr("text-anchor", "middle")
        .attr("font-size", fs.dayLabel)
        .attr("font-family", "sans-serif")
        .attr("fill", "#0d04ab")
        .text(d => d);

    const uniqueYears = [...new Set(data.map(d => d.date.getFullYear()))];
    const yearRanges = uniqueYears.map(year => {
        const daysInYear = data.filter(d => d.date.getFullYear() === year);
        const firstDay = daysInYear[0];
        const lastDay = daysInYear[daysInYear.length - 1];
        return { year, firstDay, lastDay };
    });

    calendar
        .selectAll("text.year-label")
        .data(yearRanges)
        .join("text")
        .attr("class", "year-label")
        .attr("text-anchor", "middle")
        .attr("font-size", fs.yearLabel)
        .attr("font-weight", "bold")
        .attr("font-family", "sans-serif")
        .attr("fill", "#333")
        .attr("transform", d => {
            const yFirst = positionForDate(startDate, d.firstDay.date, config).y;
            const yLast = positionForDate(startDate, d.lastDay.date, config).y;
            const yMid = (yFirst + yLast) / 2;
            const x = config.PADDING_LEFT - (isMobile ? 30 : 80);
            return `translate(${x}, ${yMid}) rotate(-90)`;
        })
        .text(d => d.year);
}


// -------------- DATA LOADING + RESIZE OBSERVER ----------------- //

let cachedData = null;
let cachedLilypadRadius = null;
let currentBreakpoint = null;

d3.json("combined-1.json").then(rawData => {
    cachedData = rawData.map(d => ({
        date: new Date(d.date),
        intensity: d.intensity,
        cycleId: d.cycle_id,
        steps: d.steps,
        distance: d.distance,
    }));

    const maxDistance = d3.max(cachedData, d => d.distance);
    cachedLilypadRadius = d3.scaleLinear()
        .domain([0, maxDistance])
        .range([5, 25])
        .clamp(false)
        .unknown(0);

    // Initial render
    const container = document.getElementById("viz-container");
    const config = getLayoutConfig(container.clientWidth);
    currentBreakpoint = config.breakpoint;
    render(cachedData, cachedLilypadRadius, config);

    // Dismiss scroll hint on first scroll (mobile)
    const scrollHint = container.querySelector(".scroll-hint");
    if (scrollHint) {
        container.addEventListener("scroll", function dismissHint() {
            scrollHint.style.display = "none";
            container.removeEventListener("scroll", dismissHint);
        }, { once: true });
    }

    // Resize observer: only re-render when breakpoint changes
    const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
            const width = entry.contentRect.width;
            const newConfig = getLayoutConfig(width);
            if (newConfig.breakpoint !== currentBreakpoint) {
                currentBreakpoint = newConfig.breakpoint;
                render(cachedData, cachedLilypadRadius, newConfig);
            }
        }
    });
    ro.observe(container);
});
