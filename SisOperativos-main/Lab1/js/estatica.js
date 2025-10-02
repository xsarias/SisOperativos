// js/estatica.js

const RAM_TOTAL = 16 * 1024; // 16 MiB en KB

// Particiones estáticas predefinidas
let particiones = [
  { id: "SO", base: 0, tam: 1024, estado: "ocupado" }, // SO fijo
  { id: null, base: 1024, tam: 2048, estado: "libre" },
  { id: null, base: 3072, tam: 4096, estado: "libre" },
  { id: null, base: 7168, tam: 2048, estado: "libre" },
  { id: null, base: 9216, tam: 4096, estado: "libre" },
  { id: null, base: 13312, tam: 3072, estado: "libre" }
];

// Lista de programas instalados
const programas = [
  { pid: "P1", nombre: "Notepad", tam: 225 },
  { pid: "P2", nombre: "Word", tam: 287 },
  { pid: "P3", nombre: "Excel", tam: 309 },
  { pid: "P4", nombre: "Photoshop", tam: 1200 },
  { pid: "P5", nombre: "Visual Studio", tam: 3048 }
];

// Inicializar interfaz
function initEstatica() {
  const main = document.getElementById("contenedor");

  main.innerHTML = `
    <div class="layout">
      <!-- Mapa de memoria -->
      <section class="mapa">
        <h2>Mapa de Memoria</h2>
        <div id="memoria" class="memoria"></div>
      </section>

      <!-- Tabla particiones y estado -->
      <section class="tabla">
        <h2>Tabla de Particiones</h2>
        <table id="tabla-particiones">
          <thead>
            <tr>
              <th>Base (KB)</th>
              <th>Tamaño (KB)</th>
              <th>Estado</th>
              <th>PID</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>

        <h2>Estado Global</h2>
        <p>Ocupado: <span id="mem-ocupado"></span> KB</p>
        <p>Libre: <span id="mem-libre"></span> KB</p>

        <h2>Programas</h2>
        <table id="tabla-programas">
          <thead>
            <tr><th>PID</th><th>Nombre</th><th>Tamaño (KB)</th><th>Acción</th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </section>
    </div>
  `;

  renderizar();
}

// Cargar programa
function cargarProceso(pid, tam) {
  let bloque = particiones.find(p => p.estado === "libre" && p.tam >= tam);
  if (!bloque) {
    alert("No hay partición disponible para " + pid + " (" + tam + " KB)");
    return;
  }
  bloque.estado = "ocupado";
  bloque.id = pid;
  renderizar();
}

// Liberar programa
function liberarProceso(pid) {
  let bloque = particiones.find(p => p.id === pid);
  if (bloque) {
    bloque.id = null;
    bloque.estado = "libre";
    renderizar();
  }
}

// Dibujar memoria y tablas
function renderizar() {
  // 1. Mapa vertical
  const memDiv = document.getElementById("memoria");
  memDiv.innerHTML = "";
  [...particiones].reverse().forEach(p => { // invertimos para mostrar altas arriba
    const div = document.createElement("div");
    div.classList.add("bloque", p.estado);
    div.innerHTML = `
      <span class="dir">0x${(p.base*1024).toString(16).toUpperCase()}</span>
      <span class="contenido">${p.id ? p.id : "Libre"}<br>(${p.tam} KB)</span>
    `;
    memDiv.appendChild(div);
  });

  // 2. Tabla particiones
  const tbodyPart = document.querySelector("#tabla-particiones tbody");
  tbodyPart.innerHTML = "";
  particiones.forEach(p => {
    tbodyPart.innerHTML += `
      <tr>
        <td>${p.base}</td>
        <td>${p.tam}</td>
        <td>${p.estado}</td>
        <td>${p.id ? p.id : "-"}</td>
        <td>${p.id && p.id!=="SO" ? 
          `<button onclick="liberarProceso('${p.id}')">Liberar</button>` : "-"}</td>
      </tr>
    `;
  });

  // 3. Estado global
  let ocupado = particiones.filter(p => p.estado === "ocupado")
                           .reduce((acc,p)=>acc+p.tam,0);
  document.getElementById("mem-ocupado").textContent = ocupado;
  document.getElementById("mem-libre").textContent = RAM_TOTAL - ocupado;

  // 4. Tabla programas
  const tbodyProg = document.querySelector("#tabla-programas tbody");
  tbodyProg.innerHTML = "";
  programas.forEach(pr => {
    const yaCargado = particiones.some(p => p.id === pr.pid);
    tbodyProg.innerHTML += `
      <tr>
        <td>${pr.pid}</td>
        <td>${pr.nombre}</td>
        <td>${pr.tam}</td>
        <td>
          ${yaCargado 
            ? `<button onclick="liberarProceso('${pr.pid}')">Liberar</button>` 
            : `<button onclick="cargarProceso('${pr.pid}',${pr.tam})">Cargar</button>`}
        </td>
      </tr>
    `;
  });
}
