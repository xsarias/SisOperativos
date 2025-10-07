import { firstFit, bestFit, worstFit, nextFit } from "./algoritmos.js";

export class MemoriaDinamica {
  constructor(totalKB) {
    this.particiones = [
      { base: 0, size: 256, estado: "Ocupado", id: "SO" },
      { base: 256, size: totalKB - 256, estado: "Libre", id: null }
    ];
  }

  cargarProceso(pid, sizeKB, algoritmo = "first") {
    let particion;
    switch (algoritmo) {
      case "best": particion = bestFit(this.particiones, sizeKB); break;
      case "worst": particion = worstFit(this.particiones, sizeKB); break;
      case "next": particion = nextFit(this.particiones, sizeKB); break;
      default: particion = firstFit(this.particiones, sizeKB);
    }
    if (!particion) return false;

    // Si cabe exacto
    if (particion.size === sizeKB) {
      particion.estado = "Ocupado";
      particion.id = pid;
    } else {
      // dividir partición
      const nueva = {
        base: particion.base + sizeKB,
        size: particion.size - sizeKB,
        estado: "Libre",
        id: null
      };
      particion.size = sizeKB;
      particion.estado = "Ocupado";
      particion.id = pid;
      this.particiones.splice(this.particiones.indexOf(particion) + 1, 0, nueva);
    }
    return true;
  }

  liberarProceso(pid, compactar = false) {
    const idx = this.particiones.findIndex(p => p.id === pid);
    if (idx < 0) return;
    this.particiones[idx].estado = "Libre";
    this.particiones[idx].id = null;

    if (compactar) this.compactar();
  }

  compactar() {
    let baseActual = 0;
    const ocupadas = this.particiones.filter(p => p.estado === "Ocupado");
    ocupadas.forEach(p => {
      p.base = baseActual;
      baseActual += p.size;
    });
    const libreTotal = this.particiones
      .filter(p => p.estado === "Libre")
      .reduce((acc, p) => acc + p.size, 0);
    this.particiones = [
      ...ocupadas,
      { base: baseActual, size: libreTotal, estado: "Libre", id: null }
    ];
  }

  getOcupado() {
    return this.particiones.filter(p => p.estado === "Ocupado")
      .reduce((a, p) => a + p.size, 0);
  }

  getLibre() {
    return this.particiones.filter(p => p.estado === "Libre")
      .reduce((a, p) => a + p.size, 0);
  }
}
