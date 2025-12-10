// segmentacion.js
import { MemoriaSegmentada, procesos } from "./MemoriaSegmentada.js";

const memoria = new MemoriaSegmentada();

export function inicializarVista() {
  const main = document.getElementById("contenedor");
  main.innerHTML = `
    <div class="seg-layout">
      <!-- 📋 Tabla de programas -->
      <section class="seg-card seg-programas">
        <h2>Programas disponibles</h2>
        <table id="seg-tabla-programas">
          <thead>
            <tr>
              <th>ID</th><th>Nombre</th><th>.text</th><th>.data</th><th>.bss</th>
              <th>Total (B)</th><th>Cargar</th><th>Liberar</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>

        <h2>Especificación de segmentos por proceso</h2>
        <table id="tabla-segmentos">
          <thead>
            <tr>
              <th>ID</th>
              <th>.text (seg.)</th>
              <th>.text (último)</th>
              <th>.data (seg.)</th>
              <th>.data (último)</th>
              <th>.bss (seg.)</th>
              <th>.bss (último)</th>
              <th>Heap</th>
              <th>Stack</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>

        <h2>Tabla de fragmentos libres</h2>
        <table id="tabla-fragmentos">
          <thead>
            <tr>
              <th>Base (dec)</th>
              <th>Base (hex)</th>
              <th>Tamaño (B)</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>

        <h2>Información de Memoria</h2>
        <table id="tabla-info">
          <thead>
            <tr><th>Campo</th><th>Valor</th></tr>
          </thead>
          <tbody>
            <tr><td>RAM instalada</td><td>16 MiB</td></tr>
            <tr><td>Bytes totales</td><td id="bytesTotales"></td></tr>
            <tr><td>Ocupado</td><td id="infoOcupado"></td></tr>
            <tr><td>Libre</td><td id="infoLibre"></td></tr>
            <tr><td>.stack total</td><td id="infoStack"></td></tr>
            <tr><td>.heap total</td><td id="infoHeap"></td></tr>
          </tbody>
        </table>
      </section>

      <!-- 💾 Mapa de Memoria -->
      <section class="seg-card seg-memoria">
        <h2>Mapa de Memoria Segmentada</h2>
        <div class="seg-memoria-scroll" id="seg-mapa-memoria"></div>
        <div class="seg-info">
          Espacio libre restante: <span id="seg-espacio-restante">0 B</span>
        </div>
      </section>
    </div>
  `;

  renderProgramas();
  actualizarVista();
}

function renderProgramas() {
  const tbody = document.querySelector("#seg-tabla-programas tbody");
  tbody.innerHTML = "";
  procesos.forEach(p => {
    const total = p.text + p.data + p.bss + 65536 + 131072;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td><td>${p.name}</td>
      <td>${p.text.toLocaleString()}</td>
      <td>${p.data.toLocaleString()}</td>
      <td>${p.bss.toLocaleString()}</td>
      <td>${total.toLocaleString()}</td>
      <td><button class="seg-btn-cargar">➕</button></td>
      <td><button class="seg-btn-liberar">✖️</button></td>
    `;
    tbody.appendChild(tr);
    tr.querySelector(".seg-btn-cargar").addEventListener("click", () => {
      memoria.cargarProceso(p);
      actualizarVista();
    });
    tr.querySelector(".seg-btn-liberar").addEventListener("click", () => {
      memoria.liberarProceso(p.id);
      actualizarVista();
    });
  });
}

function renderMapa() {
  const contenedor = document.getElementById("seg-mapa-memoria");
  contenedor.innerHTML = "";
  memoria.obtenerMapa().forEach(seg => {
    const bloque = document.createElement("div");
    bloque.classList.add("seg-bloque");
    if (seg.pid === "S.O.") bloque.classList.add("seg-so");
    else if (seg.pid === "Libre") bloque.classList.add("seg-libre");
    else bloque.classList.add("seg-ocupado", `seg-${seg.tipo}`);
    bloque.style.flex = seg.limite;
    bloque.innerHTML = `
      <span class="seg-dir-hex">${seg.direccionHex}</span>
      <span>${seg.pid} ${seg.tipo ? `(.${seg.tipo})` : ""}</span>
      <span class="seg-tam">${seg.limite.toLocaleString()} B</span>
    `;
    contenedor.appendChild(bloque);
  });
}

function renderTablaSegmentos() {
  const tbody = document.querySelector("#tabla-segmentos tbody");
  tbody.innerHTML = "";
  memoria.procesosCargados.forEach(p => {
    const text = memoria.calcularSegmentos(p.text);
    const data = memoria.calcularSegmentos(p.data);
    const bss = memoria.calcularSegmentos(p.bss);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${text.cantidad}</td><td>${text.ultimo.toLocaleString()}</td>
      <td>${data.cantidad}</td><td>${data.ultimo.toLocaleString()}</td>
      <td>${bss.cantidad}</td><td>${bss.ultimo.toLocaleString()}</td>
      <td>131,072</td><td>65,536</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderTablaFragmentos() {
  const tbody = document.querySelector("#tabla-fragmentos tbody");
  tbody.innerHTML = "";
  memoria.segmentos.filter(s => !s.ocupado).forEach(l => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${l.base.toLocaleString()}</td>
      <td>0x${l.base.toString(16).toUpperCase()}</td>
      <td>${l.limite.toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

function actualizarInfoMemoria() {
  const e = memoria.obtenerEstadisticas();
  document.getElementById("bytesTotales").textContent = e.bytesTotales.toLocaleString();
  document.getElementById("infoOcupado").textContent =
    `${e.bytesOcupados.toLocaleString()} B (${e.porcentajeOcupado}%)`;
  document.getElementById("infoLibre").textContent =
    `${e.bytesLibres.toLocaleString()} B (${e.porcentajeLibre}%)`;
  document.getElementById("infoStack").textContent = e.stack.toLocaleString() + " B";
  document.getElementById("infoHeap").textContent = e.heap.toLocaleString() + " B";
  document.getElementById("seg-espacio-restante").textContent =
    e.bytesLibres.toLocaleString() + " B";
}

function actualizarVista() {
  renderMapa();
  renderTablaSegmentos();
  renderTablaFragmentos();
  actualizarInfoMemoria();
}
