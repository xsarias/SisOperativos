export class MemoriaVariable {
  constructor(totalKB) {
    this.totalKB = totalKB;
    this.particiones = []; // se inicializan desde la vista
  }

  getOcupado() {
    return this.particiones
      .filter(p => p.estado === "ocupado")
      .reduce((acc, p) => acc + p.tamano, 0);
  }

  getLibre() {
    return this.particiones
      .filter(p => p.estado === "libre")
      .reduce((acc, p) => acc + p.tamano, 0);
  }

  cargar(pid, sizeKB) {
    const libre = this.particiones.find(
      p => p.estado === "libre" && p.tamano >= sizeKB
    );
    if (!libre) return false;
    libre.estado = "ocupado";
    libre.id = pid;
    return true;
  }

  liberar(pid) {
    const part = this.particiones.find(p => p.id === pid);
    if (part && part.id !== "SO") {
      part.estado = "libre";
      delete part.id;
    }
  }
}
