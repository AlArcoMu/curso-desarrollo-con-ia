// ============================================================
// Diario de Estudio - Lógica principal
// ============================================================

// Clave donde guardamos las sesiones en localStorage
const CLAVE_STORAGE = "diarioEstudio.sesiones";

// Elementos del DOM
const formulario = document.getElementById("formulario");
const inputFecha = document.getElementById("fecha");
const inputTema = document.getElementById("tema");
const inputMinutos = document.getElementById("minutos");
const rachaNumero = document.getElementById("rachaNumero");
const rachaMejor = document.getElementById("rachaMejor");
const totalMinutosEl = document.getElementById("totalMinutos");
const semanaMinutosEl = document.getElementById("semanaMinutos");
const diasMesEl = document.getElementById("diasMes");
const lista = document.getElementById("lista");
const listaVacia = document.getElementById("listaVacia");
const mapaCalor = document.getElementById("mapaCalor");
const distribucionTemas = document.getElementById("distribucionTemas");

// Elementos del objetivo semanal
const formularioObjetivo = document.getElementById("formularioObjetivo");
const inputObjetivo = document.getElementById("inputObjetivo");
const btnObjetivo = document.getElementById("btnObjetivo");
const objetivoError = document.getElementById("objetivo-error");
const objetivoProgreso = document.getElementById("objetivoProgreso");
const barraFill = document.querySelector(".barra-progreso-fill");
const textoProgresoPrincipal = document.getElementById("textoProgresoPrincipal");
const textoProgresoSecundario = document.getElementById("textoProgresoSecundario");
const btnCambiarObjetivo = document.getElementById("btnCambiarObjetivo");
const textoSemanaPasada = document.getElementById("textoSemanaPasada");

// Índice de la sesión que se está editando (null = no editando)
let indiceEdicion = null;

// ============================================================
// Utilidades de fechas (siempre hora local, nunca UTC)
// ============================================================

// Formatea una fecha para mostrarla: "lunes, 30 de septiembre"
function formatearFecha(texto) {
  const fecha = textoAFecha(texto);
  return fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ============================================================
// Objetivo semanal - almacenamiento
// ============================================================

function cargarObjetivo() {
  const datos = localStorage.getItem("diarioEstudio.objetivoSemanal");
  if (!datos) return null;
  try { return JSON.parse(datos); } catch { return null; }
}

function guardarObjetivo(minutos) {
  const hoy = new Date();
  const semanaInicio = lunesDeSemana(hoy); // usa función global de logica.js
  localStorage.setItem("diarioEstudio.objetivoSemanal", JSON.stringify({ minutos, semanaInicio }));
}

// ============================================================
// Objetivo semanal - validación
// ============================================================

function validarObjetivo(valor) {
  const num = Number(valor);
  return Number.isInteger(num) && num >= 1 && num <= 10080;
}

// ============================================================
// Cargar y guardar datos
// ============================================================

function cargarSesiones() {
  const datos = localStorage.getItem(CLAVE_STORAGE);
  if (!datos) return [];
  try {
    return JSON.parse(datos);
  } catch {
    return [];
  }
}

function guardarSesiones(sesiones) {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(sesiones));
}

// ============================================================
// Calcular la racha actual
// ============================================================

function calcularRacha(sesiones) {
  // Conjunto de días que tienen al menos una sesión
  const diasConSesion = new Set(sesiones.map((s) => s.fecha));

  // Empezamos por hoy. Si hoy no hay sesión, empezamos por ayer
  // (la racha sigue viva hasta que termine el día).
  let diaActual = new Date();
  if (!diasConSesion.has(hoyComoTexto())) {
    diaActual = sumarDias(diaActual, -1);
  }

  // Si ni hoy ni ayer hay sesión, la racha es 0
  if (!diasConSesion.has(dateATexto(diaActual))) {
    return 0;
  }

  // Contamos hacia atrás los días consecutivos con sesión
  let racha = 0;
  while (diasConSesion.has(dateATexto(diaActual))) {
    racha++;
    diaActual = sumarDias(diaActual, -1);
  }
  return racha;
}

// ============================================================
// Estadísticas adicionales
// ============================================================

function calcularTotalMinutos(sesiones) {
  return sesiones.reduce((total, s) => total + s.minutos, 0);
}

function calcularMinutosSemana(sesiones) {
  // Obtener el lunes de esta semana
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0 = domingo, 1 = lunes, ...
  const diffALunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = sumarDias(hoy, diffALunes);
  const lunesTexto = dateATexto(lunes);

  // Sumar minutos de sesiones desde el lunes hasta hoy
  return sesiones
    .filter((s) => s.fecha >= lunesTexto && s.fecha <= hoyComoTexto())
    .reduce((total, s) => total + s.minutos, 0);
}

