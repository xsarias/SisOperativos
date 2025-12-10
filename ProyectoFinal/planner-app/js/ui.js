import { computePerProcessMetrics, computeAverages } from './models.js';

export function renderProcessTable(tbody, processes, onDelete) {
  tbody.innerHTML = '';
  for (const p of processes) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.arrival}</td>
      <td>${p.burst}</td>
      <td>${p.blockStart ?? 0}</td>
      <td>${p.blockDuration ?? 0}</td>
      <td><button data-id="${p.id}" class="btn danger">Eliminar</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => onDelete(p.id));
    tbody.appendChild(tr);
  }
}

export function renderResultsTimeline(resultTableBody, timeline) {
  resultTableBody.innerHTML = '';
  for (const t of timeline) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.time}</td>
      <td>${t.running}</td>
      <td>${t.readyQueue.join(', ')}</td>
    `;
    resultTableBody.appendChild(tr);
  }
}

export function renderGantt(container, timeline, opts = {}) {
  container.innerHTML = '';
  const endTime = timeline.length ? timeline[timeline.length - 1].time + 1 : 0;
  const processes = opts.processes || [];
  const procIds = processes.length
    ? processes.map(p => p.id)
    : Array.from(new Set(timeline.filter(t => t.running !== 'IDLE').map(t => t.running))).sort();

  // Reverse order to show from bottom to top
  procIds.reverse();

  // Build a row per process showing execution, wait, and blocked states
  for (const pid of procIds) {
    const row = document.createElement('div');
    row.className = 'gantt-row';
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = pid;
    row.appendChild(label);
    const bar = document.createElement('div');
    bar.className = 'bar';

    const proc = processes.find(p => p.id === pid);
    const arrival = proc ? proc.arrival : 0;
    const finish = proc ? proc.finishTime : endTime;

    // Walk time from arrival to finish and show state
    for (let t = 0; t < endTime; t++) {
      const item = timeline.find(x => x.time === t);
      
      if (t < arrival) {
        // Before arrival: transparent
        const gap = document.createElement('div');
        gap.style.width = '24px';
        gap.style.background = 'transparent';
        gap.style.borderRight = '1px solid rgba(0,0,0,0.06)';
        bar.appendChild(gap);
      } else if (item && item.running === pid) {
        // Executing
        const exec = document.createElement('div');
        exec.className = `slice ${pid}`;
        exec.style.width = '24px';
        exec.textContent = '';
        bar.appendChild(exec);
      } else if (item && item.blocked && item.blocked.includes(pid)) {
        // Blocked - show RED
        const block = document.createElement('div');
        block.className = 'slice blocked';
        block.style.width = '24px';
        block.style.background = '#dc2626';
        block.style.color = '#fff';
        block.textContent = '';
        bar.appendChild(block);
      } else if (t >= arrival && (finish === null || t < finish)) {
        // Waiting in queue (ready but not running)
        const wait = document.createElement('div');
        wait.className = 'wait-slice';
        wait.style.width = '24px';
        bar.appendChild(wait);
      } else {
        // After finish or not yet arrived
        const gap = document.createElement('div');
        gap.style.width = '24px';
        gap.style.background = 'transparent';
        gap.style.borderRight = '1px solid rgba(0,0,0,0.06)';
        bar.appendChild(gap);
      }
    }
    
    row.appendChild(bar);
    container.appendChild(row);
  }

  // Dispatcher row: visible solo para algoritmo RR
  const isRR = opts.algo === 'RR';
  if (isRR) {
    const q = Number(opts.quantum) || 0;
    const dispatchRow = document.createElement('div');
    dispatchRow.className = 'gantt-row';
    const dLabel = document.createElement('div');
    dLabel.className = 'label';
    dLabel.textContent = q > 0 ? `dispatcher (Q=${q})` : 'dispatcher';
    dispatchRow.appendChild(dLabel);
    const dBar = document.createElement('div');
    dBar.className = 'dispatcher-bar';
    let runLen = 0;
    let lastRunning = null;
    for (let i = 0; i < timeline.length; i++) {
      const cur = timeline[i].running;

      // Skip idle time: no dispatcher ticks during IDLE
      if (cur === 'IDLE') {
        runLen = 0;
        lastRunning = null;
        continue;
      }

      const changed = cur !== lastRunning;
      if (changed) {
        const dot = document.createElement('div');
        dot.className = 'dispatcher-slice';
        dBar.appendChild(dot);
        runLen = 1;
        lastRunning = cur;
      } else {
        runLen += 1;
        if (q > 0 && runLen % q === 0) {
          const dot = document.createElement('div');
          dot.className = 'dispatcher-slice';
          dBar.appendChild(dot);
        }
      }
    }
    dispatchRow.appendChild(dBar);
    container.appendChild(dispatchRow);
  }

  // X-axis ticks
  const axisRow = document.createElement('div');
  axisRow.className = 'gantt-row';
  const aLabel = document.createElement('div');
  aLabel.className = 'label';
  aLabel.textContent = '';
  axisRow.appendChild(aLabel);
  const axisBar = document.createElement('div');
  axisBar.className = 'axis-bar';
  for (let t = 0; t <= endTime; t++) {
    const tick = document.createElement('div');
    tick.className = 'axis-tick';
    tick.textContent = String(t);
    axisBar.appendChild(tick);
  }
  axisRow.appendChild(axisBar);
  container.appendChild(axisRow);

  // Legend describing colors
  const legend = document.createElement('div');
  legend.className = 'legend';
  legend.innerHTML = `
    <span><span class="chip exec"></span> Ejecución</span>
    <span><span class="chip wait"></span> Espera</span>
    <span><span class="chip block"></span> Bloqueo</span>
    ${opts.algo === 'RR' ? '<span><span class="chip dispatcher"></span> Dispatcher</span>' : ''}
  `;
  container.appendChild(legend);
}

export function renderMetrics(avgEls, processes) {
  const metrics = computePerProcessMetrics(processes);
  const avg = computeAverages(metrics);
  avgEls.turnaround.textContent = `${avg.turnaround}`;
  avgEls.wait.textContent = `${avg.wait}`;
  avgEls.response.textContent = `${avg.response}`;
  avgEls.penalty.textContent = `${avg.penalty}`;
  avgEls.burst.textContent = `${(processes.reduce((a,p)=>a+(p?.burst||0),0)/(processes.length||1)).toFixed(2)}`;
}

export function renderPerProcessMetrics(tableBody, processes) {
  tableBody.innerHTML = '';
  const metrics = computePerProcessMetrics(processes);
  for (const m of metrics) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${m.id}</td>
      <td>${m.burst}</td>
      <td>${m.wait ?? ''}</td>
      <td>${processes.find(p=>p.id===m.id)?.finishTime ?? ''}</td>
      <td>${m.turnaround ?? ''}</td>
      <td>${(m.turnaround - m.burst) ?? ''}</td>
      <td>${m.penalty?.toFixed(2) ?? ''}</td>
      <td>${m.response ?? ''}</td>
    `;
    tableBody.appendChild(tr);
  }
}

