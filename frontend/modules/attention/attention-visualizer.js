import { render, AttentionPatterns } from 'circuitsvis';

let currentPrompt = 'prompt1';
let currentLayer = '0';

const visContainer = document.getElementById('vis-container');
const promptButtons = document.querySelectorAll('.control-btn[data-prompt]');
const layerButtons = document.querySelectorAll('.control-btn[data-layer]');

async function loadAndRenderAttention() {
    if (!visContainer) return;
    visContainer.innerHTML = 'Loading...';

    const filename = `/${currentPrompt}_layer_${currentLayer}_all_heads.json`;

    try {
        const response = await fetch(filename);
        if (!response.ok) throw new Error(`File not found: ${filename}`);
        const data = await response.json();

        render('vis-container', AttentionPatterns, {
            tokens: data.tokens,
            attention: data.attention,
        });
    } catch (error) {
        console.error('Error rendering visualization:', error);
        visContainer.textContent = `Error: Could not load data for ${filename}.`;
    }
}

function updateActiveButtons() {
    promptButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.prompt === currentPrompt));
    layerButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.layer === currentLayer));
}

promptButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        currentPrompt = e.currentTarget.dataset.prompt;
        updateActiveButtons();
        loadAndRenderAttention();
    });
});

layerButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        currentLayer = e.currentTarget.dataset.layer;
        updateActiveButtons();
        loadAndRenderAttention();
    });
});

updateActiveButtons();
loadAndRenderAttention();