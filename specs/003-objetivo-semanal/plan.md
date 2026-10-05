# Plan: Objetivo Semanal de Estudio

## 1. Arquitectura

### Archivos que se tocan y cómo encajan

| Archivo | Rol | Cambios principales |
|---------|-----|---------------------|
| `src/logica.js` | Lógica pura (sin DOM, sin localStorage), exportada via `module.exports` para tests | **+ Consolidar utilidades de fecha** (`dateATexto`, `textoAFecha`, `sumarDias`, `hoyComoTexto`) movidas desde `app.js` y exportadas<br>**+ 3 funciones nuevas puras**: `lunesDeSemana`, `mismaSemana`, `calcularProgresoObjetivo` |
| `src/app.js` | Lógica DOM, eventos, localStorage | **- Eliminar utilidades de fecha duplicadas** (líneas 31-54), consumir desde `logica.js` (script global)<br>**+ Cargar/guardar objetivo** en `diarioEstudio.objetivoSemanal`<br>**+ Renderizar tarjeta objetivo** según estados (sin objetivo, esta semana, semana pasada)<br>**+ Validación JS** del input + eventos botón guardar/cambiar |
| `src/index.html` | Estructura | **+ Tarjeta objetivo semanal** debajo de `.tarjeta.stats` (antes de `#mapaCalor`) |
| `src/styles.css` | Estilos | **+ Estilos tarjeta objetivo**: input, botón, error inline, barra progressbar con colores #2D5F3F / #B4860C / #A82B1A, transiciones, `prefers-reduced-motion` |
| `tests/logica.test.js` | Tests unitarios (`node --test`) | **+ Tests** para `lunesDeSemana`, `mismaSemana`, `calcularProgresoObjetivo` + casos edge |

### Flujo de datos

```
localStorage (diarioEstudio.objetivoSemanal) 
  → app.js: cargarObjetivo() 
  → logica.js: calcularProgresoObjetivo(sesiones, objetivo, hoy)
  → app.js: renderizarTarjetaObjetivo(progreso)
  → UI: barra + textos + botón según estado
```

---

## 2. Consolidación utilidades fecha (`app.js` → `logica.js`)

**Qué se mueve** (líneas 31-54 de `app.js`):
- `dateATexto(fecha)` → ya existe en `logica.js` (línea 169), **igual**, se elimina de `app.js`
- `textoAFecha(texto)` → ya existe en `logica.js` (línea 176), **igual**, se elimina de `app.js`
- `sumarDias(fecha, cantidad)` → ya existe en `logica.js` (línea 181), **igual**, se elimina de `app.js`
- `hoyComoTexto()` → **solo en `app.js`**, se mueve a `logica.js` y se exporta

**En `logica.js`**: añadir `hoyComoTexto` a `module.exports`

**En `app.js`**: borrar líneas 31-54; las funciones quedan disponibles como globales porque `logica.js` se carga antes (ver `index.html`: línea 73 antes que 75)

---

## 3. Nuevas funciones puras en `logica.js`

### `lunesDeSemana(fecha: Date): string`
- Recibe `Date` (hora local), devuelve `"YYYY-MM-DD"` del lunes de esa semana
- Lunes = `fecha - (diaSemana === 0 ? 6 : diaSemana - 1)` días
- Usa `sumarDias` y `dateATexto` internas

### `mismaSemana(fechaA: string, fechaB: string): boolean`
- Compara si dos `"YYYY-MM-DD"` caen en mismo lunes-domingo
- Implementación: `lunesDeSemana(textoAFecha(fechaA)) === lunesDeSemana(textoAFecha(fechaB))`

### `calcularProgresoObjetivo(sesiones, objetivoMinutos, hoy): {acumulado, porcentaje, color, textoPrincipal, textoSecundario}`
- `acumulado` = suma `sesiones.minutos` donde `fecha >= lunesTexto && fecha <= hoyTexto`
- `porcentaje` = `Math.min(100, Math.round((acumulado / objetivoMinutos) * 100))`
- `color` según %: ≥100 verde `#2D5F3F`, ≥75 naranja `#B4860C`, <75 rojo `#A82B1A`
- Textos listos para render (evita lógica en `app.js`)

