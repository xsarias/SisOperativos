// Funciones auxiliares
function obtenerParticiones(memoriaOArray) {
  if (Array.isArray(memoriaOArray)) return memoriaOArray;
  if (memoriaOArray && Array.isArray(memoriaOArray.particiones)) return memoriaOArray.particiones;
  return [];
}

function getSize(p) {
  return p.size ?? p.tamano ?? 0;
}

function estaLibre(p) {
  return (p.estado || "").toLowerCase() === "libre";
}

function getTamano(param) {
  if (typeof param === "number") return param;
  if (param && typeof param.tamano === "number") return param.tamano;
  if (param && typeof param.memUse === "number") return Math.ceil(param.memUse / 1024);
  return 0;
}

// =================== PRIMER AJUSTE (ajustado) ===================
export function firstFit(memoriaOArray, paramTamano) {
  const particiones = obtenerParticiones(memoriaOArray);
  const tamano = getTamano(paramTamano);

  // Detectar si es versión "estatvari" por nombres de propiedades
  const usaTamano = particiones.some(p => "tamano" in p);
  const usaMinusculas = particiones.some(p => (p.estado || "").toLowerCase() === "libre");

  if (usaTamano && usaMinusculas) {
    // ---- versión estricta para memoria variable ----
    for (let p of particiones) {
      if (estaLibre(p)) {
        if (getSize(p) >= tamano) return p;
        else return null; // si la primera libre no cabe, se detiene
      }
    }
  } else {
    // ---- versión normal (para compactación) ----
    for (let p of particiones) {
      if (estaLibre(p) && getSize(p) >= tamano) return p;
    }
  }

  return null;
}

// =================== MEJOR AJUSTE ===================
export function bestFit(memoriaOArray, paramTamano) {
  const particiones = obtenerParticiones(memoriaOArray);
  const tamano = getTamano(paramTamano);
  const libres = particiones
    .filter(p => estaLibre(p) && getSize(p) >= tamano)
    .sort((a, b) => getSize(a) - getSize(b));
  return libres[0] || null;
}

// =================== PEOR AJUSTE ===================
export function worstFit(memoriaOArray, paramTamano) {
  const particiones = obtenerParticiones(memoriaOArray);
  const tamano = getTamano(paramTamano);
  const libres = particiones
    .filter(p => estaLibre(p) && getSize(p) >= tamano)
    .sort((a, b) => getSize(b) - getSize(a));
  return libres[0] || null;
}

// =================== NEXT FIT ===================
let lastIndex = 0;
export function nextFit(memoriaOArray, paramTamano) {
  const particiones = obtenerParticiones(memoriaOArray);
  const tamano = getTamano(paramTamano);
  const n = particiones.length;
  for (let vueltas = 0; vueltas < n; vueltas++) {
    const idx = (lastIndex + vueltas) % n;
    const p = particiones[idx];
    if (estaLibre(p) && getSize(p) >= tamano) {
      lastIndex = idx;
      return p;
    }
  }
  return null;
}