export function renderSystemSummary(tableBody, timeline, processes) {
  tableBody.innerHTML = '';
  const onTime = timeline.length ? (timeline[timeline.length - 1].time + 1) : 0;
  const procTime = processes.reduce((acc, p) => acc + (p?.burst || 0), 0);
  const sysTime = Math.max(onTime - procTime, 0);
  const cpuProcPct = onTime ? ((procTime / onTime) * 100) : 0;
  const cpuSysPct = onTime ? ((sysTime / onTime) * 100) : 0;

  // Promedios desde metrics
  const metrics = computePerProcessMetrics(processes);
  const avg = computeAverages(metrics);
  const avgExec = processes.length ? (procTime / processes.length) : 0;
  const avgWait = avg.wait;
  const avgLost = processes.length ? ((metrics.reduce((a,m)=>a + (m.turnaround - m.burst),0)) / processes.length) : 0;

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${onTime.toFixed(2)}</td>
    <td>${procTime.toFixed(2)}</td>
    <td>${sysTime.toFixed(2)}</td>
    <td>${cpuProcPct.toFixed(2)}</td>
    <td>${cpuSysPct.toFixed(2)}</td>
    <td>${avg.turnaround.toFixed(2)}</td>
    <td>${avgExec.toFixed(2)}</td>
    <td>${avgWait.toFixed(2)}</td>
    <td>${avgLost.toFixed(2)}</td>
  `;
  tableBody.appendChild(tr);
}
