// -------------- SETUP ----------------- //

const svgNS = "http://www.w3.org/2000/svg";
const svgContainer = document.getElementById("flower");


// -------------- DESIGN CONSTANTS ----------------- //

const petalPath = "M 0,0 C 30,60 30,60 0,100 C -30,60 -30,60 0,0";
const leafPath = "M 0,0 C 10,-90 70,-40 100,-110 C 100,-40 70,20 0,0";
const objectSize = d3.scaleLinear() // steps
        .domain([0, 12000])
        .range([0.1, 0.3])
        .clamp(true)
        .unknown(0.05);

const objectOpacity = d3.scaleLinear() // distance
        .domain([0, 10000])
        .range([0.3, 1]);

const flowerColor = d3.scaleSequential(d3.interpolatePlasma) // distance 
        .domain([0, 10000])
        .unknown("#dddff0");

const leafColor = d3.scaleSequential(d3.interpolateBuGn) // distance 
        .domain([0, 10000])
        .unknown("#dddff0");

const CELL_SIZE = 44;
const PADDING = 30;

// -------------- FUNCTIONS ----------------- //

function drawLeaf(x, y, orientation, options) {
    // orientation == true -> leaf as it is
    // orientation == false -> reflect leaf
    const size = options.leafSize;
    const opacity = options.leafOpacity;
    const color = options.color;
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", leafPath);
    path.setAttribute("fill", color);
    if (color == "#dddff0") {
        path.setAttribute("fill-opacity", opacity);
    }
    const flipX = orientation ? 1 : -1;
    path.setAttribute("transform", `translate(${x}, ${y}) scale(${flipX * size}, ${size})`);
    svgContainer.appendChild(path);
}

function drawFlower(x, y, options) {
    const petalCount = 5;
    const numLayers = options.numberOfLayers;
    const size = options.size;
    const opacity = options.opacity;
    const color = options.color;
    const flowerGroup = document.createElementNS(svgNS, "g");
    flowerGroup.setAttribute("transform", `translate(${x}, ${y})`);

    for (let i = 0; i < numLayers; i++) {
        for (let j = 0; j < petalCount; j++) {
            const angle = j * (360 / petalCount) + i * ((360 / petalCount) / numLayers);
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", petalPath);
            path.setAttribute("stroke", "white");
            path.setAttribute("stroke-width", "1");
            path.setAttribute("fill", color);
            // path.setAttribute("fill-opacity", opacity);
            path.setAttribute("transform", `rotate(${angle}) scale(${size})`);
            flowerGroup.appendChild(path);
        }
    }
    svgContainer.appendChild(flowerGroup);
}

function drawBuds(x, y) {
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "4");
    circle.setAttribute("fill", "steelblue");
    svgContainer.appendChild(circle);
}

function drawBudsWithRings(x, y, intensity) {
    const ringGroup = document.createElementNS(svgNS, "g");
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "4");
    circle.setAttribute("fill", "steelblue");
    svgContainer.appendChild(circle);
    ringGroup.setAttribute("transform", `translate(${x}, ${y})`);
    for (let i = 0; i < intensity; i++) {
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", 0);
        circle.setAttribute("cy", 0);
        circle.setAttribute("r", 8+5*i);
        circle.setAttribute("fill", "none")
        circle.setAttribute("stroke", "steelblue");
        ringGroup.appendChild(circle);
    }
    svgContainer.appendChild(ringGroup);
}

function flowerOptionsForDay(day) {
    return {
        numberOfLayers: day.intensity,
        size: objectSize(day.steps),
        opacity: objectOpacity(day.distance),
        color: flowerColor(day.distance)
    }
}

function leafOptionsForDay(day) {
    return {
        leafSize: objectSize(day.steps),
        leafOpacity: objectOpacity(day.distance),
        color: leafColor(day.distance)
    }
}

function positionForDate(startDate, date) {
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();

    const monthsSinceStart = (date.getFullYear() - startYear) * 12 + (date.getMonth() - startMonth);
    const dayOfMonth = date.getDate();
    return {
        x: PADDING + (dayOfMonth - 1) * CELL_SIZE,
        y: PADDING + monthsSinceStart * 1.25 * CELL_SIZE,
    };

}

// -------------- DATA ----------------- //

d3.json("combined.json").then(rawData => {
    const data = rawData.map(d => ({
        date: new Date(d.date),
        intensity: d.intensity,
        cycleId: d.cycle_id,
        steps: d.steps,
        distance: d.distance
    }));
    console.log(data);

    // data.slice(140, 150).forEach((day, i) => {
    //     const x = 100 + i * 80;
    //     const y = 200;
    //     if (day.cycleId != null) {
    //         drawFlower(x, y, flowerOptionsForDay(day));
    //     } else {
    //         drawLeaf(x, y, leafOptionsForDay(day));
    //     }
    // });

    const startDate = data[0].date; 
    data.forEach((day, i) => {
        const { x, y } = positionForDate(startDate, day.date);
        if (day.cycleId != null) {
            if (day.steps == null && day.distance == null) {
                drawBudsWithRings(x, y, day.intensity);
            } else {
                drawFlower(x, y, flowerOptionsForDay(day));
            }
        } else {
            if (day.steps == null && day.distance == null) {
                drawBuds(x, y);
            } else {
                if (i >= 1 && day.steps > data[i-1].steps && day.distance > data[i-1].distance) { // today > yesterday -> normal leaf
                    drawLeaf(x, y, true, leafOptionsForDay(day));
                } else if (i >= 1 && day.steps < data[i-1].steps && day.distance < data[i-1].distance) { // today < yesterday -> reflect leaf
                    drawLeaf(x, y, false, leafOptionsForDay(day));
                }
                drawLeaf(x, y, true, leafOptionsForDay(day));
            }
        }
    });

    svgContainer.attr("background", "black");

    // const legend = d3.select("#flower")
    //                 .append("svg")
    //                 .

    // const periodDays = data.filter(d => d.intensity != null);
    // const day = data[181];
    // console.log(day);
    // drawFlower(300, 100, flowerOptionsForDay(day));
    // drawLeaf(100, 100, leafOptionsForDay(data[100]));

});


