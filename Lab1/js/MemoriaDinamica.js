// js/MemoriaDinamica.js
import { bestFit } from "./algoritmos.js";

export class MemoriaDinamica {
  constructor(total) {
    this.total = total;
    this.particiones = [
      { base: 0, size: 1024, estado: "Ocupado", id: "SO" },
      { base: 1024, size: total - 1024, estado: "Libre", id: null }
    ];
  }

  cargarProceso(pid, sizeKB) {
    const hueco = bestFit(this.particiones, sizeKB); // algoritmo mejor ajuste
    if (!hueco) return false;

    const idx = this.particiones.indexOf(hueco);
    if (hueco.size > sizeKB) {
      this.particiones.splice(idx, 1,
        { base: hueco.base, size: sizeKB, estado: "Ocupado", id: pid },
        { base: hueco.base + sizeKB, size: hueco.size - sizeKB, estado: "Libre", id: null }
      );
    } else {
      this.particiones[idx].estado = "Ocupado";
      this.particiones[idx].id = pid;
    }
    return true;
  }

  liberarProceso(pid, usarCompactacion = false) {
    const idx = this.particiones.findIndex(p => p.id === pid);
    if (idx >= 0) {
      this.particiones[idx].estado = "Libre";
      this.particiones[idx].id = null;
      if (usarCompactacion) {
        this.compactar();
      } else {
        this.fusionarLibres();
      }
    }
  }

  fusionarLibres() {
    for (let i = 0; i < this.particiones.length - 1; i++) {
      const actual = this.particiones[i];
      const siguiente = this.particiones[i + 1];
      if (actual.estado === "Libre" && siguiente.estado === "Libre") {
        actual.size += siguiente.size;
        this.particiones.splice(i + 1, 1);
        i--;
      }
    }
  }

  compactar() {
    const ocupados = this.particiones.filter(p => p.estado === "Ocupado");
    let base = 0;
    this.particiones = ocupados.map(p => {
      const nuevo = { ...p, base };
      base += p.size;
      return nuevo;
    });
    const libre = this.total - base;
    if (libre > 0) {
      this.particiones.push({ id: null, size: libre, estado: "Libre", base });
    }
  }

  getOcupado() {
    return this.particiones.filter(p => p.estado === "Ocupado")
      .reduce((acc, p) => acc + p.size, 0);
  }

  getLibre() {
    return this.particiones.filter(p => p.estado === "Libre")
      .reduce((acc, p) => acc + p.size, 0);
  }
}
