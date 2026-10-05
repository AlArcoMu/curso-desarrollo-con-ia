# Constitución — Diario de Estudio
Principios innegociables. Toda spec, plan y tarea debe cumplirlos.
1. **Stack mínimo**: Solo HTML, CSS y JS puro. Sin dependencias, npm, bundler ni build. Abre `index.html` y funciona.
2. **La spec manda**: No se implementa nada fuera de la spec activa. Decisión faltante = parar y preguntar.
3. **Lógica pura separada**: Cálculos (fechas, rachas, stats) en funciones puras sin DOM ni localStorage, que reciben "hoy" como parámetro.
4. **Tests obligatorios**: Lógica probada con `node --test` (sin instalar nada). Prohibido avanzar con tests en rojo.
5. **Datos intocables**: localStorage con compatibilidad hacia atrás. Fechas siempre en hora local (nunca UTC). Cero pérdida de sesiones.
6. **Idioma único**: Código en inglés; interfaz, specs y documentación en español.