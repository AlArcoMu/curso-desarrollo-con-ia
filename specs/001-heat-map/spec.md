# Spec: Mapa de Calor de Estudio

## Contexto y objetivo

El Diario de Estudio registra sesiones con fecha, tema y minutos. Actualmente el usuario ve la racha y estadísticas agregadas, pero no tiene una visión visual de su constancia a lo largo del tiempo. El mapa de calor tipo GitHub permite ver de un vistazo qué días estudió y cuánto, fomentando la motivación mediante el refuerzo visual de la constancia.

## Usuarios

- **Estudiante autodidacta** que registra sesiones de estudio y quiere ver su progreso visualmente.
- **Mantenimiento futuro**: alguien que empieza a programar y debe entender y modificar el código.

## Historias de usuario

1. Como estudiante, quiero ver un mapa de calor de los últimas 52 semanas para identificar patrones de estudio.
2. Como estudiante, quiero que los días con más minutos se vean más intensos para saber rápidamente cuándo estudié más.
3. Como estudiante, quiero pasar el ratón sobre un día para ver la fecha exacta y los minutos registrados.
4. Como estudiante, quiero distinguir los días sin sesión de los días con pocos minutos.

## Requisitos funcionales

**RF-1**: El sistema mostrará un mapa de calor con las últimas 52 semanas (364 días) organizadas en columnas por semana y filas por día de la semana (lunes a domingo).
- **EARS**: Cuando el usuario abra la página, el mapa de calor aparecerá debajo de las estadísticas y encima del historial.

**RF-2**: El sistema calculará la intensidad del color de cada día proporcionalmente al máximo de minutos registrados en todo el año visible.
- **EARS**: Dado que el día con más minutos del año tiene 120 min, cuando el usuario vea el mapa, ese día tendrá el color más intenso y los demás escalarán proporcionalmente (ej. 60 min = 50% de intensidad).

**RF-3**: El sistema mostrará los días sin sesión en gris neutro.
- **EARS**: Cuando un día no tenga ninguna sesión registrada, su celda será de color gris neutro.

**RF-4**: El sistema mostrará un tooltip al pasar el ratón sobre cada día con la fecha exacta y los minutos registrados.
- **EARS**: Cuando el usuario pase el ratón sobre una celda, aparecerá un tooltip con el formato "15 de marzo: 45 min". Si el día no tiene sesión, mostrará "15 de marzo: sin sesión".

**RF-5**: El sistema actualizará el mapa de calor automáticamente al registrar, editar o eliminar una sesión.
- **EARS**: Cuando el usuario guarde una sesión nueva, el mapa de calor se actualizará sin recargar la página.

**RF-6**: El sistema mostrará etiquetas de mes en el mapa para facilitar la orientación temporal.
- **EARS**: Cuando el usuario vea el mapa, aparecerán etiquetas con el nombre del mes (ej. "Ene", "Feb", "Mar") en las columnas correspondientes.

## Requisitos no funcionales

- El mapa de calor debe ser responsive y verse bien en móvil (375px de ancho).
- El cálculo de intensidades debe ser una función pura que reciba las sesiones y la fecha de hoy, sin acceder al DOM ni a localStorage.
- Los colores deben usar la paleta actual del proyecto (verde bosque #2D5F3F) con diferentes opacidades para la intensidad.
- Debe respetar `prefers-reduced-motion` (sin animaciones si el usuario lo prefiere).

## Casos límite

- **Año sin sesiones**: todas las celdas en gris neutro.
- **Un solo día con sesión**: ese día tiene el 100% de intensidad, el resto en gris.
- **Múltiples sesiones el mismo día**: se suman los minutos de todas las sesiones del día.
- **Sesiones en fechas futuras**: no se muestran en el mapa (el mapa solo llega hasta hoy).
- **Cambio de año**: el mapa muestra las últimas 52 semanas desde hoy, no el año calendario.

## Fuera de alcance

- Personalización de colores por el usuario.
- Filtros por tema o materia.
- Exportar el mapa como imagen.
- Mostrar rachas o estadísticas adicionales dentro del mapa.
- Soporte para múltiples usuarios o cuentas.
- Leyenda de intensidad (solo se muestra el tooltip).

## Criterios de finalización

- El mapa de calor muestra 52 semanas con la intensidad correcta proporcional al máximo.
- Los días sin sesión se ven en gris neutro.
- El tooltip muestra fecha y minutos al pasar el ratón.
- Las etiquetas de mes aparecen en las columnas correspondientes.
- El mapa se actualiza al registrar/editar/eliminar sesiones.
- La lógica de cálculo está separada del DOM y se prueba con `node --test`.
- La vista móvil (375px) se ve correctamente.
- No hay errores en la consola.

## Dudas abiertas

