import { render, AttentionPatterns } from 'circuitsvis';

let currentPrompt = 'prompt1';
let currentLayer = 27;

const visContainer = document.getElementById('vis-container');
const controlButtons = document.querySelectorAll('.control-btn');

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

function handleControlClick(event) {
    const clickedButton = event.currentTarget;
    const { prompt, layer } = clickedButton.dataset;

    if (prompt) {
        currentPrompt = prompt;
    }
    if (layer) {
        currentLayer = layer;
    }

    controlButtons.forEach(btn => {
        const btnData = btn.dataset;
        if ((btnData.prompt && btnData.prompt === currentPrompt) || (btnData.layer && btnData.layer === currentLayer)) {
            btn.classList.add('active');
        } else if (btnData.prompt || btnData.layer) {
            const group = btnData.prompt ? 'prompt' : 'layer';
            const currentGroupValue = btnData.prompt ? currentPrompt : currentLayer;
            if (btnData[group] !== currentGroupValue) {
                btn.classList.remove('active');
            }
        }
    });

    loadAndRenderAttention();
}

controlButtons.forEach(button => {
    button.addEventListener('click', handleControlClick);
});

loadAndRenderAttention();