// Primer Ajuste (First Fit)
export function firstFit(memoria, programa) {
  for (let p of memoria.particiones) {
    if (p.estado === "libre") {        // encontramos la primera libre
      if (p.tamano >= programa.tamano) {
        return p;                       // cabe, la usamos
      } else {
        return null;                    // no cabe en la primera libre
      }
    }
  }
  return null;                          // no hay partición libre
}

// Mejor Ajuste (Best Fit)
export function bestFit(memoria, programa) {
  return memoria.particiones
    .filter(p => p.estado === "libre" && p.tamano >= programa.tamano)
    .sort((a, b) => a.tamano - b.tamano)[0] || null;
}

// Peor Ajuste (Worst Fit)
export function worstFit(memoria, programa) {
  return memoria.particiones
    .filter(p => p.estado === "libre" && p.tamano >= programa.tamano)
    .sort((a, b) => b.tamano - a.tamano)[0] || null;
}

// Next Fit
let lastIndex = 0;
export function nextFit(memoria, programa) {
  const n = memoria.particiones.length;
  for (let vueltas = 0; vueltas < n; vueltas++) {
    const idx = (lastIndex + vueltas) % n;
    const p = memoria.particiones[idx];
    if (p.estado === "libre" && p.tamano >= programa.tamano) {
      lastIndex = idx;
      return p;
    }
  }
  return null;
}
