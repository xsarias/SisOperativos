import { deepCopyProcesses } from './models.js';

function sortByArrivalThenId(list) {
  return [...list].sort((a, b) => (a.arrival - b.arrival) || a.id.localeCompare(b.id));
}

export function fcfs(processes) {
  const procs = sortByArrivalThenId(deepCopyProcesses(processes));
  const timeline = [];
  let time = 0;
  const ready = [];
  const blocked = [];

  while (procs.length || ready.length || blocked.length) {
    // Unblock processes whose blockedUntil elapsed
    for (let i = blocked.length - 1; i >= 0; i--) {
      if (blocked[i].blockedUntil !== null && blocked[i].blockedUntil <= time) {
        ready.push(blocked.splice(i, 1)[0]);
      }
    }
    while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());
    if (!ready.length) {
      // CPU idle until next arrival or unblock
      const nextArrival = procs.length ? procs[0].arrival : Infinity;
      const nextUnblock = blocked.length ? Math.min(...blocked.map(b => b.blockedUntil)) : Infinity;
      const nextEvent = Math.min(nextArrival, nextUnblock);
      if (nextEvent === Infinity) break;
      while (time < nextEvent) {
        timeline.push({ time, running: 'IDLE', readyQueue: [], blocked: blocked.map(b => b.id) });
        time++;
        // check unblocks during idle
        for (let i = blocked.length - 1; i >= 0; i--) {
          if (blocked[i].blockedUntil !== null && blocked[i].blockedUntil <= time) {
            ready.push(blocked.splice(i, 1)[0]);
          }
        }
      }
      continue;
    }
    const p = ready.shift();
    if (p.startTime === null) p.startTime = time;
    while (p.remaining > 0) {
      // Block check before running this tick
      if (!p.blockUsed && p.blockDuration > 0 && p.execCount === p.blockStart) {
        p.blockedUntil = time + p.blockDuration;
        p.blockUsed = true;
        blocked.push(p);
        break; // leave CPU, scheduler picks next
      }
      timeline.push({ time, running: p.id, readyQueue: ready.map(x => x.id), blocked: blocked.map(b => b.id) });
      time++;
      p.remaining -= 1;
      p.execCount += 1;
      // arrivals during execution
      while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());
      // unblocks during execution step
      for (let i = blocked.length - 1; i >= 0; i--) {
        if (blocked[i].blockedUntil !== null && blocked[i].blockedUntil <= time) {
          ready.push(blocked.splice(i, 1)[0]);
        }
      }
    }
    if (p.remaining === 0) p.finishTime = time;
  }
  return { timeline, processes: [...processes].map(orig => {
    const done = [...timeline].reverse().find(t => t.running === orig.id);
    const start = timeline.find(t => t.running === orig.id);
    const p = deepCopyProcesses([orig])[0];
    p.startTime = start ? start.time : null;
    p.finishTime = done ? done.time + 1 : null;
    return p;
  }) };
}

export function sjf(processes) {
  const procs = sortByArrivalThenId(deepCopyProcesses(processes));
  const ready = [];
  const blocked = [];
  const timeline = [];
  let time = 0;

  while (procs.length || ready.length || blocked.length) {
    for (let i = blocked.length - 1; i >= 0; i--) {
      if (blocked[i].blockedUntil !== null && blocked[i].blockedUntil <= time) {
        ready.push(blocked.splice(i, 1)[0]);
      }
    }
    while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());
    if (!ready.length) {
      const nextArrival = procs.length ? procs[0].arrival : Infinity;
      const nextUnblock = blocked.length ? Math.min(...blocked.map(b => b.blockedUntil)) : Infinity;
      const nextEvent = Math.min(nextArrival, nextUnblock);
      if (nextEvent === Infinity) break;
      while (time < nextEvent) { 
        timeline.push({ time, running: 'IDLE', readyQueue: [], blocked: blocked.map(b => b.id) }); 
        time++; 
        for (let i = blocked.length - 1; i >= 0; i--) {
          if (blocked[i].blockedUntil !== null && blocked[i].blockedUntil <= time) {
            ready.push(blocked.splice(i, 1)[0]);
          }
        }
      }
      continue;
    }
    ready.sort((a, b) => (a.burst - b.burst) || a.arrival - b.arrival || a.id.localeCompare(b.id));
    const p = ready.shift();
    if (p.startTime === null) p.startTime = time;
    while (p.remaining > 0) {
      if (!p.blockUsed && p.blockDuration > 0 && p.execCount === p.blockStart) {
        p.blockedUntil = time + p.blockDuration;
        p.blockUsed = true;
        blocked.push(p);
        break;
      }
      timeline.push({ time, running: p.id, readyQueue: ready.map(x => x.id), blocked: blocked.map(b => b.id) });
      time++;
      p.remaining -= 1;
      p.execCount += 1;
      while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());
      for (let i = blocked.length - 1; i >= 0; i--) {
        if (blocked[i].blockedUntil !== null && blocked[i].blockedUntil <= time) {
          ready.push(blocked.splice(i, 1)[0]);
        }
      }
    }
    if (p.remaining === 0) p.finishTime = time;
  }

  return materialize(processes, timeline);
}

