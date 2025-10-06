// js/memory.js
export class Memoria {
  constructor(totalKB, blockKB) {
    this.totalKB = totalKB;
    this.blockKB = blockKB;
    this.numBloques = Math.floor(totalKB / blockKB);

    this.particiones = Array.from({ length: this.numBloques }, (_, i) => ({
      base: i * blockKB,   // Dirección base (KB)
      size: blockKB,       // Tamaño en KB
      estado: i === 0 ? "Ocupado" : "Libre", // primer bloque para el SO
      id: i === 0 ? "SO" : null
    }));
  }

  getOcupado() {
    return this.particiones
      .filter(p => p.estado === "Ocupado")
      .reduce((acc, p) => acc + p.size, 0);
  }

  getLibre() {
    return this.particiones
      .filter(p => p.estado === "Libre")
      .reduce((acc, p) => acc + p.size, 0);
  }

  cargarProceso(pid, sizeKB) {
    let bloque = this.particiones.find(
      p => p.estado === "Libre" && p.size >= sizeKB
    );
    if (!bloque) return false;
    bloque.estado = "Ocupado";
    bloque.id = pid;
    return true;
  }

  liberarProceso(pid) {
    let bloque = this.particiones.find(p => p.id === pid);
    if (bloque) {
      bloque.estado = "Libre";
      bloque.id = null;
    }
  }
}