// ============================================================
// Calcular los días estudiados este mes
// ============================================================

function calcularDiasMes(sesiones) {
  // Mes actual en hora local: "AAAA-MM"
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const hoyTexto = hoyComoTexto();

  // Días únicos con sesión este mes, ignorando fechas futuras
  const diasUnicos = new Set(
    sesiones
      .filter((s) => s.fecha.startsWith(mesActual) && s.fecha <= hoyTexto)
      .map((s) => s.fecha)
  );

  return diasUnicos.size;
}

// ============================================================
// Calcular la mejor racha histórica
// ============================================================

function calcularMejorRacha(sesiones) {
  const hoy = hoyComoTexto();
  // Conjunto de días con sesión (cada día cuenta una vez), ignorando fechas futuras
  const diasUnicos = [...new Set(sesiones.map((s) => s.fecha))]
    .filter((f) => f <= hoy)
    .sort();

  let mejor = 0;
  let rachaActual = 0;
  let diaAnterior = null;

  for (const dia of diasUnicos) {
    if (diaAnterior !== null) {
      // Si este día es exactamente el siguiente al anterior, la racha continúa
      const esperado = dateATexto(sumarDias(textoAFecha(diaAnterior), 1));
      if (dia === esperado) {
        rachaActual++;
      } else {
        rachaActual = 1;
      }
    } else {
      rachaActual = 1;
    }
    if (rachaActual > mejor) mejor = rachaActual;
    diaAnterior = dia;
  }

  return mejor;
}

// ============================================================
// Mostrar la lista de sesiones (más reciente primero)
// ============================================================

function mostrarLista(sesiones) {
  lista.innerHTML = "";

  if (sesiones.length === 0) {
    listaVacia.style.display = "block";
    return;
  }

  listaVacia.style.display = "none";

  // Ordenar por fecha descendente
  const ordenadas = [...sesiones].sort((a, b) => b.fecha.localeCompare(a.fecha));

  for (let i = 0; i < ordenadas.length; i++) {
    const sesion = ordenadas[i];
    const item = document.createElement("li");

    const fecha = document.createElement("span");
    fecha.className = "lista-fecha";
    fecha.textContent = formatearFecha(sesion.fecha);

    const detalle = document.createElement("span");
    detalle.className = "lista-detalle";
    detalle.textContent = sesion.tema;

    const minutos = document.createElement("span");
    minutos.className = "lista-minutos";
    minutos.textContent = `${sesion.minutos} min`;

    // Botones de editar y eliminar
    const acciones = document.createElement("span");
    acciones.className = "lista-acciones";

    const btnEditar = document.createElement("button");
    btnEditar.className = "btn-editar";
    btnEditar.textContent = "Editar";
    btnEditar.addEventListener("click", () => editarSesion(sesion));

    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn-eliminar";
    btnEliminar.textContent = "Eliminar";
    btnEliminar.addEventListener("click", () => eliminarSesion(sesion));

    acciones.appendChild(btnEditar);
    acciones.appendChild(btnEliminar);

    item.appendChild(fecha);
    item.appendChild(detalle);
    item.appendChild(minutos);
    item.appendChild(acciones);
    lista.appendChild(item);
  }
}

// ============================================================
// Editar y eliminar sesiones
// ============================================================

function editarSesion(sesion) {
  // Buscar la sesión en el array original
  const sesiones = cargarSesiones();
  indiceEdicion = sesiones.findIndex(
    (s) => s.fecha === sesion.fecha && s.tema === sesion.tema && s.minutos === sesion.minutos
  );

  if (indiceEdicion === -1) return;

  // Llenar el formulario con los datos de la sesión
  inputFecha.value = sesion.fecha;
  inputTema.value = sesion.tema;
  inputMinutos.value = sesion.minutos;

  // Cambiar el texto del botón
  const boton = formulario.querySelector("button");
  boton.textContent = "Guardar cambios";

  // Hacer scroll al formulario
  formulario.scrollIntoView({ behavior: "smooth" });
}

function eliminarSesion(sesion) {
  if (!confirm("¿Seguro que quieres eliminar esta sesión?")) return;

  const sesiones = cargarSesiones();
  const indice = sesiones.findIndex(
    (s) => s.fecha === sesion.fecha && s.tema === sesion.tema && s.minutos === sesion.minutos
  );

  if (indice === -1) return;

  sesiones.splice(indice, 1);
  guardarSesiones(sesiones);
  actualizar();
}

// ============================================================
// Actualizar toda la interfaz
// ============================================================

