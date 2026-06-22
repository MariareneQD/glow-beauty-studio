// =======================================================
// Glow Beauty Studio - Frontend público
// =======================================================
const API_BASE = "/api";

// ---------- Menú móvil ----------
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.querySelector(".nav-links");
if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    navLinks.style.display = navLinks.style.display === "flex" ? "none" : "flex";
    navLinks.style.flexDirection = "column";
    navLinks.style.position = "absolute";
    navLinks.style.top = "70px";
    navLinks.style.right = "20px";
    navLinks.style.background = "#1a1a1f";
    navLinks.style.padding = "20px 30px";
    navLinks.style.borderRadius = "12px";
  });
}

// ---------- Cargar SERVICIOS desde el backend ----------
async function cargarServicios() {
  try {
    const res = await fetch(`${API_BASE}/services`);
    const servicios = await res.json();

    const grid = document.getElementById("gridServicios");
    const selectServicio = document.getElementById("servicio");

    grid.innerHTML = servicios
      .map(
        (s) => `
      <div class="tarjeta-servicio">
        <div class="img-servicio"><img src="${s.imagen}" alt="${s.nombre}" loading="lazy"></div>
        <div class="info-servicio">
          <span class="categoria">${s.categoria}</span>
          <h3>${s.nombre}</h3>
          <p>${s.descripcion}</p>
          <div class="precio-duracion">
            <span class="precio">Bs ${s.precio}</span>
            <span class="duracion"><i class="fa-regular fa-clock"></i> ${s.duracion}</span>
          </div>
          <button class="btn-reservar-mini" data-servicio="${s.nombre}">Reservar este servicio</button>
        </div>
      </div>`
      )
      .join("");

    // Llenar el <select> del formulario de reservas
    selectServicio.innerHTML =
      `<option value="">Selecciona un servicio</option>` +
      servicios.map((s) => `<option value="${s.nombre}">${s.nombre} - Bs ${s.precio}</option>`).join("");

    // Botones "Reservar este servicio" -> saltan al formulario y preseleccionan
    document.querySelectorAll(".btn-reservar-mini").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectServicio.value = btn.dataset.servicio;
        document.getElementById("reservas").scrollIntoView({ behavior: "smooth" });
      });
    });
  } catch (err) {
    console.error("Error cargando servicios:", err);
  }
}

// ---------- Cargar GALERÍA / CARRUSEL ----------
let slideActual = 0;
let totalSlides = 0;

async function cargarGaleria() {
  try {
    const res = await fetch(`${API_BASE}/gallery`);
    const imagenes = await res.json();
    totalSlides = imagenes.length;

    const track = document.getElementById("carruselTrack");
    const puntos = document.getElementById("carruselPuntos");

    track.innerHTML = imagenes
      .map(
        (img) => `
      <div class="carrusel-slide">
        <img src="${img.url}" alt="${img.titulo}" loading="lazy">
        <div class="leyenda">${img.titulo}</div>
      </div>`
      )
      .join("");

    puntos.innerHTML = imagenes
      .map((_, i) => `<span data-index="${i}" class="${i === 0 ? "activo" : ""}"></span>`)
      .join("");

    puntos.querySelectorAll("span").forEach((punto) => {
      punto.addEventListener("click", () => irASlide(Number(punto.dataset.index)));
    });

    irASlide(0);
  } catch (err) {
    console.error("Error cargando galería:", err);
  }
}

function irASlide(index) {
  if (totalSlides === 0) return;
  slideActual = (index + totalSlides) % totalSlides;
  const track = document.getElementById("carruselTrack");
  track.style.transform = `translateX(-${slideActual * 100}%)`;

  document.querySelectorAll(".carrusel-puntos span").forEach((p, i) => {
    p.classList.toggle("activo", i === slideActual);
  });
}

document.getElementById("carruselPrev")?.addEventListener("click", () => irASlide(slideActual - 1));
document.getElementById("carruselNext")?.addEventListener("click", () => irASlide(slideActual + 1));

// Autoplay del carrusel
setInterval(() => irASlide(slideActual + 1), 5000);

// ---------- Formulario de RESERVAS ----------
const formReserva = document.getElementById("formReserva");
const mensajeForm = document.getElementById("mensajeForm");

formReserva?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const datos = {
    nombre: document.getElementById("nombre").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    servicio: document.getElementById("servicio").value,
    fecha: document.getElementById("fecha").value,
    hora: document.getElementById("hora").value,
    comentario: document.getElementById("comentario").value.trim(),
  };

  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const data = await res.json();

    if (res.ok) {
      mensajeForm.textContent = "¡Reserva enviada con éxito! Te contactaremos pronto para confirmar.";
      mensajeForm.className = "mensaje-form ok";
      formReserva.reset();
    } else {
      mensajeForm.textContent = data.error || "Ocurrió un error al enviar la reserva.";
      mensajeForm.className = "mensaje-form error";
    }
  } catch (err) {
    mensajeForm.textContent = "No se pudo conectar con el servidor. Intenta nuevamente.";
    mensajeForm.className = "mensaje-form error";
  }
});

// ---------- Fecha mínima = hoy ----------
const inputFecha = document.getElementById("fecha");
if (inputFecha) {
  const hoy = new Date().toISOString().split("T")[0];
  inputFecha.setAttribute("min", hoy);
}

// ---------- Inicialización ----------
cargarServicios();
cargarGaleria();
