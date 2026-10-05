# Tasks: Objetivo Semanal de Estudio

Lista ordenada de tareas atómicas. Cada tarea toca archivos específicos y tiene criterio "done" verificable.

---

- [ ] **T1: Consolidar utilidades de fecha en `logica.js`**
  - **Archivos**: `src/logica.js`, `src/app.js`
  - **Qué hacer**: 
    1. En `logica.js`: añadir `hoyComoTexto()` (línea ~187) y exportarla en `module.exports`
    2. En `app.js`: borrar líneas 31-54 (`dateATexto`, `textoAFecha`, `sumarDias`, `hoyComoTexto`)
  - **Done**: `node --test` pasa (tests existentes no rotos); `app.js` usa funciones globales de `logica.js` sin errores en consola

- [ ] **T2: Añadir `lunesDeSemana(fecha)` en `logica.js`**
  - **Archivos**: `src/logica.js`
  - **Qué hacer**: Implementar función pura que reciba `Date` y devuelva `"YYYY-MM-DD"` del lunes de esa semana. Usar `sumarDias` y `dateATexto` internas. Exportar en `module.exports`.
  - **Done**: `node --test` pasa tests nuevos de `lunesDeSemana` (ver T8)

- [ ] **T3: Añadir `mismaSemana(fechaA, fechaB)` en `logica.js`**
  - **Archivos**: `src/logica.js`
  - **Qué hacer**: Implementar función pura que compare si dos `"YYYY-MM-DD"` están en misma semana (lunes-domingo). Reutilizar `lunesDeSemana` + `textoAFecha`. Exportar.
  - **Done**: `node --test` pasa tests nuevos de `mismaSemana` (ver T8)

- [ ] **T4: Añadir `calcularProgresoObjetivo(sesiones, objetivoMinutos, hoy)` en `logica.js`**
  - **Archivos**: `src/logica.js`
  - **Qué hacer**: Implementar función pura que devuelva `{acumulado, porcentaje, color, textoPrincipal, textoSecundario}`. Usar `lunesDeSemana(hoy)` para calcular lunes de esta semana. Filtrar sesiones `fecha >= lunesTexto && fecha <= hoyTexto`. Porcentaje con `Math.min(100, Math.round(...))`. Color según umbrales. Exportar.
  - **Done**: `node --test` pasa tests nuevos de `calcularProgresoObjetivo` (ver T8)

- [ ] **T5: Añadir HTML de tarjeta objetivo semanal en `index.html`**
  - **Archivos**: `src/index.html`
  - **Qué hacer**: Insertar `<section class="tarjeta objetivo-semanal" id="tarjetaObjetivo">...</section>` **después** de `</section><!-- .tarjeta.stats -->` (línea 51) y **antes** de `<!-- Mapa de calor -->` (línea 53). Incluir formulario, input, error inline (`role="alert"`), ayuda, barra progressbar con `role="progressbar"` y atributos aria, textos, botón cambiar.
  - **Done**: Al abrir `index.html` en navegador, se ve la tarjeta en la posición correcta (debajo de stats, encima de mapa)

- [ ] **T6: Añadir estilos de tarjeta objetivo en `styles.css`**
  - **Archivos**: `src/styles.css`
  - **Qué hacer**: Añadir estilos para `.objetivo-semanal`, `.objetivo-form`, `.error-inline`, `.ayuda`, `.barra-progreso`, `.barra-progreso-fill` (con `transition: width 0.3s ease, background-color 0.3s ease`), `@media (prefers-reduced-motion: reduce)`, textos progreso, `.semana-pasada`, `.btn-cambiar`. Colores de barra se aplican vía `style="background: #..."` desde JS.
  - **Done**: En navegador, tarjeta se ve limpia; barra tiene transición; con `prefers-reduced-motion: reduce` no hay transición; responsive móvil OK (barra no desborda)

- [ ] **T7: Implementar lógica DOM en `app.js`**
  - **Archivos**: `src/app.js`
  - **Qué hacer**:
    1. Constantes DOM: `formularioObjetivo`, `inputObjetivo`, `btnObjetivo`, `objetivoError`, `objetivoProgreso`, `barraFill`, `textoProgresoPrincipal`, `textoProgresoSecundario`, `btnCambiarObjetivo`, `textoSemanaPasada`
    2. `cargarObjetivo()` / `guardarObjetivo(minutos)` usando `localStorage` clave `diarioEstudio.objetivoSemanal`
    3. `validarObjetivo(valor)` → `Number.isInteger(valor) && valor >= 1 && valor <= 10080`
    4. `renderizarObjetivo(sesiones)`: orquesta estados (sin objetivo / esta semana / semana pasada / futuro)
    5. `mostrarEstadoSinObjetivo()`, `mostrarEstadoEstaSemana(objetivo, progreso)`, `mostrarEstadoSemanaPasada(objetivo)`
    6. `calcularYRenderizarProgreso(sesiones, objetivo)` llama a `logica.calcularProgresoObjetivo` y pinta barra + textos + color
    7. Event listeners: submit formulario (validar + guardar + renderizar), click `btnCambiarObjetivo` (vuelve a estado sin objetivo con valor precargado)
    8. Llamar `renderizarObjetivo(cargarSesiones())` al final de `actualizar()`
  - **Done**: En navegador: CA-1, CA-2, CA-3, CA-4, CA-5, CA-6, CA-7, CA-8, CA-11 funcionan; consola sin errores

- [ ] **T8: Añadir tests en `tests/logica.test.js`**
  - **Archivos**: `tests/logica.test.js`
  - **Qué hacer**: Importar las 3 funciones nuevas en `require("../src/logica.js")`. Añadir suites de tests:
    - `lunesDeSemana`: 4 casos (jueves, domingo, lunes, año nuevo)
    - `mismaSemana`: 3 casos (misma semana, semana distinta, año distinto)
    - `calcularProgresoObjetivo`: 6 casos (0 sesiones, 20%, 100%, cap 100%, objetivo bajado, semana distinta)
  - **Done**: `node --test` ejecuta y **todos los tests pasan** (existentes + nuevos)

- [ ] **T9: Verificación manual completa (CA-1 a CA-15)**
  - **Archivos**: `src/index.html` (abrir en navegador)
  - **Qué hacer**: Seguir tabla de verificación del plan.md, probar cada CA en orden. Usar DevTools para:
    - Limpiar localStorage (Application → Local Storage → borrar clave)
    - Mockear fecha (Console: `Date = class extends Date { constructor(...args) { if(args.length===0) super(2026,9,5); else super(...args) } }` para simular lunes)
    - Emular `prefers-reduced-motion` (Rendering tab)
    - Device toolbar para móvil
  - **Done**: Todos los 15 CA confirmados; sin regresiones en funcionalidad existente (racha, stats, historial, mapa, distribución)

---

## Orden de ejecución recomendado

```
T1 → T2 → T3 → T4 → T8 (tests unidad) → T5 → T6 → T7 → T9 (manual)
```

**Nota**: T8 puede hacerse en paralelo con T5-T7, pero debe pasar antes de T9.