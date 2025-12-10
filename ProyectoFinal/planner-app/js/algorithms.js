import { deepCopyProcesses } from './models.js';

function sortByArrivalThenId(list) {
  return [...list].sort((a, b) => (a.arrival - b.arrival) || a.id.localeCompare(b.id));
}

function unblockProcesses(ready, blocked, time) {
  for (let i = blocked.length - 1; i >= 0; i--) {
    const b = blocked[i];
    if (b.blockedUntil !== null && b.blockedUntil <= time) {
      ready.push(blocked.splice(i, 1)[0]);
    }
  }
}

function advanceIdleTime(timeline, ready, blocked, procs, time) {
  const nextArrival = procs.length ? procs[0].arrival : Infinity;
  const nextUnblock = blocked.length ? Math.min(...blocked.map(b => b.blockedUntil)) : Infinity;
  const nextEvent = Math.min(nextArrival, nextUnblock);

  if (nextEvent === Infinity) return null;

  while (time < nextEvent) {
    timeline.push({
      time,
      running: 'IDLE',
      readyQueue: ready.map(x => x.id),
      blocked: blocked.map(b => b.id)
    });
    time++;
    unblockProcesses(ready, blocked, time);
  }
  return time;
}

// ✅ executeTick DEL CÓDIGO 2 (bloqueo ANTES de ejecutar)
function executeTick(p, timeline, ready, blocked, procs, time) {
  // CHECK BLOQUEO ANTES de ejecutar
  if (!p.blockUsed && p.blockDuration > 0 && p.execCount === p.blockStart) {
    p.blockedUntil = time + p.blockDuration;
    p.blockUsed = true;
    blocked.push(p);
    return false; // NO ejecuta tick, NO consume CPU
  }

  // Ejecución normal
  timeline.push({
    time,
    running: p.id,
    readyQueue: ready.map(x => x.id),
    blocked: blocked.map(b => b.id)
  });

  p.remaining -= 1;
  p.execCount += 1;
  return true;
}

function materializeProcesses(originalProcesses, timeline) {
  const procMap = new Map();
  for (const orig of originalProcesses) {
    let startTime = null;
    let finishTime = null;
    for (const t of timeline) {
      if (t.running === orig.id) {
        if (startTime === null) startTime = t.time;
        finishTime = t.time + 1;
      }
    }
    const p = {
      id: orig.id, arrival: orig.arrival, burst: orig.burst,
      priority: orig.priority, blockStart: orig.blockStart ?? 0,
      blockDuration: orig.blockDuration ?? 0, startTime, finishTime
    };
    procMap.set(orig.id, p);
  }
  return originalProcesses.map(o => procMap.get(o.id));
}

// ✅ FCFS
export function fcfs(processes) {
  const procs = sortByArrivalThenId(deepCopyProcesses(processes));
  const timeline = []; let time = 0; const ready = []; const blocked = [];

  while (procs.length || ready.length || blocked.length) {
    unblockProcesses(ready, blocked, time);
    while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());

    if (!ready.length) {
      const newTime = advanceIdleTime(timeline, ready, blocked, procs, time);
      if (newTime === null) break;
      time = newTime; continue;
    }

    const p = ready.shift();
    if (p.startTime === null) p.startTime = time;

    while (p.remaining > 0) {
      if (!executeTick(p, timeline, ready, blocked, procs, time)) break;
      
      time++;
      while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());
      unblockProcesses(ready, blocked, time);
      
      if (p.remaining === 0) {
        p.finishTime = time;
        break;
      }
    }
  }
  return { timeline, processes: materializeProcesses(processes, timeline) };
}

// ✅ SJF
export function sjf(processes) {
  const procs = sortByArrivalThenId(deepCopyProcesses(processes));
  const timeline = []; let time = 0; const ready = []; const blocked = [];

  while (procs.length || ready.length || blocked.length) {
    unblockProcesses(ready, blocked, time);
    while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());

    if (!ready.length) {
      const newTime = advanceIdleTime(timeline, ready, blocked, procs, time);
      if (newTime === null) break;
      time = newTime; continue;
    }

    // SJF: sort by burst time
    ready.sort((a, b) => (a.burst - b.burst) || a.arrival - b.arrival || a.id.localeCompare(b.id));
    const p = ready.shift();
    if (p.startTime === null) p.startTime = time;

    while (p.remaining > 0) {
      if (!executeTick(p, timeline, ready, blocked, procs, time)) break;
      
      time++;
      while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());
      unblockProcesses(ready, blocked, time);
      
      if (p.remaining === 0) {
        p.finishTime = time;
        break;
      }
    }
  }
  return { timeline, processes: materializeProcesses(processes, timeline) };
}

// ✅ SRTF
export function srtf(processes) {
  const procs = sortByArrivalThenId(deepCopyProcesses(processes));
  const timeline = []; let time = 0; const ready = []; const blocked = [];
  let current = null;

  while (procs.length || ready.length || current || blocked.length) {
    unblockProcesses(ready, blocked, time);
    while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());

    // Preemption check
    if (current && ready.length) {
      const shortestReady = [...ready].sort((a, b) => (a.remaining - b.remaining))[0];
      if (shortestReady.remaining < current.remaining) {
        ready.push(current);
        current = null;
      }
    }
    
    if (!current && ready.length) {
      ready.sort((a, b) => (a.remaining - b.remaining) || a.arrival - b.arrival || a.id.localeCompare(b.id));
      current = ready.shift();
      if (current.startTime === null) current.startTime = time;
    }

    if (!current) {
      const newTime = advanceIdleTime(timeline, ready, blocked, procs, time);
      if (newTime === null) break;
      time = newTime; continue;
    }

    if (current.remaining > 0) {
      if (!executeTick(current, timeline, ready, blocked, procs, time)) {
        current = null;
      } else {
        time++;
        while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());
        unblockProcesses(ready, blocked, time);
        
        if (current.remaining === 0) {
          current.finishTime = time;
          current = null;
        }
      }
    }
  }
  return { timeline, processes: materializeProcesses(processes, timeline) };
}

// ✅ RR
export function rr(processes, quantum) {
  const procs = sortByArrivalThenId(deepCopyProcesses(processes));
  const timeline = []; let time = 0; const ready = []; const blocked = [];

  while (procs.length || ready.length || blocked.length) {
    unblockProcesses(ready, blocked, time);
    while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());

    if (!ready.length) {
      const newTime = advanceIdleTime(timeline, ready, blocked, procs, time);
      if (newTime === null) break;
      time = newTime; continue;
    }

    const p = ready.shift();
    if (p.startTime === null) p.startTime = time;

    let q = quantum;
    let didBlock = false;

    while (q > 0 && p.remaining > 0) {
      if (!executeTick(p, timeline, ready, blocked, procs, time)) {
        didBlock = true;
        break;
      }
      
      time++;
      q--;
      
      while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());
      unblockProcesses(ready, blocked, time);
      
      if (p.remaining === 0) {
        p.finishTime = time;
        break;
      }
    }

    if (p.remaining > 0 && !didBlock) {
      ready.push(p);
    }
  }
  return { timeline, processes: materializeProcesses(processes, timeline) };
}
