import { Process } from './models.js';
import { fcfs, sjf, srtf, rr } from './algorithms.js';
import { renderProcessTable, renderResultsTimeline, renderGantt, renderPerProcessMetrics, renderSystemSummary } from './ui.js';

const state = {
  processes: [],
  timeline: [],
  resultProcs: [],
};

// DOM refs
const form = document.getElementById('process-form');
const idInput = document.getElementById('p-id');
const arrivalInput = document.getElementById('p-arrival');
const burstInput = document.getElementById('p-burst');
const blockStartInput = document.getElementById('p-block-start');
const blockDurationInput = document.getElementById('p-block-duration');
const clearBtn = document.getElementById('btn-clear');
const processTableBody = document.querySelector('#process-table tbody');

const algoSelect = document.getElementById('algo-select');
const quantumInput = document.getElementById('rr-quantum');
const quantumField = document.getElementById('quantum-field');
const runBtn = document.getElementById('btn-run');
const demoBtn = document.getElementById('btn-demo');

const gantt = document.getElementById('gantt');
const perProcMetricsBody = document.querySelector('#per-process-metrics tbody');
const qBadge = document.getElementById('q-badge');
const systemSummaryBody = document.querySelector('#system-summary tbody');

// Métricas compactas removidas; se usan tablas completas

function addProcessFromForm() {
  const id = idInput.value.trim();
  const arrival = Number(arrivalInput.value);
  const burst = Number(burstInput.value);
  const blockStart = Number(blockStartInput.value);
  const blockDuration = Number(blockDurationInput.value);
  if (!id || isNaN(arrival) || isNaN(burst) || burst <= 0) return;
  if (state.processes.find(p => p.id === id)) {
    alert('ID de proceso ya existe');
    return;
  }
  state.processes.push(new Process({ id, arrival, burst, blockStart, blockDuration }));
  renderProcessTable(processTableBody, state.processes, deleteProcess);
  form.reset();
}

function deleteProcess(id) {
  state.processes = state.processes.filter(p => p.id !== id);
  renderProcessTable(processTableBody, state.processes, deleteProcess);
}

function clearAll() {
  state.processes = [];
  state.timeline = [];
  state.resultProcs = [];
  renderProcessTable(processTableBody, state.processes, deleteProcess);
  gantt.innerHTML = '';
  renderPerProcessMetrics(perProcMetricsBody, []);
  renderSystemSummary(systemSummaryBody, [], []);
  updateQBadge();
}

function run() {
  if (!state.processes.length) {
    // Si no hay procesos, cargar demo automáticamente
    loadDemo();
    if (!state.processes.length) {
      alert('Agrega al menos un proceso');
      return;
    }
  }
  let result;
  switch (algoSelect.value) {
    case 'FCFS':
      result = fcfs(state.processes);
      break;
    case 'SJF':
      result = sjf(state.processes);
      break;
    case 'SRTF':
      result = srtf(state.processes);
      break;
    case 'RR':
      result = rr(state.processes, Number(quantumInput.value) || 2);
      break;
    default:
      result = fcfs(state.processes);
  }
  state.timeline = result.timeline;
  state.resultProcs = result.processes;
  renderGantt(gantt, state.timeline, { algo: algoSelect.value, quantum: Number(quantumInput.value) || 0 });
  renderPerProcessMetrics(perProcMetricsBody, state.resultProcs);
  renderSystemSummary(systemSummaryBody, state.timeline, state.resultProcs);
  updateQBadge();
}

function loadDemo() {
  state.processes = [
    new Process({ id: 'A', arrival: 0, burst: 6, blockStart: 3, blockDuration: 2 }),
    new Process({ id: 'B', arrival: 1, burst: 8, blockStart: 1, blockDuration: 3 }),
    new Process({ id: 'C', arrival: 2, burst: 7, blockStart: 5, blockDuration: 1 }),
    new Process({ id: 'D', arrival: 4, burst: 3, blockStart: 0, blockDuration: 0 }),
    new Process({ id: 'E', arrival: 6, burst: 9, blockStart: 2, blockDuration: 4 }),
    new Process({ id: 'F', arrival: 6, burst: 2, blockStart: 0, blockDuration: 0 }),
  ];
  algoSelect.value = 'RR';
  quantumInput.value = 3;
  renderProcessTable(processTableBody, state.processes, deleteProcess);
}

form.addEventListener('submit', (e) => { e.preventDefault(); addProcessFromForm(); });
clearBtn.addEventListener('click', clearAll);
runBtn.addEventListener('click', run);
demoBtn.addEventListener('click', loadDemo);
algoSelect.addEventListener('change', updateQBadge);
quantumInput.addEventListener('input', updateQBadge);

// initial metrics to blank (solo tablas)
renderPerProcessMetrics(perProcMetricsBody, []);
updateQBadge();

// Asegurar carga automática al abrir la página
window.addEventListener('DOMContentLoaded', () => {
  // Solo cargar demo automáticamente al abrir (sin ejecutar)
  setTimeout(() => {
    loadDemo();
    updateQBadge();
  }, 0);
});

// preload default programs on load
loadDemo();

function updateQBadge() {
  if (!qBadge) return;
  if (algoSelect.value === 'RR') {
    qBadge.style.display = 'inline-flex';
    if (quantumField) quantumField.style.display = 'block';
    const s = qBadge.querySelector('span');
    if (s) s.textContent = String(Number(quantumInput.value) || 1);
  } else {
    qBadge.style.display = 'none';
    if (quantumField) quantumField.style.display = 'none';
  }
}
