// js/estatvari.js
import { Memoria } from "./memory.js";

// Configuración
const RAM_TOTAL = 16 * 1024; // 16 MiB en KB
let memoria;

// Tabla de programas (valores en BYTES excepto memKiB)
const programs = [
  { id: "P1", name: "Notepad", disk: 33808, code: 19524, dataInit: 12352, dataUninit: 1165, memInit: 33041, memUse: 224649, memKiB: 219 },
  { id: "P2", name: "Word", disk: 115086, code: 77539, dataInit: 32680, dataUninit: 4100, memInit: 114319, memUse: 286708, memKiB: 280 },
  { id: "P3", name: "Excel", disk: 132111, code: 99542, dataInit: 24245, dataUninit: 7557, memInit: 131344, memUse: 309150, memKiB: 302 },
  { id: "P4", name: "AutoCAD", disk: 240360, code: 115000, dataInit: 123470, dataUninit: 1123, memInit: 239593, memUse: 436201, memKiB: 426 },
  { id: "P5", name: "Calculadora", disk: 16121, code: 12342, dataInit: 1256, dataUninit: 1756, memInit: 15354, memUse: 209462, memKiB: 205 },
  { id: "P6", name: "Visual Studio Code", disk: 3800767, code: 525000, dataInit: 3224000, dataUninit: 51000, memInit: 3800000, memUse: 3996608, memKiB: 3903 },
  { id: "P7", name: "Spotify", disk: 1589767, code: 590000, dataInit: 974000, dataUninit: 25000, memInit: 1589000, memUse: 1785608, memKiB: 1744 },
  { id: "P8", name: "Adobe Acrobat", disk: 2500767, code: 349000, dataInit: 2150000, dataUninit: 1000, memInit: 2500000, memUse: 2696608, memKiB: 2633 }
];
// ===================== Inicializar Vista =====================
export function inicializarVista() {
    memoria = new Memoria(RAM_TOTAL);
    crearParticionesIniciales();

    const main = document.getElementById("contenedor");
    main.innerHTML = `
    <div class="layout">
      <section class="tabla card">
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
      </section>

      <section class="programas card">
      <h2>Generalidades</h2>
        <table id="tabla-resumen">
          <thead>
            <tr><th>Concepto</th><th>MiB</th><th>KiB</th><th>Bytes</th></tr>
          </thead>
          <tbody></tbody>
        </table>
        <h2>Programas Instalados</h2>
        <table id="tabla-programas-detallada">
          <thead>
            <tr>
              <th>PID</th>
              <th>Nombre</th>
              <th>Disco</th>
              <th>Código</th>
              <th>Datos Init</th>
              <th>Datos No Init</th>
              <th>Memoria Inicial</th>
              <th>Memoria a usar (Bytes)</th>
              <th>KiB</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
        <h2>Programas Instalados</h2>
        <table id="tabla-programas-detallada">
          <thead>
            <tr>
              <th>PID</th>
              <th>Nombre</th>
              <th>Disco</th>
              <th>Código</th>
              <th>Datos Init</th>
              <th>Datos No Init</th>
              <th>Memoria Inicial</th>
              <th>Memoria a usar (Bytes)</th>
              <th>KiB</th>
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

      <section class="mapa card">
        <h2>Mapa de Memoria</h2>
        <div id="memoria" class="memoria"></div>
      </section>
    </div>
  `;

    renderTablaParticionSize();
    renderProgramDetails();
    renderizar();
    renderResumen();
}

// ===================== Crear Particiones Iniciales =====================
function crearParticionesIniciales() {
    memoria.particiones = [{ base: 0, tamano: 512, estado: "ocupado", id: "SO" }];
    const tamaños = [512, 1024, 2048, 4096, 8192, 1024, 2048, 512];
    let base = 512;
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

// ===================== Render Tabla Programas =====================
function renderProgramDetails() {
    const tbody = document.querySelector("#tabla-programas-detallada tbody");
    tbody.innerHTML = "";
    programs.forEach(pr => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${pr.id}</td>
      <td>${pr.name}</td>
      <td>${pr.disk}</td>
      <td>${pr.code}</td>
      <td>${pr.dataInit}</td>
      <td>${pr.dataUninit}</td>
      <td>${pr.memInit}</td>
      <td>${pr.memUse}</td>
      <td>${pr.memKiB}</td>
      <td><button class="btn-cargar">Cargar</button></td>
    `;
        tbody.appendChild(tr);

        // Listener para cargar
        tr.querySelector(".btn-cargar").addEventListener("click", () => {
            cargar(pr.id, pr.memUse);
        });
    });
}


// ===================== Renderizar Memoria =====================
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
      <span class="contenido">${p.id ?? "Libre"} (${p.tamano} KB)</span>
      <span class="dir-dec">${baseBytes}</span>
    `;
        memDiv.appendChild(div);
    });

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

    document.getElementById("mem-ocupado").textContent = memoria.getOcupado?.() ?? 0;
    document.getElementById("mem-libre").textContent = memoria.getLibre?.() ?? (RAM_TOTAL - (memoria.getOcupado?.() ?? 0));
}
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


// ===================== Mejor Ajuste =====================
function bestFit(memoria, programa) {
    let mejor = null;
    memoria.particiones.forEach(p => {
        if (p.estado === "libre" && p.tamano >= programa.tamano) {
            if (!mejor || p.tamano < mejor.tamano) {
                mejor = p;
            }
        }
    });
    return mejor;
}

// ===================== Acciones =====================
function cargarProceso(pid, sizeBytes) {
    const sizeKB = Math.ceil(sizeBytes / 1024);
    const programa = { id: pid, tamano: sizeKB };

    const p = bestFit(memoria, programa);
    if (p) {
        p.id = pid;
        p.estado = "ocupado";
    } else {
        alert("Memoria insuficiente para " + pid);
    }

    renderProgramDetails();
    renderizar();
}

function liberarProceso(pid) {
    const part = memoria.particiones.find(p => p.id === pid);
    if (part) {
        part.id = null;
        part.estado = "libre";
    }
    renderProgramDetails();
    renderizar();
}
