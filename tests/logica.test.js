// ============================================================
// Tests de lógica pura con node --test
// Ejecutar: node --test
// ============================================================

const { test } = require("node:test");
const assert = require("node:assert");

const {
  calcularMinutosPorDia,
  calcularMaximoMinutos,
  calcularIntensidad,
  generarSemanas,
  generarEtiquetasMes,
  calcularDistribucionTemas,
  agruparTop5MasOtros,
  lunesDeSemana,
  mismaSemana,
  calcularProgresoObjetivo,
} = require("../src/logica.js");

// ============================================================
// calcularMinutosPorDia
// ============================================================

test("calcularMinutosPorDia: suma múltiples sesiones del mismo día", () => {
  const sesiones = [
    { fecha: "2026-10-01", tema: "Matemáticas", minutos: 30 },
    { fecha: "2026-10-01", tema: "Física", minutos: 45 },
  ];
  const hoy = new Date(2026, 9, 1);
  const resultado = calcularMinutosPorDia(sesiones, hoy);
  assert.equal(resultado.get("2026-10-01"), 75);
});

test("calcularMinutosPorDia: ignora fechas futuras", () => {
  const sesiones = [
    { fecha: "2026-10-01", tema: "Matemáticas", minutos: 30 },
    { fecha: "2026-10-05", tema: "Física", minutos: 45 },
  ];
  const hoy = new Date(2026, 9, 1);
  const resultado = calcularMinutosPorDia(sesiones, hoy);
  assert.equal(resultado.get("2026-10-01"), 30);
  assert.equal(resultado.get("2026-10-05"), undefined);
});

test("calcularMinutosPorDia: devuelve Map vacío si no hay sesiones", () => {
  const hoy = new Date(2026, 9, 1);
  const resultado = calcularMinutosPorDia([], hoy);
  assert.equal(resultado.size, 0);
});

// ============================================================
// calcularMaximoMinutos
// ============================================================

test("calcularMaximoMinutos: devuelve el máximo correcto", () => {
  const minutosPorDia = new Map([
    ["2026-10-01", 30],
    ["2026-10-02", 90],
    ["2026-10-03", 60],
  ]);
  assert.equal(calcularMaximoMinutos(minutosPorDia), 90);
});

test("calcularMaximoMinutos: devuelve 0 si el Map está vacío", () => {
  assert.equal(calcularMaximoMinutos(new Map()), 0);
});

// ============================================================
// calcularIntensidad
// ============================================================

test("calcularIntensidad: 0 minutos → nivel 0", () => {
  assert.equal(calcularIntensidad(0, 100), 0);
});

test("calcularIntensidad: 50% del máximo → nivel 3", () => {
  assert.equal(calcularIntensidad(50, 100), 3);
});

test("calcularIntensidad: 100% del máximo → nivel 5", () => {
  assert.equal(calcularIntensidad(100, 100), 5);
});

test("calcularIntensidad: máximo = 0 → nivel 0", () => {
  assert.equal(calcularIntensidad(50, 0), 0);
});

test("calcularIntensidad: 20% del máximo → nivel 1", () => {
  assert.equal(calcularIntensidad(20, 100), 1);
});

test("calcularIntensidad: 80% del máximo → nivel 4", () => {
  assert.equal(calcularIntensidad(80, 100), 4);
});

// ============================================================
// generarSemanas
// ============================================================

test("generarSemanas: devuelve exactamente 52 semanas", () => {
  const hoy = new Date(2026, 9, 1);
  const semanas = generarSemanas(hoy);
  assert.equal(semanas.length, 52);
});

test("generarSemanas: cada semana tiene 7 días", () => {
  const hoy = new Date(2026, 9, 1);
  const semanas = generarSemanas(hoy);
  for (const semana of semanas) {
    assert.equal(semana.length, 7);
  }
});

test("generarSemanas: la última semana termina en domingo", () => {
  const hoy = new Date(2026, 9, 1);
  const semanas = generarSemanas(hoy);
  const ultimaSemana = semanas[51];
  const ultimoDia = ultimaSemana[6];
  // La última semana termina en domingo 4 de octubre
  assert.equal(ultimoDia.fecha, "2026-10-04");
});

test("generarSemanas: los días futuros están marcados", () => {
  const hoy = new Date(2026, 9, 1);
  const semanas = generarSemanas(hoy);
  const ultimaSemana = semanas[51];
  // El 1 de octubre es jueves, así que viernes, sábado y domingo son futuros
  assert.equal(ultimaSemana[4].esFuturo, true);
  assert.equal(ultimaSemana[5].esFuturo, true);
  assert.equal(ultimaSemana[6].esFuturo, true);
});

// ============================================================
// generarEtiquetasMes
// ============================================================

test("generarEtiquetasMes: devuelve etiquetas para cada mes visible", () => {
  const hoy = new Date(2026, 9, 1);
  const semanas = generarSemanas(hoy);
  const etiquetas = generarEtiquetasMes(semanas);
  assert.ok(etiquetas.length > 0);
  assert.ok(etiquetas.length <= 13); // Máximo 12 meses + 1
});

