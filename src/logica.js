// ============================================================
// Lógica pura del mapa de calor (sin DOM, sin localStorage)
// Todas las funciones reciben "hoy" como parámetro para tests
// ============================================================

/**
 * Calcula los minutos totales por día, ignorando fechas futuras.
 * @param {Array<{fecha: string, tema: string, minutos: number}>} sesiones
 * @param {Date} hoy
 * @returns {Map<string, number>} Mapa "YYYY-MM-DD" -> minutos
 */
function calcularMinutosPorDia(sesiones, hoy) {
  const minutosPorDia = new Map();
  const hoyTexto = dateATexto(hoy);

  for (const sesion of sesiones) {
    if (sesion.fecha > hoyTexto) continue;
    const actual = minutosPorDia.get(sesion.fecha) || 0;
    minutosPorDia.set(sesion.fecha, actual + sesion.minutos);
  }

  return minutosPorDia;
}

/**
 * Calcula el máximo de minutos registrados en un día.
 * @param {Map<string, number>} minutosPorDia
 * @returns {number}
 */
function calcularMaximoMinutos(minutosPorDia) {
  let maximo = 0;
  for (const minutos of minutosPorDia.values()) {
    if (minutos > maximo) maximo = minutos;
  }
  return maximo;
}

/**
 * Calcula el nivel de intensidad (0-5) según los minutos y el máximo.
 * @param {number} minutos
 * @param {number} maximo
 * @returns {number} 0 (sin sesión) a 5 (máxima intensidad)
 */
function calcularIntensidad(minutos, maximo) {
  if (minutos === 0 || maximo === 0) return 0;
  const porcentaje = (minutos / maximo) * 100;
  if (porcentaje <= 20) return 1;
  if (porcentaje <= 40) return 2;
  if (porcentaje <= 60) return 3;
  if (porcentaje <= 80) return 4;
  return 5;
}

/**
 * Genera las últimas 52 semanas (lunes a domingo) hasta hoy.
 * @param {Date} hoy
 * @returns {Array<Array<{fecha: string, esFuturo: boolean}>>}
 */
function generarSemanas(hoy) {
  const semanas = [];
  const hoyTexto = dateATexto(hoy);

  // Calcular el lunes de la semana actual
  const diaSemana = hoy.getDay(); // 0 = domingo, 1 = lunes, ...
  const diffALunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunesActual = sumarDias(hoy, diffALunes);

  // Retroceder 51 semanas más (52 en total)
  const inicio = sumarDias(lunesActual, -51 * 7);

  for (let s = 0; s < 52; s++) {
    const semana = [];
    for (let d = 0; d < 7; d++) {
      const fecha = sumarDias(inicio, s * 7 + d);
      const fechaTexto = dateATexto(fecha);
      semana.push({
        fecha: fechaTexto,
        esFuturo: fechaTexto > hoyTexto,
      });
    }
    semanas.push(semana);
  }

  return semanas;
}

/**
 * Genera etiquetas de mes para las columnas del mapa.
 * @param {Array<Array<{fecha: string, esFuturo: boolean}>>} semanas
 * @returns {Array<{columna: number, texto: string}>}
 */
function generarEtiquetasMes(semanas) {
  const etiquetas = [];
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  let mesAnterior = null;

  for (let columna = 0; columna < semanas.length; columna++) {
    const primerDia = semanas[columna][0];
    if (primerDia.esFuturo) continue;

    const fecha = textoAFecha(primerDia.fecha);
    const mes = fecha.getMonth();

    if (mes !== mesAnterior) {
      etiquetas.push({ columna, texto: meses[mes] });
      mesAnterior = mes;
    }
  }

  return etiquetas;
}

// ============================================================
// Distribución de temas (mes actual)
// ============================================================

/**
 * Calcula la distribución de minutos por tema en el mes actual.
 * @param {Array<{fecha: string, tema: string, minutos: number}>} sesiones
 * @param {Date} hoy
 * @returns {Array<{tema: string, minutos: number, porcentaje: number}>} Ordenado desc por minutos
 */
