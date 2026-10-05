# Spec: Objetivo Semanal de Estudio

## 1. Qué se ve en la UI

### Tarjeta de objetivo semanal (nueva, debajo de la tarjeta stats existente)
- **Título**: "Objetivo semanal"
- **Input numérico** para fijar minutos objetivo (ej. 300)
  - Atributos: `type="number" min="1" max="10080" step="1" required`
  - `max="10080"` = 7 días × 24 h × 60 min (límite razonable)
  - `aria-describedby="objetivo-error objetivo-ayuda"`
- **Botón principal**: "Guardar objetivo" (si no hay objetivo esta semana) / "Cambiar objetivo" (si ya hay objetivo esta semana)
- **Mensaje de error inline** (debajo del input, `id="objetivo-error"`, `role="alert"`, `aria-live="polite"`): "Introduce un número entre 1 y 10080"
- **Texto de ayuda** (`id="objetivo-ayuda"`): "Semana = lunes a domingo"
- **Barra de progreso** (solo si hay objetivo esta semana):
  - `<div role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso objetivo semanal">`
  - `<div class="barra-progreso-fill" style="width: 0%"></div>`
  - Transición CSS: `transition: width 0.3s ease;` respetando `@media (prefers-reduced-motion: reduce) { transition: none; }`
- **Texto principal**: "Llevas X min de Y min de objetivo (Z%)"
- **Texto secundario** (cuando < 100%): "Te faltan X min para el objetivo"
- **Texto al 100%**: "¡Objetivo cumplido! 🎉" (sin "Te faltan")
- **Estado visual de la barra** (color del fill):
  - **Verde #2D5F3F** si % ≥ 100
  - **Naranja #B4860C** si % ≥ 75
  - **Rojo #A82B1A** si % < 75
  - Colores verificados para contraste ≥ 4.5:1 sobre fondo #FAF7F2 y superficie #FFFFFF (WCAG AA)

### Ubicación
Debajo de la tarjeta stats (clase `.tarjeta.stats`), antes del historial (`#lista`) y el mapa de calor (`#mapaCalor`).

---

## 2. Datos que se guardan

### localStorage: clave `diarioEstudio.objetivoSemanal`
```json
{
  "minutos": 300,
  "semanaInicio": "2026-09-28"  // lunes de la semana en que se fijó (formato YYYY-MM-DD)
}
```

**Reglas:**
- Se guarda al hacer clic en "Guardar objetivo" / "Cambiar objetivo" (tras validación JS)
- `semanaInicio` = lunes de la semana actual (hora local) cuando se guarda
- Si el usuario cambia el objetivo en la misma semana, se actualiza `minutos` (mantiene `semanaInicio`)
- Al cambiar de semana (nuevo lunes), el objetivo **no se reinicia automáticamente**; el usuario debe volver a fijarlo (decisión: B)

---

## 3. Reglas de cálculo

### Función pura en `logica.js` (nueva, exportada para tests)
```javascript
/**
 * Calcula el lunes de la semana de una fecha dada (hora local).
 * @param {Date} fecha
 * @returns {string} "YYYY-MM-DD" del lunes
 */
function lunesDeSemana(fecha) { ... }

/**
 * Compara si dos fechas "YYYY-MM-DD" pertenecen a la misma semana (lunes-domingo).
 * @param {string} fechaA
 * @param {string} fechaB
 * @returns {boolean}
 */
function mismaSemana(fechaA, fechaB) { ... }
```

> **Nota de arquitectura**: Las utilidades de fecha `dateATexto`, `textoAFecha`, `sumarDias`, `hoyComoTexto` existen duplicadas en `app.js` (líneas 31-54) y `logica.js` (líneas 169-185). **Esta feature consolida todo en `logica.js`** (exportadas via `module.exports`) y `app.js` las consume desde ahí (script global). Así `lunesDeSemana`/`mismaSemana` reutilizan la base única.

### Semana actual
- Semana = **lunes a domingo** (hora local)
- Lunes de esta semana = `hoy - (diaSemana === 0 ? 6 : diaSemana - 1)` días
- **Reutiliza** `lunesDeSemana()` y `mismaSemana()` de `logica.js` (no duplica lógica de `app.js`)

### Progreso
- Minutos acumulados = suma de `sesiones.minutos` donde `fecha >= lunesTexto && fecha <= hoyTexto`
- Porcentaje = `Math.min(100, Math.round((acumulado / objetivo) * 100))`

### Visualización
- Si no hay objetivo guardado: muestra input + botón "Guardar objetivo" + ayuda, sin barra
- Si hay objetivo guardado para **esta semana** (`mismaSemana(objetivo.semanaInicio, hoyTexto) === true`):
  - Muestra barra + progreso + textos + botón "Cambiar objetivo"
  - Al clic "Cambiar objetivo": vuelve a mostrar input + botón "Guardar objetivo" (con valor actual precargado)
