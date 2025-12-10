// vista.js
import { MemoriaPaginada } from "./MemoriaPaginada.js";

const memoria = new MemoriaPaginada();

const procesos = [
  { id: "P1", name: "Notepad", text: 19524, data: 12352, bss: 1165 },
  { id: "P2", name: "Word", text: 77539, data: 32680, bss: 4100 },
  { id: "P3", name: "Excel", text: 99542, data: 24245, bss: 7557 },
  { id: "P4", name: "AutoCAD", text: 115000, data: 123470, bss: 1123 },
  { id: "P5", name: "Calculadora", text: 12342, data: 1256, bss: 1756 },
  { id: "P6", name: "Visual Studio Code", text: 525000, data: 3224000, bss: 51000 },
  { id: "P7", name: "Spotify", text: 590000, data: 974000, bss: 25000 },
  { id: "P8", name: "Adobe Acrobat", text: 349000, data: 2150000, bss: 1000 },
];

export function inicializarVista() {
  const main = document.getElementById("contenedor");
  main.innerHTML = `
    <div class="layout">
      <!-- 📋 Tabla de programas -->
      <section class="card programas">
        <h2>Programas disponibles</h2>
        <table id="tabla-programas">
          <thead>
            <tr>
              <th>ID</th><th>Nombre</th><th>.text</th><th>.data</th><th>.bss</th><th>Total (pág.)</th><th>Cargar</th><th>Liberar</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>

       

        <!-- 🧠 Información de la memoria -->
        <h2>Información de Memoria</h2>
        <table>
          <tbody>
            <tr><td><b>RAM instalada</b></td><td>16 MiB</td></tr>
            <tr><td>Bytes totales</td><td>16.777.216</td></tr>
            <tr><td>N° marcos</td><td>256</td></tr>
            <tr><td colspan="2"><b>Memoria virtual</b></td></tr>
            <tr><td>Tamaño medio</td><td>268.435.456 bytes (256 MiB)</td></tr>
            <tr><td>N° marcos virtuales</td><td>4096</td></tr>
            <tr><td><b>Total direccionable</b></td><td>285.212.672 bytes</td></tr>
          </tbody>
        </table>
      </section>

      <!-- 📊 Cálculo de páginas -->
      <section class="card calculo">
        <h2>Cálculo de páginas a usar</h2>
        <table id="tabla-paginas">
          <thead>
            <tr>
              <th>ID</th><th>.text</th><th>.data</th><th>.bss</th><th>.stack</th><th>Total</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>

        <!-- 📈 Estado de memoria -->
        <div class="estado-global">
          <h3>Estado de la memoria</h3>
          <table id="tabla-estado-memoria">
            <thead>
              <tr><th>Estado</th><th>Bytes</th><th>Marcos</th><th>Porcentaje</th></tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
         <!-- 🧩 Tabla de tamaños de secciones -->
        <h2>Tamaño de secciones</h2>
        <table>
          <thead><tr><th>.stack</th><th>.heap</th></tr></thead>
          <tbody><tr><td>65.536</td><td>131.072</td></tr></tbody>
        </table>
      </section>

      <!-- 💾 Mapa de Memoria -->
      <section class="card memoria">
        <h2>Mapa de Memoria</h2>
        <div class="memoria-scroll" id="mapa-memoria"></div>
      </section>
    </div>
  `;

  renderProgramas();
  renderCalculoPaginas();
  renderMapa();
  renderEstadoMemoria();
}

function renderProgramas() {
  const tbody = document.querySelector("#tabla-programas tbody");
  tbody.innerHTML = "";

  procesos.forEach(p => {
    const totalPag = Math.ceil(p.text / 65536) + Math.ceil(p.data / 65536) + Math.ceil(p.bss / 65536) + 1;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.text.toLocaleString()}</td>
      <td>${p.data.toLocaleString()}</td>
      <td>${p.bss.toLocaleString()}</td>
      <td>${totalPag}</td>
      <td>
        <button class="btn-cargar">➕</button>
      </td>
      <td>
        <button class="btn-liberar">✖️</button>
      </td>
    `;
    tbody.appendChild(tr);

    tr.querySelector(".btn-cargar").addEventListener("click", () => {
      const pags = {
        text: Math.ceil(p.text / 65536),
        data: Math.ceil(p.data / 65536),
        bss: Math.ceil(p.bss / 65536),
        stack: 1
      };
      if (!memoria.cargarProceso(p.id, pags.text, pags.data, pags.bss, pags.stack)) {
        alert("⚠️ No hay espacio suficiente para " + p.name);
      }
      actualizarVista();
    });

    tr.querySelector(".btn-liberar").addEventListener("click", () => {
      memoria.liberarProceso(p.id);
      actualizarVista();
    });
  });
}

// 📊 Cálculo de páginas
function renderCalculoPaginas() {
  const tbody = document.querySelector("#tabla-paginas tbody");
  tbody.innerHTML = "";

  procesos.forEach(p => {
    const t = Math.ceil(p.text / 65536);
    const d = Math.ceil(p.data / 65536);
    const b = Math.ceil(p.bss / 65536);
    const s = 1;
    const total = t + d + b + s;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td><td>${t}</td><td>${d}</td><td>${b}</td><td>${s}</td><td>${total}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 🧠 Mapa visual de memoria (bloques de abajo hacia arriba)
function renderMapa() {
  const contenedor = document.getElementById("mapa-memoria");
  contenedor.innerHTML = "";

  const marcos = [...memoria.marcos].reverse();

  marcos.forEach(m => {
    const bloque = document.createElement("div");
    bloque.classList.add("bloque");

    if (m.pid === "S.O.") bloque.classList.add("SO");
    else if (m.ocupado) bloque.classList.add("ocupado");
    else bloque.classList.add("libre");

    bloque.innerHTML = `
      <span class="dir-hex">0x${(m.marco * 65536).toString(16).toUpperCase().padStart(6, "0")}</span>
      <span>${m.pid || "Libre"} ${m.tipo ? `(.${m.tipo})` : ""}</span>
      <span class="dir-dec">${(m.marco * 65536).toLocaleString()} B</span>
      <span class="tam-pag">(65.536 B)</span>
    `;
    contenedor.appendChild(bloque);
  });

  // 📜 se mantiene abajo (como pila visual)
  contenedor.scrollTop = contenedor.scrollHeight;
}

// 📈 Estado general de la memoria
function renderEstadoMemoria() {
  const tbody = document.querySelector("#tabla-estado-memoria tbody");
  tbody.innerHTML = "";

  const totalMarcos = memoria.marcos.length;
  const usados = memoria.marcos.filter(m => m.ocupado).length;
  const libres = totalMarcos - usados;

  const bytesUsados = usados * 65536;
  const bytesLibres = libres * 65536;
  const totalBytes = totalMarcos * 65536;

  const porc = ((usados / totalMarcos) * 100).toFixed(2);

  const fila1 = `
    <tr><td>Ocupado</td><td>${bytesUsados.toLocaleString()}</td><td>${usados}</td><td>${porc}%</td></tr>
    <tr><td>Libre</td><td>${bytesLibres.toLocaleString()}</td><td>${libres}</td><td>${(100 - porc).toFixed(2)}%</td></tr>
    <tr><td><b>Total</b></td><td><b>${totalBytes.toLocaleString()}</b></td><td><b>${totalMarcos}</b></td><td>100%</td></tr>
  `;

  tbody.innerHTML = fila1;
}

// 🔄 Actualiza todo
function actualizarVista() {
  renderMapa();
  renderEstadoMemoria();
}
