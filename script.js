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

const flowerColor = d3.scaleSequential(d3.interpolatePlasma) // steps -> flower color
    .domain([0, 20000])
    .clamp(false);

const CELL_SIZE = 54;
const ROW_HEIGHT = 60 * 1.55;        // vertical space per month, including gap
const PADDING_TOP = 60;
const PADDING_LEFT = 120;

// Legend grid dimensions
const LEGEND_HEIGHT = 600;
const LEGEND_COL_WIDTH = 350;        // each main column is wide
const LEGEND_HEADER_Y = 60;          // where column headers sit
const LEGEND_LABEL_X = 100;          // where row labels sit (right-aligned)
const LEGEND_GRID_OFFSET_X = 180;    // where the grid cells start, leaving room for row labels
const ROW_Y = [100, 280];            // y-coordinate for top row, bottom row

// Sample values used across the wearables legend
const SAMPLE_STEPS = 7500;
const SAMPLE_DISTANCE = 5000;
const SAMPLE_COMPLETION = 0.7;

// Distance samples (in meters) used to drive legend flower sizes and pad radii
const DISTANCE_SAMPLES = [3000, 7000, 11000];


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

// Defines dimensions of legend grid cells
function legendCell(col, row) {
    return {
        x: LEGEND_GRID_OFFSET_X + col * LEGEND_COL_WIDTH,
        y: ROW_Y[row],
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

function positionForDate(startDate, date) {
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();

    const monthsSinceStart = (date.getFullYear() - startYear) * 12 + (date.getMonth() - startMonth);
    const dayOfMonth = date.getDate();
    return {
        x: PADDING_LEFT + (dayOfMonth - 1) * CELL_SIZE,
        y: PADDING_TOP + monthsSinceStart * ROW_HEIGHT,
    };
}


// -------------- DATA ----------------- //

d3.json("combined-1.json").then(rawData => {
    const data = rawData.map(d => ({
        date: new Date(d.date),
        intensity: d.intensity,
        cycleId: d.cycle_id,
        steps: d.steps,
        distance: d.distance,
    }));

    const maxDistance = d3.max(data, d => d.distance);
    const lilypadRadius = d3.scaleLinear()
        .domain([0, maxDistance])
        .range([5, 25])
        .clamp(false)
        .unknown(0);


    // -------------- LEGEND -------------- //

    const legend = d3.select("#flower")
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${PADDING_LEFT}, 20)`);

    // One <g> per grid cell, translated to its grid coordinates
    const topLeft = legend.append("g")
        .attr("class", "legend-cell")
        .attr("transform", `translate(${legendCell(0, 0).x}, ${legendCell(0, 0).y})`);

    const topRight = legend.append("g")
        .attr("class", "legend-cell")
        .attr("transform", `translate(${legendCell(1, 0).x}, ${legendCell(1, 0).y})`);

    const bottomLeft = legend.append("g")
        .attr("class", "legend-cell")
        .attr("transform", `translate(${legendCell(0, 1).x}, ${legendCell(0, 1).y})`);

    const bottomRight = legend.append("g")
        .attr("class", "legend-cell")
        .attr("transform", `translate(${legendCell(1, 1).x}, ${legendCell(1, 1).y})`);

    // Column headers (period day, non-period day)
    legend.selectAll("text.col-header")
        .data(["period day", "non-period day"])
        .join("text")
        .attr("class", "col-header")
        .attr("x", (d, i) => legendCell(i, 0).x + 80)
        .attr("y", LEGEND_HEADER_Y)
        .attr("text-anchor", "middle")
        .attr("font-size", 20)
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .text(d => d);

    // Row headers (non-wearable data, wearables data)
    legend.selectAll("text.row-header")
        .data(["non-wearable data", "wearables data"])
        .join("text")
        .attr("class", "row-header")
        .attr("x", LEGEND_LABEL_X)
        .attr("y", (d, i) => legendCell(0, i).y + 40)
        .attr("text-anchor", "end")
        .attr("font-size", 18)
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .text(d => d);

    // ---- TOP LEFT: period day, non-wearable (buds-with-rings at intensities 1, 2, 3) ----
    [1, 2, 3].forEach((intensity, i) => {
        const bud = topLeft.append("g")
            .attr("transform", `translate(${i * 80 + 40}, 30)`);
        drawBudsWithRings(bud, { intensity });

        topLeft.append("text")
            .attr("x", i * 80 + 40)
            .attr("y", 80)
            .attr("text-anchor", "middle")
            .attr("font-size", 12)
            .attr("fill", "#666")
            .text(intensity);
    });
    topLeft.append("text")
        .attr("x", 10)
        .attr("y", 30)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 14)
        .attr("fill", "#333")
        .text("intensity");

    // ---- TOP RIGHT: non-period day, non-wearable (single bud) ----
    const bud = topRight.append("g")
        .attr("transform", "translate(40, 30)");
    drawBuds(bud);

    // ---- BOTTOM LEFT: period day, wearables ----

    // Sub-section 1: Intensity — vary numberOfLayers, hold everything else
    [1, 2, 3].forEach((intensity, i) => {
        const flower = bottomLeft.append("g")
            .attr("transform", `translate(${i * 80 + 40}, 30)`);
        drawFlower(flower, {
            numberOfLayers: intensity,
            size: 0.25,                              // HELD
            color: flowerColor(SAMPLE_STEPS),        // HELD
        });
        bottomLeft.append("text")
            .attr("x", i * 80 + 40)
            .attr("y", 80)
            .attr("text-anchor", "middle")
            .attr("font-size", 12)
            .attr("fill", "#666")
            .text(intensity);
    });
    bottomLeft.append("text")
        .attr("x", 10)
        .attr("y", 30)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 14)
        .attr("fill", "#333")
        .text("intensity");

    // Sub-section 2: Steps — color gradient bar (steps drives flower color)
    const barWidth = 200;
    const gradientSteps = 50;
    bottomLeft.selectAll("rect.gradient")
        .data(d3.range(gradientSteps))
        .join("rect")
        .attr("class", "gradient")
        .attr("x", i => 40 + (i / gradientSteps) * barWidth)
        .attr("y", 130)
        .attr("width", barWidth / gradientSteps + 1)
        .attr("height", 16)
        .attr("fill", i => flowerColor((i / gradientSteps) * 20000));

    // Endpoint labels
    bottomLeft.append("text")
        .attr("x", 40)
        .attr("y", 160)
        .attr("text-anchor", "start")
        .attr("font-size", 10)
        .attr("fill", "#666")
        .text("0 steps");

    bottomLeft.append("text")
        .attr("x", 40 + barWidth)
        .attr("y", 160)
        .attr("text-anchor", "end")
        .attr("font-size", 10)
        .attr("fill", "#666")
        .text("20,000 steps");

    // Section label
    bottomLeft.append("text")
        .attr("x", 10)
        .attr("y", 138)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 14)
        .attr("fill", "#333")
        .text("steps");

    // Sub-section 3: Distance — vary size by distance (distance drives flower size)
    DISTANCE_SAMPLES.forEach((distance, i) => {
        const flower = bottomLeft.append("g")
            .attr("transform", `translate(${i * 80 + 40}, 200)`);
        drawFlower(flower, {
            numberOfLayers: 2,                      // HELD
            size: objectSize(distance),
            color: flowerColor(SAMPLE_STEPS),       // HELD
        });

        // Label below each flower
        bottomLeft.append("text")
            .attr("x", i * 80 + 40)
            .attr("y", 240)
            .attr("text-anchor", "middle")
            .attr("font-size", 10)
            .attr("fill", "#666")
            .text(`${(distance / 1000).toFixed(1)} km`);
    });
    bottomLeft.append("text")
        .attr("x", 10)
        .attr("y", 200)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 14)
        .attr("fill", "#333")
        .text("distance");

    // ---- BOTTOM RIGHT: non-period day, wearables ----

    // Sub-section 1: Steps (arc completion) — vary completion, hold radius
    const STEPS_COMPLETION_SAMPLES = [2500, 7500, 10000, 15000];
    STEPS_COMPLETION_SAMPLES.forEach((steps, i) => {
        const completion = steps / stepGoal;

        const pad = bottomRight.append("g")
            .attr("transform", `translate(${i * 60 + 60}, 30)`);
        drawLilypads(pad, {
            lilypadRadius: 14,                       // HELD
            completion,
        }, false);

        bottomRight.append("text")
            .attr("x", i * 60 + 60)
            .attr("y", 65)
            .attr("text-anchor", "middle")
            .attr("font-size", 10)
            .attr("fill", "#666")
            .text(steps.toLocaleString());
    });
    bottomRight.append("text")
        .attr("x", 10)
        .attr("y", 30)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 14)
        .attr("fill", "#333")
        .text("steps");

    // Sub-section 2: Distance (radius) — vary radius, hold completion
    DISTANCE_SAMPLES.forEach((distance, i) => {
        const pad = bottomRight.append("g")
            .attr("transform", `translate(${i * 80 + 60}, 150)`);

        const radius = lilypadRadius(distance);
        drawLilypads(pad, {
            lilypadRadius: radius,
            completion: SAMPLE_COMPLETION,           // HELD
        }, false);

        bottomRight.append("text")
            .attr("x", i * 80 + 60)
            .attr("y", 190)
            .attr("text-anchor", "middle")
            .attr("font-size", 10)
            .attr("fill", "#666")
            .text(`${(distance / 1000).toFixed(1)} km`);
    });
    bottomRight.append("text")
        .attr("x", 10)
        .attr("y", 150)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 14)
        .attr("fill", "#333")
        .text("distance");


    // -------------- CALENDAR -------------- //

    const startDate = data[0].date;

    const calendar = d3.select("#flower")
        .append("g")
        .attr("class", "calendar")
        .attr("transform", `translate(0, ${LEGEND_HEIGHT})`);

    const monthsData = d3.group(data, d => `${d.date.getFullYear()}-${d.date.getMonth()}`);

    const monthGroups = calendar
        .selectAll("g.month")
        .data([...monthsData], ([key, days]) => key)
        .join("g")
        .attr("class", "month")
        .attr("transform", ([key, days]) => {
            const firstDay = days[0];
            const { y } = positionForDate(startDate, firstDay.date);
            return `translate(0, ${y})`;
        });

    const dayGroups = monthGroups.selectAll("g.day")
        .data(([key, days]) => days)
        .join("g")
        .attr("class", "day")
        .attr("transform", d => `translate(${PADDING_LEFT + (d.date.getDate() - 1) * CELL_SIZE}, 0)`);

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

    // Month, day, and year labels
    const allPositions = data.map(d => positionForDate(startDate, d.date));
    const maxX = Math.max(...allPositions.map(p => p.x));
    const maxY = Math.max(...allPositions.map(p => p.y));
    const contentWidth = maxX + CELL_SIZE;
    const contentHeight = maxY + CELL_SIZE;

    d3.select("#flower")
        .attr("viewBox", `0 0 ${contentWidth} ${contentHeight + LEGEND_HEIGHT}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    monthGroups.append("text")
        .attr("class", "month-label")
        .attr("x", PADDING_LEFT - 106)
        .attr("y", 70)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 15)
        .attr("font-family", "sans-serif")
        .attr("fill", "#005b56")
        .text(([key, days]) => days[0].date.toLocaleDateString('en-US', { month: 'short' }));

    calendar
        .selectAll("text.day-label")
        .data(d3.range(1, 32))
        .join("text")
        .attr("class", "day-label")
        .attr("x", d => PADDING_LEFT + (d - 1) * CELL_SIZE)
        .attr("y", PADDING_TOP - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", 9)
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
        .attr("font-size", 20)
        .attr("font-weight", "bold")
        .attr("font-family", "sans-serif")
        .attr("fill", "#333")
        .attr("transform", d => {
            const yFirst = positionForDate(startDate, d.firstDay.date).y;
            const yLast = positionForDate(startDate, d.lastDay.date).y;
            const yMid = (yFirst + yLast) / 2;
            const x = PADDING_LEFT - 60;
            return `translate(${x}, ${yMid}) rotate(-90)`;
        })
        .text(d => d.year);
});