function actualizar() {
  const sesiones = cargarSesiones();
  rachaNumero.textContent = calcularRacha(sesiones);
  rachaMejor.textContent = `Mejor racha: ${calcularMejorRacha(sesiones)} días 🏆`;
  totalMinutosEl.textContent = calcularTotalMinutos(sesiones);
  semanaMinutosEl.textContent = calcularMinutosSemana(sesiones);
  diasMesEl.textContent = calcularDiasMes(sesiones);
  mostrarLista(sesiones);
  renderizarMapa(mapaCalor, sesiones, new Date());
  renderizarDistribucionTemas(distribucionTemas, sesiones, new Date());
  renderizarObjetivo(sesiones);
}

// ============================================================
// Objetivo semanal - renderizado
// ============================================================

function renderizarObjetivo(sesiones) {
  const objetivo = cargarObjetivo();
  const hoy = new Date();
  const hoyTexto = hoyComoTexto();

  // Limpiar estados previos
  formularioObjetivo.hidden = false;
  objetivoProgreso.hidden = true;
  btnCambiarObjetivo.hidden = true;
  textoSemanaPasada.hidden = true;
  objetivoError.hidden = true;

  if (!objetivo) {
    // Sin objetivo guardado
    inputObjetivo.value = "";
    btnObjetivo.textContent = "Guardar objetivo";
    return;
  }

  const mismaSem = mismaSemana(objetivo.semanaInicio, hoyTexto);

  if (mismaSem) {
    // Objetivo de esta semana
    formularioObjetivo.hidden = true;
    objetivoProgreso.hidden = false;
    btnCambiarObjetivo.hidden = false;
    calcularYRenderizarProgreso(sesiones, objetivo);
  } else if (objetivo.semanaInicio < hoyTexto) {
    // Semana pasada
    formularioObjetivo.hidden = false;
    objetivoProgreso.hidden = true;
    btnCambiarObjetivo.hidden = true;
    textoSemanaPasada.hidden = false;
    textoSemanaPasada.textContent = `Objetivo de la semana pasada: ${objetivo.minutos} min`;
    inputObjetivo.value = "";
    btnObjetivo.textContent = "Guardar objetivo";
  } else {
    // Futuro (caso borde): trata como sin objetivo
    inputObjetivo.value = "";
    btnObjetivo.textContent = "Guardar objetivo";
  }
}

function calcularYRenderizarProgreso(sesiones, objetivo) {
  const hoy = new Date();
  const progreso = calcularProgresoObjetivo(sesiones, objetivo.minutos, hoy);

  // Actualizar barra
  barraFill.style.width = `${progreso.porcentaje}%`;
  barraFill.style.background = progreso.color;
  barraFill.parentElement.setAttribute("aria-valuenow", progreso.porcentaje);

  // Textos
  textoProgresoPrincipal.textContent = progreso.textoPrincipal;
  textoProgresoSecundario.textContent = progreso.textoSecundario;
}

// ============================================================
// Eventos
// ============================================================

// Al cargar la página: poner hoy como fecha y mostrar datos
inputFecha.value = hoyComoTexto();
actualizar();

// Al enviar el formulario: guardar nueva sesión o guardar edición
formulario.addEventListener("submit", (e) => {
  e.preventDefault();

  const sesiones = cargarSesiones();

  if (indiceEdicion !== null) {
    // Estamos editando: actualizar la sesión existente
    sesiones[indiceEdicion] = {
      fecha: inputFecha.value,
      tema: inputTema.value.trim(),
      minutos: Number(inputMinutos.value),
    };
    indiceEdicion = null;
    formulario.querySelector("button").textContent = "Guardar sesión";
  } else {
    // Nueva sesión
    sesiones.push({
      fecha: inputFecha.value,
      tema: inputTema.value.trim(),
      minutos: Number(inputMinutos.value),
    });
  }

  guardarSesiones(sesiones);

  // Limpiar campos de texto y dejar la fecha en hoy
  inputTema.value = "";
  inputMinutos.value = "";
  inputFecha.value = hoyComoTexto();

  actualizar();
});

// Submit formulario objetivo
formularioObjetivo.addEventListener("submit", (e) => {
  e.preventDefault();
  const valor = inputObjetivo.value.trim();
  if (!validarObjetivo(valor)) {
    objetivoError.hidden = false;
    return;
  }
  objetivoError.hidden = true;
  guardarObjetivo(Number(valor));
  renderizarObjetivo(cargarSesiones());
});

// Click botón cambiar objetivo
btnCambiarObjetivo.addEventListener("click", () => {
  const objetivo = cargarObjetivo();
  if (objetivo) {
    formularioObjetivo.hidden = false;
    objetivoProgreso.hidden = true;
    btnCambiarObjetivo.hidden = true;
    inputObjetivo.value = objetivo.minutos;
    btnObjetivo.textContent = "Guardar objetivo";
    inputObjetivo.focus();
  }
});
