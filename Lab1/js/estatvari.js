// js/estatvari.js
import { firstFit, bestFit, worstFit, nextFit } from "./algoritmos.js";
import { Memoria } from "./memory.js";

// Configuración
const RAM_TOTAL = 16 * 1024; // 16 MiB en KB
let algoritmo = "first"; // por defecto
let memoria;

// Tabla de programas (valores en BYTES excepto memKiB)
const programs = [
  { id: "P1", name: "Notepad", memUse: 224649, memKiB: 219 },
  { id: "P2", name: "Word", memUse: 286708, memKiB: 280 },
  { id: "P3", name: "Excel", memUse: 309150, memKiB: 302 },
  { id: "P4", name: "AutoCAD", memUse: 436201, memKiB: 426 },
  { id: "P5", name: "Calculadora", memUse: 209462, memKiB: 205 },
  { id: "P6", name: "Visual Studio Code", memUse: 3996608, memKiB: 3903 },
  { id: "P7", name: "Spotify", memUse: 1785608, memKiB: 1744 },
  { id: "P8", name: "Adobe Acrobat", memUse: 2696608, memKiB: 2633 }
];

// ===================== Inicializar Vista =====================
export function inicializarVista() {
  memoria = new Memoria(RAM_TOTAL);
  crearParticionesIniciales();

  const main = document.getElementById("contenedor");
  main.innerHTML = `
    <div class="layout">
      <section class="tabla card">
        <h2>Selector de Algoritmo</h2>
        <select id="algoritmo">
          <option value="first">Primer Ajuste</option>
          <option value="best">Mejor Ajuste</option>
          <option value="worst">Peor Ajuste</option>
        </select>

        <h2>Tamaño Particiones</h2>
        <table id="tabla-particion-size">
          <thead>
            <tr><th>Bytes</th><th>KiB</th><th>MiB</th></tr>
          </thead>
          <tbody></tbody>
        </table>

        <h2>Tabla de Particiones</h2>
        <table id="tabla-particiones">
          <thead>
            <tr>
              <th>#</th>
              <th>Base (KB)</th>
              <th>Base (Hex)</th>
              <th>Tamaño (KB)</th>
              <th>Estado</th>
              <th>PID</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>

        <h2>Estado Global</h2>
        <div class="estado-global">
          <p>Ocupado: <span id="mem-ocupado">0</span> KB</p>
          <p>Libre: <span id="mem-libre">0</span> KB</p>
        </div>
      </section>

      <section class="programas card">
        <h2>Generalidades</h2>
        <table id="tabla-resumen">
          <thead>
            <tr><th>Concepto</th><th>MiB</th><th>KiB</th><th>Bytes</th></tr>
          </thead>
          <tbody></tbody>
        </table>

        <h2>Tabla Detallada de Programas</h2>
        <table id="tabla-programas-detallada">
          <thead>
            <tr>
              <th>PID</th>
              <th>Nombre</th>
              <th>Memoria a usar (Bytes)</th>
              <th>KiB</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </section>

      <section class="mapa card">
        <h2>Mapa de Memoria</h2>
        <div id="memoria" class="memoria"></div>
      </section>
    </div>
  `;

  document.getElementById("algoritmo").addEventListener("change", e => cambiarAlgoritmo(e.target.value));

  renderTablaParticionSize();
  renderResumen();
  renderProgramDetails();
  renderizar();
  console.log("Vista Estática Variable inicializada");
}

// ===================== Crear Particiones Iniciales =====================
function crearParticionesIniciales() {
  // Fijar partición del SO
  memoria.particiones = [{ base: 0, tamano: 512, estado: "ocupado", id: "SO" }];

  // Particiones libres variadas en KB
  const tamaños = [512, 1024, 2048, 4096, 8192, 1024, 2048, 512];
  let base = 512; // empieza después del SO
  memoria.particiones.push(...tamaños.map(tam => {
    const p = { base, tamano: tam, estado: "libre" };
    base += tam;
    return p;
  }));
}

// ===================== Tabla Tamaño de Particiones =====================
function renderTablaParticionSize() {
  const tbody = document.querySelector("#tabla-particion-size tbody");
  tbody.innerHTML = "";
  memoria.particiones.forEach(p => {
    const bytes = p.tamano * 1024;
    const KiB = p.tamano;
    const MiB = (p.tamano / 1024).toFixed(2);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${bytes.toLocaleString()}</td><td>${KiB}</td><td>${MiB}</td>`;
    tbody.appendChild(tr);
  });
}

// ===================== Funciones auxiliares =====================
function cambiarAlgoritmo(value) {
  algoritmo = value;
  console.log("Algoritmo cambiado a:", algoritmo);
}

function renderProgramDetails() {
  const tbody = document.querySelector("#tabla-programas-detallada tbody");
  tbody.innerHTML = "";
  programs.forEach(pr => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${pr.id}</td>
      <td>${pr.name}</td>
      <td>${pr.memUse}</td>
      <td>${pr.memKiB}</td>
      <td><button class="btn-cargar">Cargar</button></td>
    `;
    tr.querySelector(".btn-cargar").addEventListener("click", () => cargarProceso(pr.id, pr.memUse));
    tbody.appendChild(tr);
  });
}