**Exportar las 3 en `module.exports`**

---

## 4. UI en `index.html` (tarjeta objetivo semanal)

Ubicación: **después de `</section><!-- .tarjeta.stats -->` y antes de `<!-- Mapa de calor -->`**

Estructura:
```html
<section class="tarjeta objetivo-semanal" id="tarjetaObjetivo">
  <h2>Objetivo semanal</h2>
  <form id="formularioObjetivo" class="objetivo-form" novalidate>
    <label for="inputObjetivo">Minutos objetivo</label>
    <input type="number" id="inputObjetivo" min="1" max="10080" step="1" required
           aria-describedby="objetivo-error objetivo-ayuda" autocomplete="off" inputmode="numeric">
    <p id="objetivo-error" class="error-inline" role="alert" aria-live="polite" hidden>
      Introduce un número entre 1 y 10080
    </p>
    <p id="objetivo-ayuda" class="ayuda">Semana = lunes a domingo</p>
    <button type="submit" id="btnObjetivo">Guardar objetivo</button>
  </form>
  <div id="objetivoProgreso" class="objetivo-progreso" hidden>
    <div role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" 
         aria-label="Progreso objetivo semanal" class="barra-progreso">
      <div class="barra-progreso-fill" style="width: 0%"></div>
    </div>
    <p id="textoProgresoPrincipal" class="progreso-texto-principal"></p>
    <p id="textoProgresoSecundario" class="progreso-texto-secundario"></p>
    <button type="button" id="btnCambiarObjetivo" class="btn-cambiar" hidden>Cambiar objetivo</button>
  </div>
  <p id="textoSemanaPasada" class="semana-pasada" hidden></p>
</section>
```

---

## 5. Estilos en `styles.css`

### Nueva sección al final (antes de `@media (max-width: 600px)` o integrada)

```css
/* ===== Objetivo semanal ===== */
.objetivo-semanal { ... }
.objetivo-form { display: flex; flex-direction: column; gap: 0.5rem; }
.error-inline { color: #A82B1A; font-size: 0.8rem; margin: 0; }
.ayuda { color: #6B7280; font-size: 0.8rem; margin: 0; }

.barra-progreso {
  height: 12px;
  background: #E5E0D8;
  border-radius: 6px;
  overflow: hidden;
}
.barra-progreso-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease, background-color 0.3s ease;
}
@media (prefers-reduced-motion: reduce) {
  .barra-progreso-fill { transition: none; }
}
/* Colores via JS en style="background: ..." */

.progreso-texto-principal { font-weight: 600; margin-top: 0.5rem; }
.progreso-texto-secundario { color: #6B7280; font-size: 0.9rem; margin-top: 0.25rem; }
.semana-pasada { color: #6B7280; font-size: 0.9rem; margin-top: 0.5rem; }
.btn-cambiar { margin-top: 0.75rem; background: #E5E0D8; color: #1E3A5F; }
.btn-cambiar:hover { background: #D1CCC2; }
```

Responsive: en móvil la tarjeta no se desborda, barra `width: 100%` del contenedor.

---

## 6. Lógica DOM en `app.js`

### Nueva clave localStorage
`diarioEstudio.objetivoSemanal` → `{ minutos: number, semanaInicio: "YYYY-MM-DD" }`

### Funciones nuevas en `app.js`

| Función | Qué hace |
|---------|----------|
| `cargarObjetivo()` | Lee `localStorage`, parsea JSON, devuelve `{minutos, semanaInicio}` o `null` |
| `guardarObjetivo(minutos)` | Guarda `{minutos, semanaInicio: lunesDeSemana(new Date())}` |
| `renderizarObjetivo(sesiones)` | Orquesta todo: carga objetivo, decide estado, pinta UI |
| `calcularYRenderizarProgreso(sesiones, objetivo)` | Usa `logica.calcularProgresoObjetivo`, actualiza barra + textos + colores |
| `mostrarEstadoSinObjetivo()` | Muestra formulario, oculta barra, botón "Guardar objetivo" |
| `mostrarEstadoEstaSemana(objetivo, progreso)` | Muestra barra + textos + botón "Cambiar objetivo" |
| `mostrarEstadoSemanaPasada(objetivo)` | Muestra texto "Objetivo de la semana pasada: X min" + formulario |
| `validarObjetivo(valor)` | `Number.isInteger(valor) && valor >= 1 && valor <= 10080` |

