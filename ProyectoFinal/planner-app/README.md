# Planificación a Corto Plazo (FCFS, SJF, SRTF, RR)

Aplicación web en JavaScript que simula algoritmos de planificación de CPU a corto plazo y calcula métricas por proceso.

## Estructura

- `index.html`: Interfaz principal.
- `styles.css`: Estilos, UI inspirada en mockups académicos.
- `js/models.js`: Modelos y utilidades de métricas. Incluye campos opcionales de bloqueo (`blockStart`, `blockDuration`).
- `js/algorithms.js`: Implementaciones de FCFS, SJF, SRTF, RR (con Quantum).
- `js/ui.js`: Renderizado de tablas, Gantt y métricas.
- `js/main.js`: Lógica de eventos y estado.

## Métricas

- Retorno (T): `finish - arrival`.
- Tiempo perdido / Espera (W): `T - burst`.
- Tiempo de espera en cola (E): equivalente a W en estos modelos sin E/S.
- Penalidad (P): `T / burst`.
- Respuesta (R): `start - arrival`.

## Uso

1. Abrir `index.html` en el navegador.
2. Agregar procesos (ID, llegada li, ejecución t, bloqueo inicio, bloqueo duración).
3. Seleccionar algoritmo y, si corresponde, ajustar `Quantum`.
4. Clic en `Ejecutar` para ver la línea de tiempo, Gantt y métricas.
5. `Cargar Demo` añade procesos de ejemplo.

## Nota

- La interfaz está pensada para replicar el estilo de los esquemas del PDF: paneles, tablas, métricas y diagrama tipo Gantt. Se incluye un badge "Q = n" cuando está seleccionado RR.
- Las métricas se reportan como promedios sobre todos los procesos cargados.
