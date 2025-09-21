import * as d3 from 'd3';

const container = d3.select("#attention-container");
const inputContainer = container.select("#input-sentence");
const vizArea = container.select("#visualization-area");

const sentence = ["The", "quick", "brown", "fox", "jumps"];
let selectedTokenIndex = 0;

function initializeVisualization() {
    drawTokens();
    setupVisualization();
}

function drawTokens() {
    inputContainer.selectAll(".token")
        .data(sentence)
        .join("div")
        .attr("class", "token")
        .classed("selected", (d, i) => i === selectedTokenIndex)
        .text(d => d)
        .on("click", (event, d) => {
            const index = sentence.indexOf(d);
            selectedTokenIndex = index;
            drawTokens();
            updateVisualization();
        });
}

function setupVisualization() {
    const svg = vizArea.append("svg")
        .attr("width", "100%")
        .attr("viewBox", "0 0 720 400");
    
    svg.append("g").attr("class", "qkv-vectors");
    svg.append("g").attr("class", "scores");
    svg.append("g").attr("class", "softmax");
    svg.append("g").attr("class", "output");
    svg.append("g").attr("class", "labels");

    updateVisualization();
}

function updateVisualization() {
    const svg = vizArea.select("svg");
    const selectedToken = sentence[selectedTokenIndex];
    
    svg.select(".labels").selectAll("text").remove();
    svg.select(".labels").append("text")
        .attr("x", 360)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "1.2em")
        .style("font-family", "var(--font-heading)")
        .text(`Attention calculation for: "${selectedToken}"`);
}

initializeVisualization();