### Eventos
- `formularioObjetivo.addEventListener("submit", ...)` → validar, `guardarObjetivo`, `renderizarObjetivo`
- `btnCambiarObjetivo.addEventListener("click", ...)` → vuelve a estado "sin objetivo" (input con valor actual)

### Integración en `actualizar()`
Llamar `renderizarObjetivo(cargarSesiones())` al final de `actualizar()`

---

## 7. Tests en `tests/logica.test.js`

### Tests para `lunesDeSemana`
- Jueves 1 oct 2026 → lunes 28 sep 2026
- Domingo 4 oct 2026 → lunes 28 sep 2026
- Lunes 28 sep 2026 → mismo lunes
- Lunes 5 ene 2026 (año nuevo) → lunes 5 ene

### Tests para `mismaSemana`
- `"2026-10-01"` (jueves) y `"2026-10-03"` (sábado) → `true`
- `"2026-10-01"` y `"2026-10-05"` (lunes siguiente) → `false`
- `"2026-12-31"` (jueves) y `"2027-01-02"` (sábado) → `false` (año distinto)

### Tests para `calcularProgresoObjetivo`
- Sin sesiones → 0%, rojo, "Te faltan X min"
- Sesiones 60 min, objetivo 300 → 20%, rojo, "Te faltan 240 min"
- Sesiones 300 min, objetivo 300 → 100%, verde, "¡Objetivo cumplido! 🎉"
- Sesiones 400 min, objetivo 300 → 100% (cap), verde
- Objetivo 0 → no pasa validación (no testear, validación en app.js)
- Cambio objetivo misma semana: 200 min hechos, objetivo 300→150 → 100%, verde

---

## 8. Verificación manual (CA-1 a CA-15)

| CA | Qué verificar | Cómo |
|----|---------------|------|
| CA-1 | Sin objetivo previo → input + botón "Guardar objetivo" + ayuda, sin barra | Abrir `index.html` con localStorage limpio |
| CA-2 | Guardar 300 → barra 0%, "Llevas 0 min de 300 min (0%)", "Te faltan 300 min" | Input 300, click Guardar |
| CA-3 | Añadir sesión 60 min hoy → barra 20%, textos actualizados | Formulario sesión + actualizar |
| CA-4 | Alcanzar 300 min → barra 100% verde, "¡Objetivo cumplido! 🎉" | Añadir sesiones hasta 300 |
| CA-5 | Cambiar a 400 (misma semana) → recalcula (ej. 60/400=15%) | Botón "Cambiar objetivo", input 400, Guardar |
| CA-6 | Bajar a 150 con 200 hechos → 100% verde, "¡Objetivo cumplido! 🎉" | Input 150, Guardar |
| CA-7 | Nuevo lunes → "Objetivo de la semana pasada: 300 min" + input nuevo; al guardar desaparece | Cambiar reloj sistema o mock `new Date()` en DevTools |
| CA-8 | Input rechaza 0, vacío, negativos, decimales, >10080 → error inline `role="alert"` | Probar cada caso |
| CA-9 | Barra tiene `role="progressbar"` + `aria-valuenow/min/max/label` | Inspeccionar DOM |
| CA-10 | Transición respeta `prefers-reduced-motion: reduce` | DevTools → Rendering → Emulate reduced motion |
| CA-11 | Recargar página mantiene objetivo y progreso | F5 |
| CA-12 | No rompe racha, stats, historial, mapa, distribución | Probar todo lo anterior |
| CA-13 | Móvil: tarjeta bien, barra no desborda | DevTools device toolbar |
| CA-14 | Colores barra: verde ≥100%, naranja ≥75%, rojo <75% | Verificar en cada umbral |
| CA-15 | Cálculo semana usa `logica.js` (testable con `node --test`) | `node --test` pasa |