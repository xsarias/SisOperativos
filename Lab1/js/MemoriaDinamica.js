export class MemoriaDinamica {
  constructor(totalKB) {
    this.totalKB = totalKB;
    this.particiones = [
      { id: "SO", size: 512, estado: "Ocupado", base: 0 }
    ];
    this.particiones.push({
      id: null,
      size: totalKB - 512,
      estado: "Libre",
      base: 512
    });
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
    let bloque = this.particiones.find(p => p.estado === "Libre" && p.size >= sizeKB);
    if (!bloque) return false;

    const idx = this.particiones.indexOf(bloque);
    this.particiones.splice(idx, 1,
      { id: pid, size: sizeKB, estado: "Ocupado", base: bloque.base },
      { id: null, size: bloque.size - sizeKB, estado: "Libre", base: bloque.base + sizeKB }
    );
    return true;
  }

  liberarProceso(pid) {
    const idx = this.particiones.findIndex(p => p.id === pid);
    if (idx >= 0) {
      this.particiones[idx].estado = "Libre";
      this.particiones[idx].id = null;
      // 🔹 Compactar inmediatamente al liberar
      this.compactar();
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
    const libre = this.totalKB - base;
    if (libre > 0) {
      this.particiones.push({ id: null, size: libre, estado: "Libre", base });
    }
  }
}