function calcularDistribucionTemas(sesiones, hoy) {
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const hoyTexto = dateATexto(hoy);

  const minutosPorTema = {};

  for (const sesion of sesiones) {
    if (sesion.fecha > hoyTexto) continue;
    if (!sesion.fecha.startsWith(mesActual)) continue;
    minutosPorTema[sesion.tema] = (minutosPorTema[sesion.tema] || 0) + sesion.minutos;
  }

  const total = Object.values(minutosPorTema).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  const resultado = Object.entries(minutosPorTema).map(([tema, minutos]) => ({
    tema,
    minutos,
    porcentaje: Math.round((minutos * 100) / total),
  }));

  resultado.sort((a, b) => b.minutos - a.minutos);
  return resultado;
}

/**
 * Agrupa los temas en top 5 + "Otros" si hay más de 5.
 * @param {Array<{tema: string, minutos: number, porcentaje: number}>} distribucion
 * @returns {Array<{tema: string, minutos: number, porcentaje: number}>} Máx. 6 items
 */
function agruparTop5MasOtros(distribucion) {
  if (distribucion.length <= 5) return distribucion;

  const top5 = distribucion.slice(0, 5);
  const resto = distribucion.slice(5);

  const otrosMinutos = resto.reduce((sum, item) => sum + item.minutos, 0);
  const otrosPorcentaje = resto.reduce((sum, item) => sum + item.porcentaje, 0);

  return [...top5, { tema: "Otros", minutos: otrosMinutos, porcentaje: otrosPorcentaje }];
}

// ============================================================
// Utilidades de fechas (horas locales, nunca UTC)
// ============================================================

function dateATexto(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function textoAFecha(texto) {
  const [anio, mes, dia] = texto.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

function sumarDias(fecha, cantidad) {
  const nueva = new Date(fecha);
  nueva.setDate(nueva.getDate() + cantidad);
  return nueva;
}

function hoyComoTexto() {
  return dateATexto(new Date());
}

/**
 * Devuelve el lunes de la semana de la fecha dada (en local).
 * @param {Date} fecha
 * @returns {string} "YYYY-MM-DD" del lunes
 */
function lunesDeSemana(fecha) {
  const diaSemana = fecha.getDay(); // 0 = domingo, 1 = lunes, ...
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
  return dateATexto(sumarDias(fecha, diff));
}

/**
 * Comprueba si dos fechas "YYYY-MM-DD" están en la misma semana (lunes-domingo).
 * @param {string} fechaA
 * @param {string} fechaB
 * @returns {boolean}
 */
function mismaSemana(fechaA, fechaB) {
  return lunesDeSemana(textoAFecha(fechaA)) === lunesDeSemana(textoAFecha(fechaB));
}

/**
 * Calcula el progreso del objetivo semanal de minutos.
 * @param {Array<{fecha: string, tema: string, minutos: number}>} sesiones
 * @param {number} objetivoMinutos
 * @param {Date} hoy
 * @returns {{acumulado: number, porcentaje: number, color: string, textoPrincipal: string, textoSecundario: string}}
 */
function calcularProgresoObjetivo(sesiones, objetivoMinutos, hoy) {
  const lunesTexto = lunesDeSemana(hoy);
  const hoyTexto = dateATexto(hoy);

  let acumulado = 0;
  for (const sesion of sesiones) {
    if (sesion.fecha >= lunesTexto && sesion.fecha <= hoyTexto) {
      acumulado += sesion.minutos;
    }
  }

  const porcentaje = Math.min(100, Math.round((acumulado / objetivoMinutos) * 100));

  let color;
  if (porcentaje >= 100) color = "#2D5F3F";
  else if (porcentaje >= 75) color = "#B4860C";
  else color = "#A82B1A";

  const textoPrincipal = `Llevas ${acumulado} min de ${objetivoMinutos} min de objetivo (${porcentaje}%)`;

  let textoSecundario;
  if (porcentaje >= 100) {
    textoSecundario = "¡Objetivo cumplido! 🎉";
  } else {
    textoSecundario = `Te faltan ${objetivoMinutos - acumulado} min para el objetivo`;
  }

  return { acumulado, porcentaje, color, textoPrincipal, textoSecundario };
}

// Exportar para node --test
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calcularMinutosPorDia,
    calcularMaximoMinutos,
    calcularIntensidad,
    generarSemanas,
    generarEtiquetasMes,
    calcularDistribucionTemas,
    agruparTop5MasOtros,
    dateATexto,
    textoAFecha,
    sumarDias,
    hoyComoTexto,
    lunesDeSemana,
    mismaSemana,
    calcularProgresoObjetivo,
  };
}
