import Chart from 'chart.js/auto';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function getCssVariable(variableName) {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

const dataPoints = [];
const regressionLine = [];
const olsCanvas = document.getElementById('olsChart');
const equationEl = document.getElementById('equation');
const sseEl = document.getElementById('sse');
const resetButton = document.getElementById('reset-button');
const projectionContainer = document.getElementById('projectionScene');
let draggedPointIndex = null;

function calculateOLS(points) {
    const n = points.length;
    if (n < 2) return { m: 0, b: 0, sae: 0 };
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (const p of points) {
        sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumXX += p.x * p.x;
    }
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    let sae = 0;
    for (const p of points) {
        sae += Math.abs(p.y - (m * p.x + b));
    }
    return { m, b, sae };
}

const olsChart = new Chart(olsCanvas.getContext('2d'), {
    type: 'scatter',
    data: {
        datasets: [{
            label: 'Titik Data', data: dataPoints, backgroundColor: getCssVariable('--color-ols'), pointRadius: 6, pointHoverRadius: 8
        }, {
            type: 'line', label: 'Garis Regresi', data: regressionLine, borderColor: '#d9534f', borderWidth: 3, fill: false, tension: 0, pointRadius: 0
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
            tooltip: { filter: (item) => item.datasetIndex === 0, callbacks: { label: (c) => `(x: ${c.raw.x.toFixed(2)}, y: ${c.raw.y.toFixed(2)})` } }
        }
    }
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(getCssVariable('--color-background'));
const camera = new THREE.PerspectiveCamera(50, projectionContainer.clientWidth / 500, 0.1, 1000);
camera.position.set(5, 4, 10);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(projectionContainer.clientWidth, 500);
projectionContainer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

let vectorY, vectorYhat, errorVector, modelPlane;

function createVectorArrow(vector, color, origin = new THREE.Vector3(0, 0, 0)) {
    const length = vector.length();
    if (length < 0.001) return new THREE.Object3D();
    const dir = vector.clone().normalize();
    return new THREE.ArrowHelper(dir, origin, length, color, length * 0.15, length * 0.07);
}

function updateProjectionScene(points) {
    if (vectorY) scene.remove(vectorY, vectorYhat, errorVector, modelPlane);

    if (points.length < 3) {
        if(modelPlane) scene.remove(modelPlane);
        document.getElementById('pythagoras-result').innerHTML = 'Tambahkan setidaknya 3 titik untuk visualisasi 3D.';
        return;
    }

    const xArr = points.map(p => p.x);
    const yArr = points.map(p => p.y);
    const { m, b } = calculateOLS(points);
    const yHatArr = points.map(p => m * p.x + b);

    const xVec = new THREE.Vector3(xArr[0], xArr[1], xArr[2]).multiplyScalar(0.05);
    const yVec = new THREE.Vector3(yArr[0], yArr[1], yArr[2]).multiplyScalar(0.05);
    const yHatVec = new THREE.Vector3(yHatArr[0], yHatArr[1], yHatArr[2]).multiplyScalar(0.05);

    vectorY = createVectorArrow(yVec, new THREE.Color(getCssVariable('--color-ols')));
    vectorYhat = createVectorArrow(yHatVec, new THREE.Color('#d9534f'));
    const errorVec3 = new THREE.Vector3().subVectors(yVec, yHatVec);
    errorVector = createVectorArrow(errorVec3, new THREE.Color(getCssVariable('--color-attention')), yHatVec);
    
    const interceptBasis = new THREE.Vector3(1, 1, 1).normalize();
    const planeNormal = new THREE.Vector3().crossVectors(xVec, interceptBasis).normalize();
    
    const planeGeometry = new THREE.PlaneGeometry(15, 15);
    const planeMaterial = new THREE.MeshPhongMaterial({color: 0xcccccc, transparent: true, opacity: 0.3, side: THREE.DoubleSide});
    modelPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    modelPlane.lookAt(planeNormal);
    
    scene.add(vectorY, vectorYhat, errorVector, modelPlane);
    
    const lenSqY = yVec.lengthSq();
    const lenSqYhat = yHatVec.lengthSq();
    const lenSqError = errorVec3.lengthSq();

    document.getElementById('pythagoras-result').innerHTML = `
        (Jarak Total)² = <strong>${lenSqY.toFixed(2)}</strong><br>
        (Jarak Prediksi)² + (Jarak Error)² = ${lenSqYhat.toFixed(2)} + ${lenSqError.toFixed(2)} = <strong>${(lenSqYhat + lenSqError).toFixed(2)}</strong>
    `;
}

function updateVisuals() {
    const { m, b, sae } = calculateOLS(dataPoints);
    regressionLine.length = 0;
    if (dataPoints.length > 1) {
        regressionLine.push({ x: 0, y: b }, { x: 100, y: m * 100 + b });
        equationEl.textContent = `Yhat = ${m.toFixed(2)}X + ${b.toFixed(2)}`;
        sseEl.textContent = `Total Error (Jumlah Jarak): ${sae.toFixed(2)}`;
    } else {
        equationEl.textContent = 'Yhat = mX + b';
        sseEl.textContent = 'Tambahkan setidaknya 2 titik untuk menghitung.';
    }
    olsChart.update();
    updateProjectionScene(dataPoints);
}

olsCanvas.addEventListener('mousedown', (event) => {
    const points = olsChart.getElementsAtEventForMode(event, 'point', { intersect: true }, true);
    if (points.length) {
        draggedPointIndex = points[0].index;
        olsChart.options.animation = false;
    }
});
olsCanvas.addEventListener('mousemove', (event) => {
    if (draggedPointIndex !== null) {
        const rect = olsCanvas.getBoundingClientRect();
        const x = olsChart.scales.x.getValueForPixel(event.clientX - rect.left);
        const y = olsChart.scales.y.getValueForPixel(event.clientY - rect.top);
        if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
            dataPoints[draggedPointIndex].x = x;
            dataPoints[draggedPointIndex].y = y;
            updateVisuals();
        }
    }
});
olsCanvas.addEventListener('mouseup', (event) => {
    if (draggedPointIndex === null) {
        const rect = olsCanvas.getBoundingClientRect();
        const x = olsChart.scales.x.getValueForPixel(event.clientX - rect.left);
        const y = olsChart.scales.y.getValueForPixel(event.clientY - rect.top);
        if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
            dataPoints.push({ x, y });
            updateVisuals();
        }
    }
    draggedPointIndex = null;
    olsChart.options.animation = true;
});

resetButton.addEventListener('click', () => {
    dataPoints.length = 0;
    updateVisuals();
});

window.addEventListener('resize', () => {
    const width = projectionContainer.clientWidth;
    renderer.setSize(width, 500);
    camera.aspect = width / 500;
    camera.updateProjectionMatrix();
});

updateVisuals();

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