function renderizar() {
  const memDiv = document.getElementById("memoria");
  memDiv.innerHTML = "";

  memoria.particiones.slice().reverse().forEach(p => {
    const div = document.createElement("div");
    div.classList.add("bloque", p.estado);
    const baseBytes = (p.base || 0) * 1024;
    const hexAddr = baseBytes.toString(16).toUpperCase().padStart(6, "0");
    div.innerHTML = `
      <span class="dir-hex">0x${hexAddr}</span>
      <span class="contenido">${p.id ? p.id : "Libre"} (${p.tamano} KB)</span>
      <span class="dir-dec">${baseBytes}</span>
    `;
    memDiv.appendChild(div);
  });

  // Tabla de particiones
  const tbody = document.querySelector("#tabla-particiones tbody");
  tbody.innerHTML = "";
  memoria.particiones.forEach((p, idx) => {
    const baseBytes = (p.base || 0) * 1024;
    const baseHex = "0x" + baseBytes.toString(16).toUpperCase().padStart(6, "0");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${p.base}</td>
      <td>${baseHex}</td>
      <td>${p.tamano}</td>
      <td>${p.estado}</td>
      <td>${p.id ?? "-"}</td>
      <td>${p.id && p.id !== "SO" ? `<button class="btn-liberar">Liberar</button>` : "-"}</td>
    `;
    if (p.id && p.id !== "SO") {
      tr.querySelector(".btn-liberar").addEventListener("click", () => liberarProceso(p.id));
    }
    tbody.appendChild(tr);
  });

  // Estado global
  document.getElementById("mem-ocupado").textContent = memoria.getOcupado?.() ?? 0;
  document.getElementById("mem-libre").textContent = memoria.getLibre?.() ?? (RAM_TOTAL - (memoria.getOcupado?.() ?? 0));
}

// ===================== Tabla de Generalidades =====================
function renderResumen() {
  const tbody = document.querySelector("#tabla-resumen tbody");
  if (!tbody) return;

  const RAM_TOTAL_KB = RAM_TOTAL;
  const RAM_TOTAL_MiB = (RAM_TOTAL / 1024).toFixed(0);
  const RAM_TOTAL_Bytes = RAM_TOTAL * 1024;

  const pilaKB = 64;
  const monticuloKB = 128;
  const totalSO_KB = pilaKB + monticuloKB;
  const totalSO_Bytes = totalSO_KB * 1024;
  const exeBytes = 767;

  tbody.innerHTML = `
    <tr>
      <td>RAM Instalada</td>
      <td>${RAM_TOTAL_MiB}</td>
      <td>${RAM_TOTAL_KB}</td>
      <td>${RAM_TOTAL_Bytes}</td>
    </tr>
    <tr>
      <td>Pila</td>
      <td></td>
      <td>${pilaKB}</td>
      <td>${pilaKB * 1024}</td>
    </tr>
    <tr>
      <td>Montículo</td>
      <td></td>
      <td>${monticuloKB}</td>
      <td>${monticuloKB * 1024}</td>
    </tr>
    <tr>
      <td>Total SO</td>
      <td></td>
      <td>${totalSO_KB}</td>
      <td>${totalSO_Bytes}</td>
    </tr>
    <tr>
      <td>Encabezado EXE</td>
      <td></td>
      <td></td>
      <td>${exeBytes}</td>
    </tr>
  `;
}

// ===================== Acciones =====================
function cargarProceso(pid, sizeBytes) {
  const sizeKB = Math.ceil(sizeBytes / 1024);
  const programa = { id: pid, tamano: sizeKB };

  let ok = false;

  if (algoritmo === "first") {
    // firstFit ahora devuelve la partición, hay que asignar manualmente
    const p = firstFit(memoria, programa);
    if (p) {
      p.id = programa.id;
      p.estado = "ocupado";
      ok = true;
    }
  } else if (algoritmo === "best") {
    ok = bestFit(memoria, programa);
  } else if (algoritmo === "worst") {
    ok = worstFit(memoria, programa);
  } else if (algoritmo === "next") {
    ok = nextFit(memoria, programa);
  }

  if (!ok) alert("Memoria insuficiente para " + pid);
  renderizar();
}
