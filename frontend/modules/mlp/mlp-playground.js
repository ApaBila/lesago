import * as d3 from 'd3';

function getCssVariable(variableName) {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

let networkArchitecture = [
    { type: 'input', count: 2 },
    { type: 'hidden', count: 8 },
    { type: 'output', count: 1 }
];
let weights;
let isTraining = false;
let animationFrameId;
let trainingStepCount = 0;

const dataVizContainer = d3.select("#data-visualization");
const networkVizContainer = d3.select("#network-visualization");
const controlsContainer = d3.select("#mlp-controls");
let playPauseButton, resetButton, epochDisplay;

const vizSize = 350;
const nodeRadius = 12;
const learningRate = 0.03;

const dataSvg = dataVizContainer.append("svg").attr("viewBox", `0 0 ${vizSize} ${vizSize}`);
const heatmapGroup = dataSvg.append('g');
const pointsGroup = dataSvg.append('g');

const networkSvg = networkVizContainer.append("svg").attr("viewBox", `0 0 ${vizSize} ${vizSize}`);
    
const colorScale = d3.scaleDiverging([-1, 0, 1], ["rgba(166, 141, 124, 0.5)", getCssVariable('--color-background'), "rgba(143, 151, 121, 0.5)"]);
const xScale = d3.scaleLinear().domain([-5, 5]).range([0, vizSize]);
const yScale = d3.scaleLinear().domain([-5, 5]).range([vizSize, 0]);

function generateCircularData(numPoints, noise = 0.5) {
    const data = [];
    for (let i = 0; i < numPoints; i++) {
        const r = Math.random() * 4;
        const angle = Math.random() * 2 * Math.PI;
        const x = r * Math.cos(angle) + (Math.random() - 0.5) * noise;
        const y = r * Math.sin(angle) + (Math.random() - 0.5) * noise;
        const label = r < 2.5 ? 1 : -1;
        data.push({ x, y, label });
    }
    return data;
}
const dataset = generateCircularData(150);

function initializeWeights() {
    weights = [];
    for (let i = 0; i < networkArchitecture.length - 1; i++) {
        const inputCount = networkArchitecture[i].count;
        const outputCount = networkArchitecture[i+1].count;
        const layerWeights = d3.range(outputCount).map(() => 
            d3.range(inputCount + 1).map(() => Math.random() * 2 - 1)
        );
        weights.push(layerWeights);
    }
}

function forwardPass(input, returnAllActivations = false) {
    const allActivations = [[...input]];
    let currentActivations = [...input];

    for (let i = 0; i < weights.length; i++) {
        const layerWeights = weights[i];
        const biasedInput = [...currentActivations, 1];
        const nextActivations = [];
        for (const neuronWeights of layerWeights) {
            let z = 0;
            for (let j = 0; j < biasedInput.length; j++) {
                z += biasedInput[j] * neuronWeights[j];
            }
            nextActivations.push(Math.tanh(z));
        }
        currentActivations = nextActivations;
        allActivations.push(currentActivations);
    }
    return returnAllActivations ? allActivations : currentActivations[0];
}

function backpropagate(activations, target) {
    const errors = [];
    const output = activations[activations.length - 1][0];
    const outputError = (output - target) * (1 - output * output);
    errors[weights.length - 1] = [outputError];

    for (let i = weights.length - 2; i >= 0; i--) {
        const layerErrors = [];
        const nextLayerErrors = errors[i + 1];
        const layerActivations = activations[i+1];
        
        for (let j = 0; j < weights[i+1][0].length -1; j++) {
            let error = 0;
            for (let k = 0; k < nextLayerErrors.length; k++) {
                error += nextLayerErrors[k] * weights[i+1][k][j];
            }
            layerErrors.push(error * (1 - layerActivations[j] * layerActivations[j]));
        }
        errors[i] = layerErrors;
    }

    for (let i = 0; i < weights.length; i++) {
        const layerErrors = errors[i];
        const prevActivations = [...activations[i], 1];
        for (let j = 0; j < layerErrors.length; j++) {
            for (let k = 0; k < prevActivations.length; k++) {
                weights[i][j][k] -= learningRate * layerErrors[j] * prevActivations[k];
            }
        }
    }
}

function trainingStep() {
    if (!isTraining) return;
    
    for (let i = 0; i < 5; i++) {
        trainingStepCount++;
        d3.shuffle(dataset).slice(0, 10).forEach(d => {
            const allActivations = forwardPass([d.x, d.y], true);
            backpropagate(allActivations, d.label);
        });
    }
    
    epochDisplay.text(`Langkah: ${trainingStepCount}`);
    drawHeatmap();
    animationFrameId = requestAnimationFrame(trainingStep);
}

function drawHeatmap() {
    heatmapGroup.selectAll('*').remove();
    const resolution = 40;
    const grid = [];
    const step = 10 / resolution;
    for (let i = -5; i < 5; i += step) {
        for (let j = -5; j < 5; j += step) {
            grid.push({x: j, y: i, value: forwardPass([j, i])});
        }
    }

    heatmapGroup.selectAll('rect').data(grid).join('rect')
        .attr('x', d => xScale(d.x)).attr('y', d => yScale(d.y + step))
        .attr('width', vizSize / resolution + 1).attr('height', vizSize / resolution + 1)
        .attr('fill', d => colorScale(d.value));
}

function drawDataPoints() {
    pointsGroup.selectAll('*').remove();
    pointsGroup.selectAll('circle').data(dataset).join('circle')
        .attr('cx', d => xScale(d.x)).attr('cy', d => yScale(d.y))
        .attr('r', 3.5)
        .attr('fill', d => d.label === 1 ? getCssVariable('--color-mlp') : getCssVariable('--wc-color4'))
        .attr('stroke', getCssVariable('--color-surface')).attr('stroke-width', 1);
}

function calculateNodePositions(architecture) {
    const nodes = [];
    const layerGap = vizSize / (architecture.length);
    let cumulativeX = layerGap / 2;
    architecture.forEach((layer, i) => {
        const layerNodes = [];
        const yPosition = d3.scalePoint().domain(d3.range(layer.count)).range([0, vizSize]).padding(0.6);
        for (let j = 0; j < layer.count; j++) { layerNodes.push({ x: cumulativeX, y: yPosition(j) }); }
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
    networkSvg.selectAll('*').remove();
    const nodePositions = calculateNodePositions(networkArchitecture);
    const links = generateLinks(nodePositions);
    const flattenedNodes = nodePositions.flat();
    networkSvg.append("g").selectAll("line").data(links).join("line")
        .attr("class", "link").attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y).attr("stroke-width", 1);
    networkSvg.append("g").selectAll("circle").data(flattenedNodes).join("circle")
        .attr("class", "neuron").attr("cx", d => d.x).attr("cy", d => d.y)
        .attr("r", nodeRadius);
}

function drawControls() {
    controlsContainer.selectAll('*').remove();
    const layerControls = controlsContainer.append("div").attr("class", "layer-controls-container");

    networkArchitecture.forEach((layer, i) => {
        if (layer.type === 'hidden') {
            const controlGroup = layerControls.append("div").attr("class", "layer-control-group");
            controlGroup.append("span").text(`Lapisan ${i}`);
            const buttonGroup = controlGroup.append("div").attr("class", "button-group");
            buttonGroup.append("button").attr("class", "neuron-button").text("-").on("click", () => { if (layer.count > 1) { layer.count--; update(); } });
            buttonGroup.append("span").attr("class", "neuron-count").text(`${layer.count} neuron`);
            buttonGroup.append("button").attr("class", "neuron-button").text("+").on("click", () => { if (layer.count < 10) { layer.count++; update(); } });
            buttonGroup.append("button").attr("class", "remove-layer-button").html("&times;").on("click", () => { networkArchitecture.splice(i, 1); update(); });
        }
    });

    const mainActions = controlsContainer.append("div").attr("class", "main-actions");
    resetButton = mainActions.append("button").attr("id", "reset-button").text("Reset Bobot").on("click", () => update());
    playPauseButton = mainActions.append("button").attr("id", "play-pause-button").text("Latih Model").on("click", toggleTraining);
    mainActions.append("button").attr("id", "add-layer-button").text("Tambah Lapisan Tersembunyi").on("click", () => {
        const outputLayerIndex = networkArchitecture.findIndex(l => l.type === 'output');
        if (networkArchitecture.length - 2 < 5) {
             networkArchitecture.splice(outputLayerIndex, 0, { type: 'hidden', count: 3 });
             update();
        }
    });
    epochDisplay = mainActions.append("div").attr("class", "epoch-counter").text("Langkah: 0");
}

function toggleTraining() {
    isTraining = !isTraining;
    playPauseButton.text(isTraining ? "Jeda" : "Latih Model").classed("playing", isTraining);
    if (isTraining) {
        animationFrameId = requestAnimationFrame(trainingStep);
    } else {
        cancelAnimationFrame(animationFrameId);
    }
}

function update() {
    isTraining = false;
    cancelAnimationFrame(animationFrameId);
    
    trainingStepCount = 0;
    
    if (playPauseButton) {
        playPauseButton.text("Latih Model").classed("playing", false);
    }
    if (epochDisplay) {
        epochDisplay.text("Langkah: 0");
    }
    
    initializeWeights();
    drawHeatmap();
    drawDataPoints();
    drawNetwork();
    drawControls();
}

update();