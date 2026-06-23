// =======================================================
// Glow Beauty Studio - Frontend público
// =======================================================
const API_BASE = "/api";

// Convierte cualquier número a formato wa.me (agrega código de Bolivia 591 si falta)
function formatearNumeroWhatsapp(numero) {
  let limpio = String(numero || "").replace(/\D/g, "");
  if (limpio.length === 8) limpio = "591" + limpio; // número local boliviano
  return limpio;
}

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

// ---------- Cargar CONFIGURACIÓN GENERAL (whatsapp, dirección, horario, redes) ----------
async function cargarConfiguracion() {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    const cfg = await res.json();
    const numero = formatearNumeroWhatsapp(cfg.whatsapp);

    // Todos los enlaces de WhatsApp del sitio
    document.querySelectorAll(".wa-link").forEach((el) => {
      const url = new URL(el.getAttribute("href"), window.location.origin);
      const textoParam = url.search ? url.search.replace("?text=", "") : "";
      el.setAttribute("href", `https://wa.me/${numero}${textoParam ? "?text=" + textoParam : ""}`);
    });

    if (document.getElementById("direccionTexto")) document.getElementById("direccionTexto").textContent = cfg.direccion;
    if (document.getElementById("direccionFooter")) document.getElementById("direccionFooter").textContent = cfg.direccion;
    if (document.getElementById("horarioTexto")) document.getElementById("horarioTexto").textContent = cfg.horario;
    if (document.getElementById("telefonoTexto1")) document.getElementById("telefonoTexto1").textContent = cfg.telefonoFijo;
    if (document.getElementById("telefonoTexto2")) document.getElementById("telefonoTexto2").textContent = cfg.telefonoFijo;
    if (document.getElementById("telefonoFooter")) document.getElementById("telefonoFooter").textContent = cfg.telefonoFijo;
    if (document.getElementById("correoTexto1")) document.getElementById("correoTexto1").textContent = cfg.correo;
    if (document.getElementById("correoFooter")) document.getElementById("correoFooter").textContent = cfg.correo;
    if (document.getElementById("correoLink")) document.getElementById("correoLink").setAttribute("href", "mailto:" + cfg.correo);
    if (document.getElementById("mapaIframe") && cfg.mapaUrl) document.getElementById("mapaIframe").src = cfg.mapaUrl;
    if (document.getElementById("redInstagram")) document.getElementById("redInstagram").setAttribute("href", cfg.instagram);
    if (document.getElementById("redFacebook")) document.getElementById("redFacebook").setAttribute("href", cfg.facebook);
    if (document.getElementById("redTiktok")) document.getElementById("redTiktok").setAttribute("href", cfg.tiktok);
  } catch (err) {
    console.error("Error cargando configuración:", err);
  }
}

// ---------- Cargar SERVICIOS desde el backend ----------
async function cargarServicios() {
  try {
    const res = await fetch(`${API_BASE}/services`);
    const servicios = await res.json();

    const grid = document.getElementById("gridServicios");
    const selectServicio = document.getElementById("servicio");

    grid.innerHTML = servicios
      .map((s) => {
        if (s.activo === false) {
          const fechaTexto = s.disponibleDesde
            ? `Disponible desde el ${formatearFecha(s.disponibleDesde)}`
            : "Próximamente disponible";
          return `
          <div class="tarjeta-servicio inactivo">
            <div class="img-servicio">
              <img src="${s.imagen}" alt="${s.nombre}" loading="lazy">
              <div class="cinta-no-disponible">No disponible</div>
            </div>
            <div class="info-servicio">
              <span class="categoria">${s.categoria}</span>
              <h3>${s.nombre}</h3>
              <p>${s.descripcion}</p>
              <div class="aviso-no-disponible">
                <i class="fa-regular fa-clock"></i> ${fechaTexto}
                ${s.nota ? `<br><span class="nota-servicio">${s.nota}</span>` : ""}
              </div>
              <button class="btn-reservar-mini deshabilitado" disabled>No disponible por el momento</button>
            </div>
          </div>`;
        }
        return `
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
      </div>`;
      })
      .join("");

    // Solo los servicios activos van al <select> del formulario de reservas
    const serviciosActivos = servicios.filter((s) => s.activo !== false);

    // Llenar el <select> del formulario de reservas
    selectServicio.innerHTML =
      `<option value="">Selecciona un servicio</option>` +
      serviciosActivos.map((s) => `<option value="${s.nombre}">${s.nombre} - Bs ${s.precio}</option>`).join("");

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

function formatearFecha(valor) {
  try {
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return valor;
    return fecha.toLocaleDateString("es-BO", { day: "numeric", month: "long", year: "numeric" }) +
      (valor.includes("T") ? " a las " + fecha.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" }) : "");
  } catch {
    return valor;
  }
}

// ---------- Inicialización ----------
cargarConfiguracion();
cargarServicios();
cargarGaleria();
