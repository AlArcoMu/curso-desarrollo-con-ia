# MEMORY.md

## Estado actual

- Web funcional con formulario, racha actual, mejor racha, total minutos, resumen semanal,
  días estudiados este mes, historial con editar/eliminar.
- **NUEVO**: Gráfico de queso (pie chart) CSS puro con distribución de temas del mes actual (top 5 + Otros).
- Mapa de calor de 52 semanas con intensidad proporcional al máximo de minutos, tooltip y etiquetas de mes.
- Datos en localStorage (clave `diarioEstudio.sesiones`).
- Tests de lógica pura con `node --test` (**25 tests, todos en verde**).
- Rediseño visual: paleta papel/tinta/verde bosque, tipografía Georgia para títulos.

## Decisiones

- Mejor racha en bloque naranja: `Mejor racha: X días 🏆`.
- Stats (total + semana + días mes) en tarjeta separada debajo del formulario.
- Editar reutiliza el formulario superior; botón cambia a "Guardar cambios".
- Eliminar pide confirmación con `confirm()`.
- Fechas futuras ignoradas en cálculos de racha y días del mes.
- Días estudiados este mes: tercer stat en la tarjeta de stats, cuenta días únicos del mes actual.
- **Distribución de temas**: mes natural actual (día 1 → hoy), top 5 + "Otros", colores por hash del tema, tooltip accesible, leyenda responsive.
- Sin tests ni lint; verificación abriendo `index.html`.
- Paleta: fondo #FAF7F2, tinta #1E3A5F, acento #2D5F3F, superficie #FFFFFF.
- Tipografía: Georgia (serif) para títulos, system-ui para cuerpo.
- Mapa de calor: 52 semanas, intensidad proporcional al máximo, 5 niveles (20/40/60/80/100%), gris para días sin sesión.
- Lógica pura en `src/logica.js` (funciones sin DOM, con "hoy" como parámetro).
- Renderizado en `src/mapa.js` (`renderizarMapa` + `renderizarDistribucionTemas`).
- Tests en `tests/logica.test.js` con `node --test`.
- T1 del mapa de calor marcada como completada en `specs/001-heat-map/tasks.md`; T2 no iniciada.
- **Spec 002 (distribución temas)**: spec.md, plan.md, tasks.md completadas; T1–T7 implementadas.

## Errores a evitar

- No usar `toISOString()` ni `new Date("AAAA-MM-DD")` para fechas (usan UTC).
- No añadir frameworks ni dependencias.
- AGENTS.md tenía la clave de localStorage antigua (`diario-estudio-sesiones`); corregida a `diarioEstudio.sesiones`.
- Los tests de `generarSemanas` deben esperar que la última semana termine en domingo, no en hoy.