export function srtf(processes) {
  const procs = sortByArrivalThenId(deepCopyProcesses(processes));
  const ready = [];
  const blocked = [];
  const timeline = [];
  let time = 0;

  let current = null;

  while (procs.length || ready.length || current || blocked.length) {
    for (let i = blocked.length - 1; i >= 0; i--) {
      if (blocked[i].blockedUntil !== null && blocked[i].blockedUntil <= time) {
        ready.push(blocked.splice(i, 1)[0]);
      }
    }
    while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());

    if (!current) {
      if (!ready.length) {
        const nextArrival = procs.length ? procs[0].arrival : Infinity;
        const nextUnblock = blocked.length ? Math.min(...blocked.map(b => b.blockedUntil)) : Infinity;
        const nextEvent = Math.min(nextArrival, nextUnblock);
        if (nextEvent === Infinity) break;
        while (time < nextEvent) { 
          timeline.push({ time, running: 'IDLE', readyQueue: [], blocked: blocked.map(b => b.id) }); 
          time++; 
        }
        continue;
      }
      ready.sort((a, b) => (a.remaining - b.remaining) || a.arrival - b.arrival || a.id.localeCompare(b.id));
      current = ready.shift();
      if (current.startTime === null) current.startTime = time;
    } else {
      // Preemption check: if a new shorter job arrived, switch
      const shortestReady = [...ready].sort((a, b) => (a.remaining - b.remaining))[0];
      if (shortestReady && shortestReady.remaining < current.remaining) {
        ready.push(current);
        ready.sort((a, b) => (a.remaining - b.remaining) || a.arrival - b.arrival || a.id.localeCompare(b.id));
        current = ready.shift();
        if (current.startTime === null) current.startTime = time;
      }
    }

    // Execute one tick or block
    if (current) {
      if (!current.blockUsed && current.blockDuration > 0 && current.execCount === current.blockStart) {
        current.blockedUntil = time + current.blockDuration;
        current.blockUsed = true;
        blocked.push(current);
        current = null; // force reschedule
        continue;
      }
      timeline.push({ time, running: current.id, readyQueue: ready.map(x => x.id), blocked: blocked.map(b => b.id) });
      time++;
      current.remaining -= 1;
      current.execCount += 1;
      while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());
      if (current.remaining === 0) {
        current.finishTime = time;
        current = null;
      }
    }
  }

  return materialize(processes, timeline);
}

export function rr(processes, quantum = 2) {
  const procs = sortByArrivalThenId(deepCopyProcesses(processes));
  const ready = [];
  const blocked = [];
  const timeline = [];
  let time = 0;

  while (procs.length || ready.length || blocked.length) {
    for (let i = blocked.length - 1; i >= 0; i--) {
      if (blocked[i].blockedUntil !== null && blocked[i].blockedUntil <= time) {
        ready.push(blocked.splice(i, 1)[0]);
      }
    }
    while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());
    if (!ready.length) {
      const nextArrival = procs.length ? procs[0].arrival : Infinity;
      const nextUnblock = blocked.length ? Math.min(...blocked.map(b => b.blockedUntil)) : Infinity;
      const nextEvent = Math.min(nextArrival, nextUnblock);
      if (nextEvent === Infinity) break;
      while (time < nextEvent) { 
        timeline.push({ time, running: 'IDLE', readyQueue: [], blocked: blocked.map(b => b.id) }); 
        time++; 
        for (let i = blocked.length - 1; i >= 0; i--) {
          if (blocked[i].blockedUntil !== null && blocked[i].blockedUntil <= time) {
            ready.push(blocked.splice(i, 1)[0]);
          }
        }
      }
      continue;
    }
    const p = ready.shift();
    if (p.startTime === null) p.startTime = time;
    let q = quantum;
    while (q > 0 && p.remaining > 0) {
      if (!p.blockUsed && p.blockDuration > 0 && p.execCount === p.blockStart) {
        p.blockedUntil = time + p.blockDuration;
        p.blockUsed = true;
        blocked.push(p);
        break;
      }
      timeline.push({ time, running: p.id, readyQueue: ready.map(x => x.id), blocked: blocked.map(b => b.id) });
      time++;
      p.remaining -= 1;
      p.execCount += 1;
      q -= 1;
      while (procs.length && procs[0].arrival <= time) ready.push(procs.shift());
      for (let i = blocked.length - 1; i >= 0; i--) {
        if (blocked[i].blockedUntil !== null && blocked[i].blockedUntil <= time) {
          ready.push(blocked.splice(i, 1)[0]);
        }
      }
    }
    if (p.remaining === 0) {
      p.finishTime = time;
    } else {
      // if it was blocked, it will be re-queued when unblocked
      if (p.blockedUntil === null) ready.push(p);
    }
  }

  return materialize(processes, timeline);
}

function materialize(processes, timeline) {
  // Build start/finish for each original process based on timeline
  const map = new Map();
  for (const orig of processes) {
    let start = null; let finish = null;
    for (const t of timeline) {
      if (t.running === orig.id) { if (start === null) start = t.time; finish = t.time + 1; }
    }
    const p = { id: orig.id, arrival: orig.arrival, burst: orig.burst, priority: orig.priority, startTime: start, finishTime: finish };
    map.set(orig.id, p);
  }
  const procs = processes.map(o => map.get(o.id));
  return { timeline, processes: procs };
}
