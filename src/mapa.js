// ============================================================
// Renderizado del mapa de calor en el DOM
// ============================================================

const COLORES = {
  gris: "#E5E0D8",
  verde: "#2D5F3F",
  opacidades: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
};

/**
 * Renderiza el mapa de calor en el contenedor.
 * @param {HTMLElement} contenedor
 * @param {Array<{fecha: string, tema: string, minutos: number}>} sesiones
 * @param {Date} hoy
 */
function renderizarMapa(contenedor, sesiones, hoy) {
  contenedor.innerHTML = "";

  const minutosPorDia = calcularMinutosPorDia(sesiones, hoy);
  const maximo = calcularMaximoMinutos(minutosPorDia);
  const semanas = generarSemanas(hoy);
  const etiquetas = generarEtiquetasMes(semanas);

  // Crear cuadrícula
  const grid = document.createElement("div");
  grid.className = "mapa-grid";

  // Pintar etiquetas de mes
  for (const etiqueta of etiquetas) {
    const div = document.createElement("div");
    div.className = "mapa-etiqueta";
    div.textContent = etiqueta.texto;
    div.style.gridColumn = etiqueta.columna + 1;
    div.style.gridRow = 1;
    grid.appendChild(div);
  }

  // Pintar celdas
  for (let s = 0; s < semanas.length; s++) {
    for (let d = 0; d < semanas[s].length; d++) {
      const dia = semanas[s][d];
      const celda = document.createElement("div");
      celda.className = "mapa-celda";

      if (dia.esFuturo) {
        celda.classList.add("mapa-celda-futuro");
      } else {
        const minutos = minutosPorDia.get(dia.fecha) || 0;
        const intensidad = calcularIntensidad(minutos, maximo);

        if (intensidad === 0) {
          celda.style.backgroundColor = COLORES.gris;
        } else {
          celda.style.backgroundColor = COLORES.verde;
          celda.style.opacity = COLORES.opacidades[intensidad];
        }

        // Tooltip
        const fechaFormateada = formatearFechaCorta(dia.fecha);
        const texto = minutos > 0 ? `${fechaFormateada}: ${minutos} min` : `${fechaFormateada}: sin sesión`;
        celda.addEventListener("mouseenter", (e) => mostrarTooltip(e, texto));
        celda.addEventListener("mouseleave", ocultarTooltip);
      }

      celda.style.gridColumn = s + 1;
      celda.style.gridRow = d + 2;
      grid.appendChild(celda);
    }
  }

  contenedor.appendChild(grid);
}

// ============================================================
// Tooltip
// ============================================================