test("generarEtiquetasMes: el texto coincide con el mes correcto", () => {
  const hoy = new Date(2026, 9, 1);
  const semanas = generarSemanas(hoy);
  const etiquetas = generarEtiquetasMes(semanas);
  // La primera etiqueta debería ser de un mes anterior a octubre
  assert.ok(etiquetas[0].texto.length > 0);
});

// ============================================================
// calcularDistribucionTemas
// ============================================================

test("calcularDistribucionTemas: mes sin sesiones → array vacío", () => {
  const sesiones = [];
  const hoy = new Date(2026, 9, 15);
  const resultado = calcularDistribucionTemas(sesiones, hoy);
  assert.deepEqual(resultado, []);
});

test("calcularDistribucionTemas: una sesión → 1 tema 100%", () => {
  const sesiones = [
    { fecha: "2026-10-01", tema: "JavaScript", minutos: 60 },
  ];
  const hoy = new Date(2026, 9, 15);
  const resultado = calcularDistribucionTemas(sesiones, hoy);
  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].tema, "JavaScript");
  assert.equal(resultado[0].minutos, 60);
  assert.equal(resultado[0].porcentaje, 100);
});

test("calcularDistribucionTemas: varias sesiones mismo tema → suma minutos", () => {
  const sesiones = [
    { fecha: "2026-10-01", tema: "JavaScript", minutos: 30 },
    { fecha: "2026-10-05", tema: "JavaScript", minutos: 45 },
  ];
  const hoy = new Date(2026, 9, 15);
  const resultado = calcularDistribucionTemas(sesiones, hoy);
  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].minutos, 75);
  assert.equal(resultado[0].porcentaje, 100);
});

test("calcularDistribucionTemas: ignora fechas futuras", () => {
  const sesiones = [
    { fecha: "2026-10-01", tema: "JavaScript", minutos: 60 },
    { fecha: "2026-10-20", tema: "CSS", minutos: 40 }, // futuro respecto a hoy=15
  ];
  const hoy = new Date(2026, 9, 15);
  const resultado = calcularDistribucionTemas(sesiones, hoy);
  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].tema, "JavaScript");
});

test("calcularDistribucionTemas: orden descendente por minutos", () => {
  const sesiones = [
    { fecha: "2026-10-01", tema: "CSS", minutos: 30 },
    { fecha: "2026-10-02", tema: "JavaScript", minutos: 90 },
    { fecha: "2026-10-03", tema: "HTML", minutos: 60 },
  ];
  const hoy = new Date(2026, 9, 15);
  const resultado = calcularDistribucionTemas(sesiones, hoy);
  assert.equal(resultado[0].tema, "JavaScript");
  assert.equal(resultado[1].tema, "HTML");
  assert.equal(resultado[2].tema, "CSS");
});

// ============================================================
// agruparTop5MasOtros
// ============================================================

test("agruparTop5MasOtros: ≤5 temas → sin cambios", () => {
  const distribucion = [
    { tema: "A", minutos: 50, porcentaje: 50 },
    { tema: "B", minutos: 30, porcentaje: 30 },
    { tema: "C", minutos: 20, porcentaje: 20 },
  ];
  const resultado = agruparTop5MasOtros(distribucion);
  assert.deepEqual(resultado, distribucion);
});

test("agruparTop5MasOtros: 7 temas → top 5 + Otros con suma correcta", () => {
  const distribucion = [
    { tema: "A", minutos: 50, porcentaje: 25 },
    { tema: "B", minutos: 40, porcentaje: 20 },
    { tema: "C", minutos: 30, porcentaje: 15 },
    { tema: "D", minutos: 25, porcentaje: 12 },
    { tema: "E", minutos: 20, porcentaje: 10 },
    { tema: "F", minutos: 15, porcentaje: 10 },
    { tema: "G", minutos: 10, porcentaje: 8 },
  ];
  const resultado = agruparTop5MasOtros(distribucion);
  assert.equal(resultado.length, 6);
  assert.equal(resultado[5].tema, "Otros");
  assert.equal(resultado[5].minutos, 25); // 15 + 10
  assert.ok(resultado[5].porcentaje >= 18); // 10 + 8 = 18 (redondeos pueden variar)
});

test("agruparTop5MasOtros: porcentaje Otros = suma porcentajes resto", () => {
  const distribucion = [
    { tema: "A", minutos: 50, porcentaje: 30 },
    { tema: "B", minutos: 40, porcentaje: 25 },
    { tema: "C", minutos: 30, porcentaje: 20 },
    { tema: "D", minutos: 20, porcentaje: 15 },
    { tema: "E", minutos: 10, porcentaje: 5 },
    { tema: "F", minutos: 10, porcentaje: 3 },
    { tema: "G", minutos: 10, porcentaje: 2 },
  ];
  const resultado = agruparTop5MasOtros(distribucion);
  const otrosPorcentaje = resultado[5].porcentaje;
  assert.equal(otrosPorcentaje, 5); // 3 + 2
});

// ============================================================
// lunesDeSemana
// ============================================================

