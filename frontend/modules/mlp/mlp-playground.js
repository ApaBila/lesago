import * as d3 from 'd3';

const networkArchitecture = [
    { type: 'input', count: 2 },
    { type: 'hidden', count: 4 },
    { type: 'hidden', count: 3 },
    { type: 'output', count: 2 }
];

const vizContainer = d3.select("#mlp-visualization");
const controlsContainer = d3.select("#mlp-controls");
const width = 720;
const height = 400;
const nodeRadius = 15;

const svg = vizContainer.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

function calculateNodePositions(architecture) {
    const nodes = [];
    const layerGap = width / (architecture.length);
    let cumulativeX = layerGap / 2;

    architecture.forEach((layer, i) => {
        const layerNodes = [];
        const yPosition = d3.scalePoint()
            .domain(d3.range(layer.count))
            .range([0, height])
            .padding(0.5);
        
        for (let j = 0; j < layer.count; j++) {
            layerNodes.push({
                x: cumulativeX,
                y: yPosition(j),
                layer: i,
                index: j
            });
        }
        nodes.push(layerNodes);
        cumulativeX += layerGap;
    });
    return nodes;
}

function generateLinks(nodes) {
    const links = [];
    for (let i = 0; i < nodes.length - 1; i++) {
        for (const startNode of nodes[i]) {
            for (const endNode of nodes[i + 1]) {
                links.push({ source: startNode, target: endNode });
            }
        }
    }
    return links;
}

function drawNetwork() {
    svg.selectAll('*').remove();
    
    const nodePositions = calculateNodePositions(networkArchitecture);
    const links = generateLinks(nodePositions);
    const flattenedNodes = nodePositions.flat();

    svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("class", "link")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .attr("stroke-width", 1.5);

    svg.append("g")
        .selectAll("circle")
        .data(flattenedNodes)
        .join("circle")
        .attr("class", "neuron")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", nodeRadius);
}

function drawControls() {
    controlsContainer.selectAll('*').remove();

    const layerControls = controlsContainer.append("div")
        .attr("class", "layer-controls-container");

    networkArchitecture.forEach((layer, i) => {
        if (layer.type === 'hidden') {
            const controlGroup = layerControls.append("div")
                .attr("class", "layer-control-group");

            controlGroup.append("span").text(`Lapisan ${i}`);
            
            const buttonGroup = controlGroup.append("div").attr("class", "button-group");

            buttonGroup.append("button")
                .attr("class", "neuron-button")
                .text("-")
                .on("click", () => {
                    if (layer.count > 1) {
                        layer.count--;
                        update();
                    }
                });
            
            buttonGroup.append("span")
                .attr("class", "neuron-count")
                .text(`${layer.count} neuron`);

            buttonGroup.append("button")
                .attr("class", "neuron-button")
                .text("+")
                .on("click", () => {
                    if (layer.count < 8) {
                        layer.count++;
                        update();
                    }
                });
            
            buttonGroup.append("button")
                .attr("class", "remove-layer-button")
                .html("&times;")
                .on("click", () => {
                    networkArchitecture.splice(i, 1);
                    update();
                });
        }
    });

    const mainActions = controlsContainer.append("div")
        .attr("class", "main-actions");

    mainActions.append("button")
        .text("Tambah Lapisan Tersembunyi")
        .on("click", () => {
            const outputLayerIndex = networkArchitecture.findIndex(l => l.type === 'output');
            if (networkArchitecture.length < 7) {
                 networkArchitecture.splice(outputLayerIndex, 0, { type: 'hidden', count: 3 });
                 update();
            }
        });
}

function update() {
    drawNetwork();
    drawControls();
}

update();