// MemoriaPaginada.js
export class MemoriaPaginada {
  constructor() {
    this.tamMarco = 65536; // 64 KB
    this.numMarcos = 256;  // 256 marcos de 64 KB = 16 MB
    this.marcos = [];

    for (let i = 0; i < this.numMarcos; i++) {
      this.marcos.push({
        marco: i,
        ocupado: false,
        pid: null,
        tipo: null,
      });
    }

    // Reservar los primeros marcos para el S.O.
    for (let i = 0; i < 16; i++) {
      this.marcos[i].ocupado = true;
      this.marcos[i].pid = "S.O.";
      this.marcos[i].tipo = "S.O.";
    }
  }

  // ------------------------------------------------------------
  // 📦 Cargar proceso con orden: text → data → bss → heap → stack
  cargarProceso(pid, pagsText, pagsData, pagsBss, pagsStack = 1) {
    const pagsHeap = Math.ceil((pagsData + pagsBss) / 2); // aprox heap

    const totalPags = pagsText + pagsData + pagsBss + pagsHeap + pagsStack;
    const libres = this.marcos.filter(m => !m.ocupado).length;

    if (libres < totalPags) return false; // no hay espacio suficiente

    const segmentos = [
      { tipo: "text", cantidad: pagsText },
      { tipo: "data", cantidad: pagsData },
      { tipo: "bss", cantidad: pagsBss },
      { tipo: "heap", cantidad: pagsHeap },
      { tipo: "stack", cantidad: pagsStack },
    ];

    // ⚙️ Asignar en orden de abajo hacia arriba
    for (const seg of segmentos) {
      for (let i = 0; i < seg.cantidad; i++) {
        const marcoLibre = this.marcos.find(m => !m.ocupado);
        if (!marcoLibre) return false;
        marcoLibre.ocupado = true;
        marcoLibre.pid = pid;
        marcoLibre.tipo = seg.tipo;
      }
    }

    return true;
  }

  // ------------------------------------------------------------
  // 🗑️ Liberar proceso
  liberarProceso(pid) {
    this.marcos.forEach(m => {
      if (m.pid === pid) {
        m.ocupado = false;
        m.pid = null;
        m.tipo = null;
      }
    });
  }
}