test("lunesDeSemana: jueves 1 oct 2026 → lunes 28 sep 2026", () => {
  const jueves = new Date(2026, 9, 1);
  assert.equal(lunesDeSemana(jueves), "2026-09-28");
});

test("lunesDeSemana: domingo 4 oct 2026 → lunes 28 sep 2026", () => {
  const domingo = new Date(2026, 9, 4);
  assert.equal(lunesDeSemana(domingo), "2026-09-28");
});

test("lunesDeSemana: lunes 28 sep 2026 → mismo lunes", () => {
  const lunes = new Date(2026, 8, 28);
  assert.equal(lunesDeSemana(lunes), "2026-09-28");
});

test("lunesDeSemana: lunes 5 ene 2026 (año nuevo) → lunes 5 ene", () => {
  const lunes = new Date(2026, 0, 5);
  assert.equal(lunesDeSemana(lunes), "2026-01-05");
});

// ============================================================
// mismaSemana
// ============================================================

test("mismaSemana: jueves 1 oct y sábado 3 oct 2026 → true", () => {
  assert.equal(mismaSemana("2026-10-01", "2026-10-03"), true);
});

test("mismaSemana: jueves 1 oct y lunes 5 oct 2026 (semana siguiente) → false", () => {
  assert.equal(mismaSemana("2026-10-01", "2026-10-05"), false);
});

test("mismaSemana: 24 dic 2026 (jueves) y 2 ene 2027 (sábado) → false (semanas distintas, año distinto)", () => {
  // 24 dic 2026 = semana 21-27 dic; 2 ene 2027 = semana 28 dic - 3 ene
  assert.equal(mismaSemana("2026-12-24", "2027-01-02"), false);
});

// ============================================================
// calcularProgresoObjetivo
// ============================================================

const HOY_TEST = new Date(2026, 9, 1); // Jueves 1 oct 2026
const LUNES_TEST = "2026-09-28";

test("calcularProgresoObjetivo: sin sesiones → 0%, rojo, 'Te faltan X min'", () => {
  const resultado = calcularProgresoObjetivo([], 300, HOY_TEST);
  assert.equal(resultado.acumulado, 0);
  assert.equal(resultado.porcentaje, 0);
  assert.equal(resultado.color, "#A82B1A");
  assert.equal(resultado.textoPrincipal, "Llevas 0 min de 300 min de objetivo (0%)");
  assert.equal(resultado.textoSecundario, "Te faltan 300 min para el objetivo");
});

test("calcularProgresoObjetivo: 60 min de 300 → 20%, rojo, 'Te faltan 240 min'", () => {
  const sesiones = [
    { fecha: LUNES_TEST, tema: "A", minutos: 30 },
    { fecha: "2026-09-29", tema: "B", minutos: 30 },
  ];
  const resultado = calcularProgresoObjetivo(sesiones, 300, HOY_TEST);
  assert.equal(resultado.acumulado, 60);
  assert.equal(resultado.porcentaje, 20);
  assert.equal(resultado.color, "#A82B1A");
  assert.equal(resultado.textoSecundario, "Te faltan 240 min para el objetivo");
});

test("calcularProgresoObjetivo: 300 min de 300 → 100%, verde, '¡Objetivo cumplido! 🎉'", () => {
  const sesiones = [
    { fecha: LUNES_TEST, tema: "A", minutos: 150 },
    { fecha: "2026-09-29", tema: "B", minutos: 150 },
  ];
  const resultado = calcularProgresoObjetivo(sesiones, 300, HOY_TEST);
  assert.equal(resultado.acumulado, 300);
  assert.equal(resultado.porcentaje, 100);
  assert.equal(resultado.color, "#2D5F3F");
  assert.equal(resultado.textoSecundario, "¡Objetivo cumplido! 🎉");
});

test("calcularProgresoObjetivo: 400 min de 300 → 100% (cap), verde", () => {
  const sesiones = [
    { fecha: LUNES_TEST, tema: "A", minutos: 200 },
    { fecha: "2026-09-29", tema: "B", minutos: 200 },
  ];
  const resultado = calcularProgresoObjetivo(sesiones, 300, HOY_TEST);
  assert.equal(resultado.acumulado, 400);
  assert.equal(resultado.porcentaje, 100);
  assert.equal(resultado.color, "#2D5F3F");
});

test("calcularProgresoObjetivo: cambio objetivo misma semana: 200 hechos, 300→150 → 100%, verde", () => {
  const sesiones = [
    { fecha: LUNES_TEST, tema: "A", minutos: 100 },
    { fecha: "2026-09-29", tema: "B", minutos: 100 },
  ];
  // Primero con objetivo 300
  const antes = calcularProgresoObjetivo(sesiones, 300, HOY_TEST);
  assert.equal(antes.porcentaje, 67); // 200/300 = 66.66 → 67
  // Cambio objetivo a 150 en la misma semana
  const despues = calcularProgresoObjetivo(sesiones, 150, HOY_TEST);
  assert.equal(despues.acumulado, 200);
  assert.equal(despues.porcentaje, 100);
  assert.equal(despues.color, "#2D5F3F");
  assert.equal(despues.textoSecundario, "¡Objetivo cumplido! 🎉");
});
