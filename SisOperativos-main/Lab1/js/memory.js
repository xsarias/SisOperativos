// js/memory.js
let memoria = [
  { pid: "SO", inicio: 0, tam: 1048576, estado: "ocupado" },
  { pid: null, inicio: 1048576, tam: 15728640, estado: "libre" }
];

// Buscar hueco libre y asignar (con división de bloques)
function asignarProceso(pid, tam) {
  for (let i = 0; i < memoria.length; i++) {
    let bloque = memoria[i];
    if (bloque.estado === "libre" && bloque.tam >= tam) {
      // Si el bloque es más grande que lo solicitado → dividir
      if (bloque.tam > tam) {
        memoria.splice(i, 1,
          { pid: pid, inicio: bloque.inicio, tam: tam, estado: "ocupado" },
          { pid: null, inicio: bloque.inicio + tam, tam: bloque.tam - tam, estado: "libre" }
        );
      } else {
        // Exacto
        bloque.pid = pid;
        bloque.estado = "ocupado";
      }
      return { ok: true, msg: `Proceso ${pid} asignado (${tam} bytes)` };
    }
  }
  return { ok: false, msg: `No hay suficiente memoria para ${pid}` };
}

// Liberar proceso
function liberarProceso(pid) {
  for (let bloque of memoria) {
    if (bloque.pid === pid) {
      bloque.pid = null;
      bloque.estado = "libre";
      return { ok: true, msg: `Proceso ${pid} liberado` };
    }
  }
  return { ok: false, msg: `Proceso ${pid} no encontrado` };
}

// Compactar (opcional)
function compactar() {
  let nuevas = [];
  let inicio = 0;
  for (let bloque of memoria) {
    if (bloque.estado === "ocupado") {
      nuevas.push({ ...bloque, inicio });
      inicio += bloque.tam;
    }
  }
  // El hueco libre al final
  let libreTotal = memoria.filter(b => b.estado === "libre").reduce((acc, b) => acc + b.tam, 0);
  if (libreTotal > 0) {
    nuevas.push({ pid: null, inicio, tam: libreTotal, estado: "libre" });
  }
  memoria = nuevas;
  return { ok: true, msg: "Memoria compactada" };
}
