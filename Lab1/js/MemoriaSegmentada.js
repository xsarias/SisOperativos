export class MemoriaSegmentada {
  constructor() {
    this.TAM_SEGMENTO_MAX = 524288; // 512 KiB
    this.TAM_TOTAL = 16 * 1024 * 1024; // 16 MiB
    this.TAM_SO = 1 * 1024 * 1024; // 1 MiB
    this.segmentos = [];
    this.procesosCargados = [];
    this.inicializarMemoria();
  }

  inicializarMemoria() {
    this.segmentos = [];

    // 🧠 Sistema Operativo
    this.segmentos.push({
      pid: "S.O.",
      tipo: "Kernel",
      base: 0,
      limite: this.TAM_SEGMENTO_MAX,
      ocupado: true,
    });
    this.segmentos.push({
      pid: "S.O.",
      tipo: "Servicios",
      base: this.TAM_SEGMENTO_MAX,
      limite: this.TAM_SEGMENTO_MAX,
      ocupado: true,
    });

    const baseLibre = this.TAM_SO;
    const tamLibre = this.TAM_TOTAL - this.TAM_SO;

    this.segmentos.push({
      pid: "Libre",
      tipo: "Espacio libre",
      base: baseLibre,
      limite: tamLibre,
      ocupado: false,
    });
  }

  calcularSegmentos(tam) {
    const segmentos = Math.floor(tam / this.TAM_SEGMENTO_MAX);
    const resto = tam % this.TAM_SEGMENTO_MAX;
    return {
      cantidad: resto > 0 ? segmentos + 1 : segmentos,
      ultimo: resto > 0 ? resto : this.TAM_SEGMENTO_MAX,
    };
  }

  // 🧩 Nuevo método: buscar el bloque libre más adecuado (Best Fit)
  obtenerMejorBloqueLibre(tamRequerido) {
    const libres = this.segmentos.filter(s => !s.ocupado && s.limite >= tamRequerido);
    if (libres.length === 0) return null;
    // Mejor ajuste: el más pequeño que quepa
    return libres.reduce((best, s) => (s.limite < best.limite ? s : best), libres[0]);
  }

  // 🧹 Compactar espacios libres adyacentes
  compactar() {
    this.segmentos.sort((a, b) => a.base - b.base);
    for (let i = 0; i < this.segmentos.length - 1; i++) {
      const actual = this.segmentos[i];
      const siguiente = this.segmentos[i + 1];
      if (!actual.ocupado && !siguiente.ocupado) {
        // Fusionar bloques libres
        actual.limite += siguiente.limite;
        this.segmentos.splice(i + 1, 1);
        i--; // retroceder un índice para verificar de nuevo
      }
    }
  }

  cargarProceso(proceso) {
    const TAM_STACK = 65536; // 64 KiB
    const TAM_HEAP = 131072; // 128 KiB

    const totalBytes = proceso.text + proceso.data + proceso.bss + TAM_STACK + TAM_HEAP;

    // 🧩 Buscar mejor bloque libre
    let libre = this.obtenerMejorBloqueLibre(totalBytes);
    if (!libre) {
      alert(`No hay suficiente memoria contigua para ${proceso.name}`);
      return false;
    }

    let base = libre.base;
    const nuevosSegmentos = [];

    const agregarSegmentos = (tipo, tamOriginal) => {
      let restante = tamOriginal;
      let numSegmento = 1;
      while (restante > 0) {
        const tam = Math.min(restante, this.TAM_SEGMENTO_MAX);
        nuevosSegmentos.push({
          pid: proceso.id,
          tipo,
          nombre: `${tipo} #${numSegmento}`,
          base,
          limite: tam,
          ocupado: true,
        });
        base += tam;
        restante -= tam;
        numSegmento++;
      }
    };

    // ✅ Agregar .text, .data y .bss (divididos si exceden 512 KiB)
    agregarSegmentos("text", proceso.text);
    agregarSegmentos("data", proceso.data);
    agregarSegmentos("bss", proceso.bss);

    // ✅ Agregar stack y heap
    nuevosSegmentos.push({
      pid: proceso.id,
      tipo: "stack",
      base,
      limite: TAM_STACK,
      ocupado: true,
    });
    base += TAM_STACK;

    nuevosSegmentos.push({
      pid: proceso.id,
      tipo: "heap",
      base,
      limite: TAM_HEAP,
      ocupado: true,
    });
    base += TAM_HEAP;

    // Actualizar bloque libre
    const idxLibre = this.segmentos.indexOf(libre);
    libre.base += totalBytes;
    libre.limite -= totalBytes;

    // Si el espacio libre quedó vacío, eliminarlo
    if (libre.limite <= 0) this.segmentos.splice(idxLibre, 1);

    // Insertar nuevos segmentos antes del siguiente bloque libre
    this.segmentos.splice(idxLibre, 0, ...nuevosSegmentos);

    this.procesosCargados.push(proceso);

    // 🧹 Compactar por si se crearon fragmentos libres contiguos
    this.compactar();

    return true;
  }

  liberarProceso(pid) {
    const eliminados = this.segmentos.filter(s => s.pid === pid);
    if (eliminados.length === 0) return;

    const baseMin = Math.min(...eliminados.map(s => s.base));
    const totalTam = eliminados.reduce((acc, s) => acc + s.limite, 0);
    this.segmentos = this.segmentos.filter(s => s.pid !== pid);

    // Insertar nuevo bloque libre
    this.segmentos.push({
      pid: "Libre",
      tipo: "Espacio libre",
      base: baseMin,
      limite: totalTam,
      ocupado: false,
    });

    // 🧹 Compactar espacios libres contiguos
    this.compactar();

    this.procesosCargados = this.procesosCargados.filter(p => p.id !== pid);
  }
obtenerEstadisticas() {
    const bytesTotales = this.TAM_TOTAL;

    const bytesOcupados = this.segmentos
      .filter(s => s.ocupado)
      .reduce((a, s) => a + s.limite, 0);
    const bytesLibres = bytesTotales - bytesOcupados;

    const porcentajeOcupado = ((bytesOcupados / bytesTotales) * 100).toFixed(2);
    const porcentajeLibre = (100 - porcentajeOcupado).toFixed(2);

    const stack = this.segmentos.filter(s => s.tipo === "stack")
      .reduce((a, s) => a + s.limite, 0);
    const heap = this.segmentos.filter(s => s.tipo === "heap")
      .reduce((a, s) => a + s.limite, 0);

    return {
      bytesTotales,
      bytesOcupados,
      bytesLibres,
      porcentajeOcupado,
      porcentajeLibre,
      stack,
      heap,
    };
  }



  obtenerMapa() {
    return this.segmentos.map(s => ({
      pid: s.pid,
      tipo: s.tipo,
      base: s.base,
      limite: s.limite,
      direccionHex: `0x${s.base.toString(16).toUpperCase().padStart(6, "0")}`,
      direccionDec: `${s.base.toLocaleString()} B`,
      ocupado: s.ocupado,
    }));
  }
}

// 📋 Procesos disponibles
export const procesos = [
  { id: "P1", name: "Notepad", text: 19524, data: 123520, bss: 1165 },
  { id: "P2", name: "Word", text: 77539, data: 326800, bss: 4100 },
  { id: "P3", name: "Excel", text: 99542, data: 242450, bss: 7557 },
  { id: "P4", name: "AutoCAD", text: 115000, data: 123470, bss: 1123 },
  { id: "P5", name: "Calculadora", text: 12342, data: 125600, bss: 1756 },
  { id: "P6", name: "Visual Studio Code", text: 525000, data: 8224000, bss: 51000 },
  { id: "P7", name: "Spotify", text: 590000, data: 4974000, bss: 25000 },
  { id: "P8", name: "Adobe Acrobat", text: 349000, data: 7150000, bss: 1000 },
];
