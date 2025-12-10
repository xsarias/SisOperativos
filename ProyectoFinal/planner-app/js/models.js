// Process model and utility helpers
export class Process {
  constructor({ id, arrival, burst, priority = null, blockStart = 0, blockDuration = 0 }) {
    this.id = id;
    this.arrival = Number(arrival);
    this.burst = Number(burst);
    this.priority = priority !== null && priority !== '' ? Number(priority) : null;
    this.blockStart = Number(blockStart) || 0;
    this.blockDuration = Number(blockDuration) || 0;

    this.remaining = Number(burst);
    this.execCount = 0; // executed units so far
    this.blockedUntil = null; // absolute time until which it's blocked
    this.blockUsed = false; // whether block has been triggered
    this.startTime = null; // first time it gets CPU
    this.finishTime = null; // completion time
  }
}

export function deepCopyProcesses(list) {
  return list.map(p => {
    const q = new Process({ id: p.id, arrival: p.arrival, burst: p.burst, priority: p.priority, blockStart: p.blockStart ?? 0, blockDuration: p.blockDuration ?? 0 });
    return q;
  });
}

// Metrics per process and aggregated helpers
export function computePerProcessMetrics(processes) {
  return processes.map(p => {
    const turnaround = p.finishTime - p.arrival; // T
    const response = p.startTime !== null ? p.startTime - p.arrival : null; // R
    const wait = turnaround - p.burst; // W (time in ready queue)
    const penalty = turnaround / p.burst; // P
    return { id: p.id, arrival: p.arrival, burst: p.burst, turnaround, wait, response, penalty };
  });
}

export function computeAverages(metrics) {
  const n = metrics.length || 1;
  const sum = (k) => metrics.reduce((acc, m) => acc + (m[k] ?? 0), 0);
  return {
    turnaround: +(sum('turnaround') / n).toFixed(2),
    wait: +(sum('wait') / n).toFixed(2),
    response: +(sum('response') / n).toFixed(2),
    penalty: +(sum('penalty') / n).toFixed(2),
  };
}

// Timeline item: { time, running: processId | 'IDLE', readyQueue: [ids] }