function mostrarTooltip(event, texto) {
  ocultarTooltip();

  const tooltip = document.createElement("div");
  tooltip.className = "mapa-tooltip";
  tooltip.textContent = texto;
  tooltip.id = "mapa-tooltip-activo";

  document.body.appendChild(tooltip);

  const rect = event.target.getBoundingClientRect();
  tooltip.style.left = `${rect.left + window.scrollX}px`;
  tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 8}px`;
}

function ocultarTooltip() {
  const tooltip = document.getElementById("mapa-tooltip-activo");
  if (tooltip) tooltip.remove();
}

// ============================================================
// Utilidades de formato
// ============================================================

function formatearFechaCorta(texto) {
  const [anio, mes, dia] = texto.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

// ============================================================
// Distribución de temas (gráfico de queso CSS)
// ============================================================

const PIE_COLORES = [
  "#2D5F3F", // verde bosque
  "#3A7A4D",
  "#4A9B5E",
  "#5DBF75",
  "#7FD48F",
  "#A3E8B0", // "Otros" - más claro
];

/**
 * Genera un color determinista a partir de un string (hash simple).
 */
function colorPorTema(tema) {
  let hash = 0;
  for (let i = 0; i < tema.length; i++) {
    hash = tema.charCodeAt(i) + ((hash << 5) - hash);
  }
  const indice = Math.abs(hash) % PIE_COLORES.length;
  return PIE_COLORES[indice];
}

/**
 * Renderiza el gráfico de distribución de temas.
 * @param {HTMLElement} contenedor
 * @param {Array<{fecha: string, tema: string, minutos: number}>} sesiones
 * @param {Date} hoy
 */
function renderizarDistribucionTemas(contenedor, sesiones, hoy) {
  contenedor.innerHTML = "";

  const distribucion = calcularDistribucionTemas(sesiones, hoy);
  const datos = agruparTop5MasOtros(distribucion);

  if (datos.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "distribucion-vacio";
    vacio.textContent = "Sin datos este mes";
    contenedor.appendChild(vacio);
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "distribucion-wrapper";

  // Construir conic-gradient string y guardar rangos de ángulo por tema
  let gradientParts = [];
  let inicio = 0;
  const slices = []; // {inicio, fin, item, color}

  for (const item of datos) {
    const porcentaje = item.porcentaje / 100;
    const fin = inicio + porcentaje * 360;
    const color = colorPorTema(item.tema);

    gradientParts.push(`${color} ${inicio}deg ${fin}deg`);
    slices.push({ inicio, fin, item, color });
    inicio = fin;
  }

  // Gráfico de queso (conic-gradient único)
  const grafico = document.createElement("div");
  grafico.className = "pie-chart";
  grafico.setAttribute("role", "img");
  grafico.setAttribute("aria-label", "Distribución de temas del mes actual");
  grafico.style.background = `conic-gradient(${gradientParts.join(", ")})`;

  // Tooltip por ángulo del ratón (más robusto que overlays)
  let tooltip = null;
  let tooltipItem = null;

  function mostrarTooltipEnAngulo(clientX, clientY, item) {
    if (tooltipItem === item) return;
    ocultarTooltipDistribucion();

    tooltip = document.createElement("div");
    tooltip.className = "pie-tooltip";
    tooltip.textContent = `${item.tema}: ${item.minutos} min (${item.porcentaje}%)`;
    tooltip.id = "pie-tooltip-activo";

    document.body.appendChild(tooltip);

    tooltip.style.left = `${clientX + 12}px`;
    tooltip.style.top = `${clientY - tooltip.offsetHeight - 8}px`;
    tooltipItem = item;
  }

  function manejarMouseMove(e) {
    const rect = grafico.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distancia = Math.hypot(dx, dy);
    const radio = rect.width / 2;

    // Solo mostrar tooltip si el ratón está dentro del círculo
    if (distancia > radio) {
      ocultarTooltipDistribucion();
      return;
    }

    // Calcular ángulo (0° = derecha, 90° = abajo, en sentido horario)
    let angulo = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angulo < 0) angulo += 360;
    // Ajustar: conic-gradient empieza en 0° = arriba (12h), sentido horario
    // atan2 da 0° = derecha (3h), así que restamos 90°
    angulo = (angulo - 90 + 360) % 360;

    // Buscar en qué porción cae
    for (const slice of slices) {
      if (angulo >= slice.inicio && angulo < slice.fin) {
        mostrarTooltipEnAngulo(e.clientX, e.clientY, slice.item);
        return;
      }
    }
    // Caso borde: ángulo 360° = 0°
    if (angulo === 0 || angulo >= 360) {
      const primera = slices[0];
      if (primera && primera.inicio === 0) {
        mostrarTooltipEnAngulo(e.clientX, e.clientY, primera.item);
      }
    }
  }

  function manejarMouseLeave() {
    ocultarTooltipDistribucion();
  }

  function manejarFocus(e) {
    // Para navegación por teclado: enfocar la leyenda o el gráfico
    // Por simplicidad, no implementamos focus por teclado en porciones individuales
  }

  grafico.addEventListener("mousemove", manejarMouseMove);
  grafico.addEventListener("mouseleave", manejarMouseLeave);
  grafico.addEventListener("focus", manejarFocus);

  wrapper.appendChild(grafico);

  // Leyenda (también con tooltip al hover)
  const leyenda = document.createElement("ul");
  leyenda.className = "pie-leyenda";
  for (const item of datos) {
    const li = document.createElement("li");
    const color = colorPorTema(item.tema);
    li.innerHTML = `<span class="leyenda-color" style="background:${color}"></span> ${item.tema} — ${item.minutos} min (${item.porcentaje}%)`;
    li.addEventListener("mouseenter", (e) => mostrarTooltipEnAngulo(e.clientX, e.clientY, item));
    li.addEventListener("mouseleave", ocultarTooltipDistribucion);
    leyenda.appendChild(li);
  }
  wrapper.appendChild(leyenda);

  contenedor.appendChild(wrapper);
}

function ocultarTooltipDistribucion() {
  const tooltip = document.getElementById("pie-tooltip-activo");
  if (tooltip) tooltip.remove();
}
