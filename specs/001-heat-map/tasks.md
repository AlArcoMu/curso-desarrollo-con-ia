# Tareas: Mapa de Calor de Estudio

## 1. Crear funciones puras de lógica
- [x] Crear `src/logica.js` con `calcularMinutosPorDia`, `calcularMaximoMinutos`, `calcularIntensidad`, `generarSemanas`, `generarEtiquetasMes`
- [x] Todas reciben `hoy` como parámetro cuando corresponde, sin DOM ni localStorage
- **RF**: RF-1, RF-2, RF-3, RF-6
- **Hecho cuando**: `node --test tests/logica.test.js` pasa sin errores

## 2. Crear tests de lógica
- [x] Crear `tests/logica.test.js` con tests para cada función pura
- [x] Tests: suma sesiones mismo día, ignora futuras, máximo, intensidad, 52 semanas, 7 días/semana y etiquetas de mes
- **RF**: RF-1, RF-2, RF-3, RF-6
- **Hecho cuando**: `node --test` muestra los tests en verde (17/17 ✅)

## 3. Crear renderizado del mapa
- [ ] Crear `src/mapa.js` con función `renderizarMapa(contenedor, sesiones, hoy)`
- **RF**: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6
- **Hecho cuando**: el mapa aparece con celdas, colores y tooltip funcional

## 4. Añadir contenedor en HTML
- [ ] Añadir el contenedor del mapa entre estadísticas e historial
- **RF**: RF-1
- **Hecho cuando**: el HTML contiene el contenedor en la posición indicada

## 5. Añadir estilos del mapa
- [ ] Añadir estilos de cuadrícula, celdas, etiquetas y tooltip
- **RF**: RF-1, RF-3, RF-4
- **Hecho cuando**: el mapa se ve correctamente en móvil de 375 px

## 6. Conectar lógica con la interfaz
- [ ] Actualizar el mapa al registrar, editar o eliminar una sesión
- **RF**: RF-5
- **Hecho cuando**: el mapa se actualiza sin recargar la página

## 7. Verificación final
- [ ] Verificar en Chrome DevTools la interfaz, consola y vista móvil
- **RF**: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6
- **Hecho cuando**: la consola está limpia y la captura móvil está guardada