- Si hay objetivo guardado para **semana anterior** (`mismaSemana(...) === false` Y `objetivo.semanaInicio < hoyTexto`):
  - Muestra "Objetivo de la semana pasada: X min" + input para nuevo objetivo + botón "Guardar objetivo"
  - **Al guardar nuevo objetivo**: desaparece el texto "semana pasada"
- Si `objetivo.semanaInicio > hoyTexto` (futuro, caso borde): trata como "sin objetivo" (muestra input vacío)

### Hueco para histórico futuro (no implementar ahora)
- Estructura pensada: array en `diarioEstudio.historialObjetivos` con `{semanaInicio, objetivo, cumplido, minutosReales}`
- MVP: solo objetivo actual en `diarioEstudio.objetivoSemanal`

---

## 4. Casos edge

| Caso | Comportamiento |
|------|----------------|
| Usuario pone 0, vacío, negativo, decimal, >10080 | **Validación JS** (submit): `e.preventDefault()`, muestra error inline, no guarda |
| Usuario cambia objetivo misma semana | Actualiza `minutos`, recalcula barra y textos al instante |
| Usuario baja objetivo por debajo del progreso actual (ej. 200 min hechos, objetivo 300→150) | % = `Math.min(100, ...)` → 100%, barra verde, texto "¡Objetivo cumplido! 🎉", sin "Te faltan" |
| Llega nuevo lunes | Detecta `mismaSemana(objetivo.semanaInicio, hoyTexto) === false` → muestra "Objetivo de la semana pasada: X min" + input para nuevo objetivo |
| Borra todas las sesiones de la semana | Barra vuelve a 0%, objetivo se mantiene, textos se actualizan |
| Cambia de navegador/dispositivo | localStorage es local, no hay sync (fuera de scope) |

---

## 5. Criterios de aceptación

1. **CA-1**: Al abrir la página sin objetivo previo, se ve input + botón "Guardar objetivo" + ayuda, sin barra
2. **CA-2**: Al guardar 300 min, se ve barra al 0%, texto "Llevas 0 min de 300 min de objetivo (0%)" y "Te faltan 300 min para el objetivo"
3. **CA-3**: Al añadir sesión de 60 min hoy, barra sube a 20%, texto "Llevas 60 min de 300 min de objetivo (20%)" y "Te faltan 240 min para el objetivo"
4. **CA-4**: Al alcanzar 300 min, barra al 100%, color verde #2D5F3F, texto "¡Objetivo cumplido! 🎉" (sin "Te faltan")
5. **CA-5**: Al cambiar objetivo a 400 min (misma semana), barra recalcula (ej. 60/400 = 15%), textos actualizados
6. **CA-6**: Al bajar objetivo a 150 min con 200 min hechos, barra al 100% verde, "¡Objetivo cumplido! 🎉"
7. **CA-7**: En nuevo lunes, muestra "Objetivo de la semana pasada: 300 min" + input para nuevo objetivo; al guardar, texto "semana pasada" desaparece
8. **CA-8**: Input rechaza 0, vacío, negativos, decimales, >10080 (validación JS + HTML), error inline con `role="alert"`
9. **CA-9**: Barra tiene `role="progressbar"` con `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`
10. **CA-10**: Transición de barra respeta `prefers-reduced-motion: reduce`
11. **CA-11**: Persistencia: recargar página mantiene objetivo y progreso
12. **CA-12**: No rompe nada existente (racha, stats, historial, mapa, distribución temas)
13. **CA-13**: Responsive: en móvil la tarjeta se ve bien, barra no se desborda
14. **CA-14**: Colores barra: verde #2D5F3F (>=100%), naranja #B4860C (>=75%), rojo #A82B1A (<75%)
15. **CA-15**: Cálculo de semana usa funciones puras de `logica.js` (testables con `node --test`)

---

## Decisiones del usuario

1. **Lunes nuevo**: Usuario debe volver a fijarlo (B)
2. **Ubicación**: Debajo de stats, antes del historial (A)
3. **Colores**: Paleta extendida: éxito #2D5F3F, aviso naranja #B4860C, error rojo #A82B1A (verificados WCAG AA ≥4.5:1)
4. **Minutos que faltan**: Sí, mostrar "Te faltan X min para el objetivo"
5. **Histórico objetivos**: Dejar hueco en spec para futuro (sí)

---

## Fuera de alcance (MVP)

- Histórico de objetivos cumplidos (`diarioEstudio.historialObjetivos`)
- Notificaciones push / recordatorios
- Objetivo automático repetitivo
- Sincronización entre dispositivos

---

## Entregables de esta spec (para planificación)

- `plan.md` y `tasks.md` en `specs/003-objetivo-semanal/`
- Tests en `tests/logica.test.js` para: `lunesDeSemana`, `mismaSemana`, cálculo de progreso semanal
- Consolidación utilidades fecha en `logica.js` (mover desde `app.js`, exportar, consumir en `app.js`)