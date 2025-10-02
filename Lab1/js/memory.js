// js/memory.js
let memoria = [
  { pid: "SO", inicio: 0, tam: 1048576, estado: "ocupado" },
  { pid: null, inicio: 1048576, tam: 15728640, estado: "libre" }
];

// Buscar hueco libre y asignar
function asignarProceso(pid, tam) {
  for (let bloque of memoria) {
    if (bloque.estado === "libre" && bloque.tam >= tam) {
      bloque.pid = pid;
      bloque.estado = "ocupado";
      return true;
    }
  }
  alert("No hay suficiente memoria para " + pid);
  return false;
}

// Liberar proceso
function liberarProceso(pid) {
  for (let bloque of memoria) {
    if (bloque.pid === pid) {
      bloque.pid = null;
      bloque.estado = "libre";
    }
  }
}
