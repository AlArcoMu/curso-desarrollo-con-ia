# Plan: Mapa de Calor de Estudio

## Archivos

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `src/logica.js` | Crear | Funciones puras de lógica (sin DOM, sin localStorage) |
| `src/mapa.js` | Crear | Renderizado del mapa de calor en el DOM |
| `index.html` | Modificar | Añadir contenedor del mapa entre estadísticas e historial |
| `styles.css` | Modificar | Estilos del mapa, tooltip y etiquetas de mes |
| `app.js` | Modificar | Conectar lógica → renderizado, actualizar mapa en eventos |
| `tests/logica.test.js` | Crear | Tests de las funciones puras con `node --test` |

## Funciones puras (src/logica.js)

Todas reciben `hoy` como parámetro (Date) para facilitar tests.

### `calcularMinutosPorDia(sesiones, hoy)`
- **RF-2, RF-5**
- Entrada: array de sesiones `{fecha, tema, minutos}`, Date `hoy`
- Salida: Map `"YYYY-MM-DD" -> minutos` (suma de sesiones del mismo día)
- Ignora fechas futuras

### `calcularMaximoMinutos(minutosPorDia)`
- **RF-2**
- Entrada: Map de minutos por día
- Salida: número (mínimo 0)
- Si no hay sesiones, devuelve 0

### `calcularIntensidad(minutos, maximo)`
- **RF-2**
- Entrada: minutos del día, máximo de minutos
- Salida: número 0–5 (0 = sin sesión, 1–5 = nivel de intensidad)
- Niveles: 0 min → 0, 1–20% → 1, 21–40% → 2, 41–60% → 3, 61–80% → 4, 81–100% → 5
- Si maximo = 0, devuelve 0

### `generarSemanas(hoy)`
- **RF-1**
- Entrada: Date `hoy`
- Salida: array de 52 semanas, cada una es un array de 7 días (lunes a domingo)
- Cada día es un objeto `{ fecha: "YYYY-MM-DD", esFuturo: boolean }`
- La última semana termina en hoy

### `generarEtiquetasMes(semanas)`
- **RF-6**
- Entrada: array de semanas
- Salida: array de `{ columna: numero, texto: string }` (ej. `{ columna: 0, texto: "Ene" }`)
- Solo incluye el primer día de cada mes

## Algoritmo del mapa (pseudocódigo)

```
function renderizarMapa(sesiones, hoy):
    minutosPorDia = calcularMinutosPorDia(sesiones, hoy)
    maximo = calcularMaximoMinutos(minutosPorDia)
    semanas = generarSemanas(hoy)
    etiquetas = generarEtiquetasMes(semanas)

    # Pintar etiquetas de mes
    for etiqueta in etiquetas:
        crear div en columna etiqueta.columna con texto etiqueta.texto

    # Pintar celdas
    for semana in semanas:
        for dia in semana:
            if dia.esFuturo:
                celda invisible
            else:
                minutos = minutosPorDia.get(dia.fecha) ?? 0
                intensidad = calcularIntensidad(minutos, maximo)
                color = intensidad == 0 ? GRIS : VERDE_BOSQUE con opacidad intensidad * 20%
                crear celda con color y tooltip "fecha: minutos min"
```

## Interfaz (src/mapa.js)

- **RF-1, RF-3, RF-4, RF-5, RF-6**
- Función `renderizarMapa(contenedor, sesiones, hoy)` que:
  1. Limpia el contenedor
  2. Crea la cuadrícula CSS (grid: 52 columnas × 7 filas)
  3. Pinta etiquetas de mes arriba
  4. Pinta cada celda con su color correspondiente
  5. Añade event listeners para tooltip (mouseenter/mouseleave)
- Tooltip: div absoluto que sigue al ratón, con formato "15 de marzo: 45 min" o "15 de marzo: sin sesión"

## Decisiones técnicas

| Decisión | Alternativa descartada | Justificación |
|----------|------------------------|---------------|
| Grid CSS para el mapa | Tabla HTML | Más responsive, más semántico, más fácil de mantener |
| Map para minutos por día | Objeto plano | Mejor rendimiento de búsqueda, API más limpia |
| Funciones puras con `hoy` | Usar `new Date()` directamente | Permite tests deterministas (constitución punto 3) |
| Tooltip con div absoluto | `title` nativo | Más control de estilo y formato, accesible |
| Niveles fijos de intensidad (1–5) | Cálculo continuo de opacidad | Más simple de implementar y testear, suficiente para el usuario |
| `src/logica.js` como script global | Módulos ES | Los módulos no funcionan con `file://` (constitución punto 1) |

## Tests (tests/logica.test.js)

Estrategia: `node --test` sin dependencias. Cada función pura se testea con casos deterministas.

### calcularMinutosPorDia
- Suma múltiples sesiones del mismo día
- Ignora fechas futuras
- Devuelve Map vacío si no hay sesiones

### calcularMaximoMinutos
- Devuelve el máximo correcto
- Devuelve 0 si el Map está vacío

### calcularIntensidad
- 0 min → nivel 0
- 50% del máximo → nivel 3
- 100% del máximo → nivel 5
- Máximo = 0 → nivel 0

### generarSemanas
- Devuelve exactamente 52 semanas
- Cada semana tiene 7 días
- La última semana termina en hoy
- Los días futuros están marcados

### generarEtiquetasMes
- Devuelve etiquetas para cada mes visible
- El texto coincide con el mes correcto

## Cobertura de RF

| RF | Función pura | Renderizado | Test |
|----|--------------|-------------|------|
| RF-1 | generarSemanas | renderizarMapa | generarSemanas |
| RF-2 | calcularMinutosPorDia, calcularMaximoMinutos, calcularIntensidad | renderizarMapa | calcularMinutosPorDia, calcularMaximoMinutos, calcularIntensidad |
| RF-3 | calcularIntensidad (devuelve 0) | renderizarMapa (gris) | calcularIntensidad |
| RF-4 | — | renderizarMapa (tooltip) | — |
| RF-5 | — | renderizarMapa (se llama en actualizar) | — |
| RF-6 | generarEtiquetasMes | renderizarMapa | generarEtiquetasMes |
