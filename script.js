// -------------- SETUP ----------------- //

const svgNS = "http://www.w3.org/2000/svg";
const svgContainer = document.getElementById("flower");


// -------------- DESIGN CONSTANTS ----------------- //
let globalMaxDistance;
const stepGoal = 10000; // according to my suunto watch
const petalPath = "M 0,0 C 30,60 30,60 0,100 C -30,60 -30,60 0,0";
const leafPath = "M 0,0 C 10,-90 70,-40 100,-110 C 100,-40 70,20 0,0";
const objectSize = d3.scaleLinear() // steps
    .domain([0, 12000])
    .range([0.2, 0.3])
    .clamp(true)
    .unknown(0.05);



// const lilypadAngle = d3.scaleLinear()
//         .domain(0, 10000)
//         .range(0, Math.PI * 2)
//         .clamp(false)
//         .unknown(0);


const objectOpacity = d3.scaleLinear() // distance
    .domain([0, 10000])
    .range([0.3, 1]);

const flowerColor = d3.scaleSequential(d3.interpolatePlasma) // distance 
    .domain([0, 10000])
    .unknown("#dddff0");

const leafColor = d3.scaleSequential(d3.interpolateYlGnBu) // distance 
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
    // const opacity = options.opacity;
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
            path.setAttribute("fill-opacity", 1 - 0.1 * i);
            path.setAttribute("transform", `rotate(${angle}) scale(${size})`);
            flowerGroup.appendChild(path);
        }
    }
    svgContainer.appendChild(flowerGroup);
}

function drawBuds(x, y) {
    const budColor = "#1e32eb"
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "4");
    circle.setAttribute("fill", budColor);
    svgContainer.appendChild(circle);
}

function drawBudsWithRings(x, y, intensity) {
    const budColor = "#1e32eb"
    const ringColor = "#1e32eb";
    const ringGroup = document.createElementNS(svgNS, "g");
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "4");
    circle.setAttribute("fill", budColor);
    svgContainer.appendChild(circle);
    ringGroup.setAttribute("transform", `translate(${x}, ${y})`);
    for (let i = 0; i < intensity; i++) {
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", 0);
        circle.setAttribute("cy", 0);
        circle.setAttribute("r", 8 + 5 * i);
        circle.setAttribute("fill", "none")
        circle.setAttribute("stroke", ringColor);
        ringGroup.appendChild(circle);
    }
    svgContainer.appendChild(ringGroup);
}

// opacityDimmed == true  -> pad rendered faded (used behind a flower)
// opacityDimmed == false -> pad rendered solid (standalone)
function drawLilypads(x, y, opacityDimmed, options) {
    const backgroundColor = opacityDimmed ? "#fefec169" : "#fefec1fd";
    const mainColor = opacityDimmed ? "#65ad3e6e" : "#65ad3e";
    const overlapColor = opacityDimmed ? "#06420e6f" : "#06420e";
    const lilypadRadius = opacityDimmed ?  6 : options.lilypadRadius;
    const completion = options.completion;

    const baseCompletion = Math.min(completion, 1);
    const excessCompletion = Math.max(0, Math.min(completion - 1, 1));

    const padGroup = document.createElementNS(svgNS, "g");
    const circle = document.createElementNS(svgNS, "circle");
    
    circle.setAttribute("cx", 0);
    circle.setAttribute("cy", 0);
    circle.setAttribute("r", lilypadRadius);
    circle.setAttribute("fill", backgroundColor);
    padGroup.appendChild(circle);
    padGroup.setAttribute("transform", `translate(${x}, ${y})`);

    if (baseCompletion > 0) {
        const achievementArc = d3.arc()
            .innerRadius(0)
            .outerRadius(lilypadRadius)
            .startAngle(0)
            .endAngle(-Math.PI * 2 * baseCompletion);

        const arcPath = document.createElementNS(svgNS, "path");
        arcPath.setAttribute("d", achievementArc());
        arcPath.setAttribute("fill", mainColor);
        padGroup.appendChild(arcPath);
    }

    if (excessCompletion > 0) {
        const excessArc = d3.arc()
            .innerRadius(0)
            .outerRadius(lilypadRadius)
            .startAngle(0)
            .endAngle(-Math.PI * 2 * excessCompletion);

        const arcPath = document.createElementNS(svgNS, "path");
        arcPath.setAttribute("d", excessArc());
        arcPath.setAttribute("fill", overlapColor);
        padGroup.appendChild(arcPath);
    }
    svgContainer.appendChild(padGroup);
}

function lilypadOptionsForDay(day, lilypadRadius) {
    const rawCompletion = day.steps != null ? day.steps / stepGoal : 0;
    return {
        lilypadRadius: lilypadRadius(day.distance),
        completion: rawCompletion
    }

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

    globalMaxDistance = d3.max(data, d => d.distance);
    const lilypadRadius = d3.scaleLinear()
        .domain([0, globalMaxDistance])
        .range([5, 20])
        .clamp(false)
        .unknown(0);

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
                drawLilypads(x, y, true, lilypadOptionsForDay(day, lilypadRadius));

            }
        } else {
            if (day.steps == null && day.distance == null) {
                drawBuds(x, y);
            } else {

                drawLilypads(x, y, false, lilypadOptionsForDay(day, lilypadRadius));
            }
        }
    });


    // svgContainer.attr("background", "black");

    // const legend = d3.select("#flower")
    //                 .append("svg")
    //                 .

    // const periodDays = data.filter(d => d.intensity != null);
    // const day = data[181];
    // console.log(day);
    // drawFlower(300, 100, flowerOptionsForDay(day));
    // drawLeaf(100, 100, leafOptionsForDay(data[100]));

});


