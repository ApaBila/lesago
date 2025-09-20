import Chart from 'chart.js/auto';

const dataPoints = [];
const regressionLine = [];
const canvasElement = document.getElementById('olsChart');
const ctx = canvasElement.getContext('2d');
const equationEl = document.getElementById('equation');
const sseEl = document.getElementById('sse');
const resetButton = document.getElementById('reset-button');

function calculateOLS(points) {
    const n = points.length;
    if (n < 2) return { m: 0, b: 0, sae: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (const p of points) {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumXX += p.x * p.x;
    }
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    let sae = 0;
    for (const p of points) {
        const predictedY = m * p.x + b;
        sae += Math.abs(p.y - predictedY);
    }

    return { m, b, sae };
}

function updateRegressionLine() {
    const { m, b, sae } = calculateOLS(dataPoints);
    
    regressionLine.length = 0;

    if (dataPoints.length > 1) {
        regressionLine.push({ x: 0, y: b }, { x: 100, y: m * 100 + b });
        equationEl.textContent = `Y = ${m.toFixed(2)}X + ${b.toFixed(2)}`;
        sseEl.textContent = `Total Error (Jumlah Jarak): ${sae.toFixed(2)}`;
    } else {
        equationEl.textContent = 'Y = mX + b';
        sseEl.textContent = 'Tambahkan setidaknya 2 titik untuk menghitung.';
    }
    chart.update();
}

const chart = new Chart(ctx, {
    type: 'scatter',
    data: {
        datasets: [{
            label: 'Titik Data',
            data: dataPoints,
            backgroundColor: 'rgba(111, 78, 55, 0.6)',
            pointRadius: 6,
            pointHoverRadius: 8
        }, {
            type: 'line',
            label: 'Garis Regresi',
            data: regressionLine,
            borderColor: 'rgba(217, 83, 79, 0.8)',
            borderWidth: 3,
            fill: false,
            tension: 0,
            pointRadius: 0
        }]
    },
    options: {
        aspectRatio: 1,
        scales: {
            x: { min: 0, max: 100, title: { display: true, text: 'Peubah X (contoh: Jam Belajar)' }},
            y: { min: 0, max: 100, title: { display: true, text: 'Peubah Y (contoh: Nilai Ujian)' }}
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                filter: (item) => item.datasetIndex === 0,
                callbacks: { label: (c) => `(x: ${c.raw.x.toFixed(2)}, y: ${c.raw.y.toFixed(2)})` }
            }
        }
    }
});

canvasElement.addEventListener('click', (event) => {
    const rect = canvasElement.getBoundingClientRect();
    const x = chart.scales.x.getValueForPixel(event.clientX - rect.left);
    const y = chart.scales.y.getValueForPixel(event.clientY - rect.top);

    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        dataPoints.push({ x, y });
        updateRegressionLine();
    }
});

resetButton.addEventListener('click', () => {
    dataPoints.length = 0;
    updateRegressionLine();
});

updateRegressionLine();