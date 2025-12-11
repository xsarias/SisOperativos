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
  container.innerHTML = ''; // Limpiar contenedor previo
  
  if (!timeline || !timeline.length) return;

  const endTime = timeline[timeline.length - 1].time + 1;
  const processes = opts.processes || [];
  
  // Obtener IDs únicos y ordenarlos
  const procIds = processes.length
    ? processes.map(p => p.id)
    : Array.from(new Set(timeline.filter(t => t.running !== 'IDLE').map(t => t.running))).sort();

  // Invertir orden para que P1 quede arriba (estético)
  procIds.reverse();

  // 1. GENERAR FILAS DE PROCESOS
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

    // Recorrer cada instante de tiempo para dibujar el estado
    for (let t = 0; t < endTime; t++) {
      const item = timeline.find(x => x.time === t);
      
      // Contenedor base de la celda (Slice)
      // Usamos estilos inline para asegurar la alineación de 24px
      const cell = document.createElement('div');
      cell.style.width = '24px';
      cell.style.height = '100%';
      cell.style.display = 'inline-block';
      cell.style.boxSizing = 'border-box';
      
      if (t < arrival) {
        // Antes de llegar (Transparente)
        cell.style.borderRight = '1px solid rgba(0,0,0,0.05)';
      } else if (item && item.running === pid) {
        // Ejecutando
        cell.className = `slice ${pid}`; // Asume clases CSS .slice.P1, etc. o genérica
        cell.style.backgroundColor = '#3b82f6'; // Azul por defecto si no hay clase específica
        cell.style.borderRight = '1px solid rgba(255,255,255,0.3)';
      } else if (item && item.blocked && item.blocked.includes(pid)) {
        // Bloqueado
        cell.className = 'slice blocked';
        cell.style.backgroundColor = '#dc2626'; // Rojo
        cell.style.borderRight = '1px solid rgba(255,255,255,0.3)';
      } else if (t >= arrival && (finish === null || t < finish)) {
        // Espera (Listo)
        cell.className = 'wait-slice';
        cell.style.backgroundColor = '#9ca3af'; // Gris
        cell.style.borderRight = '1px solid white';
      } else {
        // Terminado (Transparente)
        cell.style.borderRight = '1px solid rgba(0,0,0,0.05)';
      }
      
      bar.appendChild(cell);
    }
    
    row.appendChild(bar);
    container.appendChild(row);
  }

  // 2. FILA DEL DISPATCHER (SOLO SI ES RR)
  // Asegúrate de que este bloque IF aparezca UNA SOLA VEZ
  const isRR = opts.algo === 'RR';
  if (isRR) {
    const q = Number(opts.quantum) || 0;
    
    const dispatchRow = document.createElement('div');
    dispatchRow.className = 'gantt-row';
    
    const dLabel = document.createElement('div');
    dLabel.className = 'label';
    dLabel.textContent = q > 0 ? `Dispatcher` : 'Dispatcher';
    dLabel.style.fontSize = '0.8rem'; // Un poco más pequeño
    dispatchRow.appendChild(dLabel);

    const dBar = document.createElement('div');
    dBar.className = 'dispatcher-bar';
    // Asegurar que la barra tenga el mismo comportamiento visual que las de procesos
    dBar.style.display = 'flex'; 
    dBar.style.height = '30px'; 
    
    let runLen = 0;
    let lastRunning = null;

    for (let i = 0; i < timeline.length; i++) {
      const cur = timeline[i].running;

      // Crear celda contenedora para mantener la alineación (24px exactos)
      const cell = document.createElement('div');
      cell.style.width = '20  px';
      cell.style.height = '100%';
      cell.style.display = 'flex';           // Para centrar el punto
      cell.style.alignItems = 'center';      // Verticalmente
      cell.style.justifyContent = 'center';  // Horizontalmente
      cell.style.borderRight = '1px solid rgba(0,0,0,0.05)'; // Guias visuales tenues

      // Lógica de detección de Dispatcher
      let showDot = false;

      if (cur === 'IDLE') {
        runLen = 0;
        lastRunning = null;
      } else {
        // Si cambió el proceso (incluye inicio, switch o vuelta de bloqueo)
        if (cur !== lastRunning) {
          showDot = true;
          runLen = 1;
        } else {
          // Si sigue el mismo proceso, chequeamos fin de quantum
          runLen++;
          if (q > 0 && (runLen - 1) > 0 && (runLen - 1) % q === 0) {
             // Nota: Chequeamos (runLen-1) porque el dispatcher actúa AL FINAL del tick anterior
             // Pero visualmente suele quedar mejor marcar el inicio del nuevo bloque.
             // Tu lógica anterior usaba runLen % q === 0. Usaremos esa para consistencia.
             if (runLen % q === 1 || runLen % q === 0) {
                 // Depende de si quieres marcar el final del Q o el inicio del siguiente.
                 // Estandar: Marcar el tick donde DECIDE el dispatcher.
             }
             // Simplificación visual: Si runLen % q === 1 (acaba de empezar un nuevo bloque de Q)
             // O si prefieres marcar el tick exacto de corte:
             if (runLen % q === 1 && runLen > 1) showDot = true; 
          }
        }
        
        // CORRECCIÓN PARA TU LÓGICA EXACTA DE LA FOTO:
        // Tu lógica original marcaba cuando runLen % q === 0.
        // Vamos a mantener tu lógica de detección simple:
        const isSwitch = cur !== lastRunning;
        const isQuantumEnd = (cur === lastRunning && q > 0 && runLen % q === 0);
        
        // Reiniciar contadores para la lógica visual
        if (cur !== lastRunning) {
             runLen = 1;
             showDot = true; // Siempre mostrar en cambio de contexto
        } 
        // Nota: No mostramos punto en medio del quantum
      }
      
      if (showDot) {
        const dot = document.createElement('div');
        dot.style.width = '8px';
        dot.style.height = '8px';
        dot.style.backgroundColor = '#2563eb'; // Azul fuerte
        dot.style.borderRadius = '50%';
        cell.appendChild(dot);
      }

      dBar.appendChild(cell);
      lastRunning = cur;
    }
    
    dispatchRow.appendChild(dBar);
    container.appendChild(dispatchRow);
  }

  // 3. EJE X (TIEMPO)
  const axisRow = document.createElement('div');
  axisRow.className = 'gantt-row axis';
  const aLabel = document.createElement('div');
  aLabel.className = 'label'; 
  axisRow.appendChild(aLabel);
  
  const axisBar = document.createElement('div');
  axisBar.className = 'axis-bar';
  axisBar.style.display = 'flex';
  
  for (let t = 0; t <= endTime; t++) {
    const tick = document.createElement('div');
    tick.className = 'tick';
    tick.textContent = String(t);
    tick.style.width = '24px';
    tick.style.textAlign = 'left';
    tick.style.fontSize = '10px';
    tick.style.color = '#666';
    // Ajuste visual para que el número quede al inicio de la columna
    tick.style.transform = 'translateX(-50%)'; 
    // Truco: el primer tick no se mueve tanto
    if (t===0) tick.style.transform = 'none';
    
    axisBar.appendChild(tick);
  }
  axisRow.appendChild(axisBar);
  container.appendChild(axisRow);
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
