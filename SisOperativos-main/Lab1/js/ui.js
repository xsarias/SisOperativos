function renderizar() {
  // 1. Tabla
  const tabla = document.querySelector("#tabla-memoria tbody");
  tabla.innerHTML = "";

  memoria.particiones.forEach((p, i) => {
    const fila = document.createElement("tr");

    // Dirección base en bytes (suponiendo KB → *1024)
    const baseDec = i * memoria.tamanoParticion * 1024;
    const baseHex = baseDec.toString(16).toUpperCase().padStart(6, "0");

    fila.innerHTML = `
      <td>0x${baseHex}</td>
      <td>${baseDec}</td>
      <td>${p ? "P" + p.id : "-"}</td>
      <td>${p ? p.tamano + " KB" : memoria.tamanoParticion + " KB"}</td>
      <td class="${p ? "ocupado" : "libre"}">${p ? "Ocupado" : "Libre"}</td>
    `;

    tabla.appendChild(fila);
  });

  // 2. Bloques visuales
  const divMemoria = document.getElementById("memoria");
  divMemoria.innerHTML = "";
  memoria.particiones.forEach((p, i) => {
    const div = document.createElement("div");
    div.classList.add("bloque", p ? "ocupado" : "libre");
    div.textContent = p ? "P" + p.id : "Libre";
    divMemoria.appendChild(div);
  });
}
