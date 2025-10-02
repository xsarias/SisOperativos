function renderizar() {
  // 1. Tabla
  const tabla = document.querySelector("#tabla-memoria tbody");
  tabla.innerHTML = "";

  memoria.particiones.forEach((p, i) => {
    const fila = document.createElement("tr");
    const direccionBase = i * memoria.tamanoParticion;
    const direccionHex = direccionBase.toString(16).toUpperCase().padStart(6, "0");

    fila.innerHTML = `
      <td>0x${direccionHex}</td>
      <td>${direccionBase}</td>
      <td>${p ? p.id : "Libre"}</td>
      <td>${p ? p.tamano : "-"}</td>
      <td>${p ? p.estado : "Libre"}</td>
    `;
    tabla.appendChild(fila);
  });

  // 2. Bloques visuales
  const divMemoria = document.getElementById("memoria");
  divMemoria.innerHTML = "";
  memoria.particiones.forEach((p, i) => {
    const div = document.createElement("div");
    div.classList.add("bloque", p ? "ocupado" : "libre");
    div.textContent = p ? p.id : "Libre";
    divMemoria.appendChild(div);
  });
}
