// Primer Ajuste (First Fit)
export function firstFit(particiones, tamano) {
  for (let p of particiones) {
    if (p.estado === "Libre" && p.size >= tamano) {
      return p;
    }
  }
  return null;
}

// Mejor Ajuste (Best Fit)
export function bestFit(particiones, tamano) {
  const libres = particiones
    .filter(p => p.estado === "Libre" && p.size >= tamano)
    .sort((a, b) => a.size - b.size);
  return libres.length > 0 ? libres[0] : null;
}

// Peor Ajuste (Worst Fit)
export function worstFit(particiones, tamano) {
  const libres = particiones
    .filter(p => p.estado === "Libre" && p.size >= tamano)
    .sort((a, b) => b.size - a.size);
  return libres.length > 0 ? libres[0] : null;
}

// Next Fit
let lastIndex = 0;
export function nextFit(particiones, tamano) {
  const n = particiones.length;
  for (let vueltas = 0; vueltas < n; vueltas++) {
    const idx = (lastIndex + vueltas) % n;
    const p = particiones[idx];
    if (p.estado === "Libre" && p.size >= tamano) {
      lastIndex = idx;
      return p;
    }
  }
  return null;
}
