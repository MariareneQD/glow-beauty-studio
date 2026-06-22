// =======================================================
// Glow Beauty Studio - Panel de administración
// =======================================================
const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("gb_token");
}
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: "Bearer " + getToken() };
}

// =========================================================
// LOGIN (login.html)
// =========================================================
const formLogin = document.getElementById("formLogin");
if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const usuario = document.getElementById("usuario").value.trim();
    const clave = document.getElementById("clave").value;
    const errorLogin = document.getElementById("errorLogin");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("gb_token", data.token);
        localStorage.setItem("gb_usuario", data.usuario);
        window.location.href = "dashboard.html";
      } else {
        errorLogin.textContent = data.error || "Usuario o contraseña incorrectos.";
        errorLogin.style.display = "block";
      }
    } catch (err) {
      errorLogin.textContent = "No se pudo conectar con el servidor.";
      errorLogin.style.display = "block";
    }
  });
}

// =========================================================
// DASHBOARD (dashboard.html)
// =========================================================
const sidebar = document.querySelector(".sidebar");
if (sidebar) {
  // Verificar sesión activa
  (async function verificarSesion() {
    if (!getToken()) return window.location.href = "login.html";
    const res = await fetch(`${API_BASE}/auth/verificar`, { headers: authHeaders() });
    if (!res.ok) {
      localStorage.removeItem("gb_token");
      window.location.href = "login.html";
    }
  })();

  document.getElementById("nombreUsuario").textContent = localStorage.getItem("gb_usuario") || "admin";

  // ---- Navegación entre paneles ----
  const botonesMenu = document.querySelectorAll(".item-menu");
  const titulos = {
    panelResumen: "Resumen general",
    panelReservas: "Gestión de reservas",
    panelServicios: "Gestión de servicios",
    panelGaleria: "Galería de trabajos",
  };

  function mostrarPanel(idPanel) {
    document.querySelectorAll(".panel-seccion").forEach((p) => p.classList.remove("activo"));
    document.getElementById(idPanel).classList.add("activo");
    botonesMenu.forEach((b) => b.classList.toggle("activo", b.dataset.panel === idPanel));
    document.getElementById("tituloPanel").textContent = titulos[idPanel];
  }

  botonesMenu.forEach((btn) => btn.addEventListener("click", () => mostrarPanel(btn.dataset.panel)));
  document.querySelectorAll("[data-ir]").forEach((btn) =>
    btn.addEventListener("click", () => mostrarPanel(btn.dataset.ir))
  );

  // ---- Cerrar sesión ----
  document.getElementById("btnCerrarSesion").addEventListener("click", async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", headers: authHeaders() });
    localStorage.removeItem("gb_token");
    window.location.href = "login.html";
  });

  // ============================
  // RESERVAS
  // ============================
  let reservasCache = [];

  async function cargarReservas() {
    const res = await fetch(`${API_BASE}/bookings`, { headers: authHeaders() });
    reservasCache = await res.json();
    renderResumen();
    renderTablaReservas();
  }

  function renderResumen() {
    document.getElementById("totalReservas").textContent = reservasCache.length;
    document.getElementById("totalPendientes").textContent = reservasCache.filter((r) => r.estado === "pendiente").length;

    const tbody = document.getElementById("tablaResumenReservas");
    tbody.innerHTML = reservasCache
      .slice(0, 5)
      .map(
        (r) => `<tr>
          <td>${r.nombre}</td>
          <td>${r.servicio}</td>
          <td>${r.fecha} ${r.hora}</td>
          <td><span class="badge ${r.estado}">${r.estado}</span></td>
        </tr>`
      )
      .join("") || `<tr><td colspan="4" style="color:var(--texto-sec)">Aún no hay reservas.</td></tr>`;
  }

  function renderTablaReservas() {
    const filtro = document.getElementById("filtroEstado").value;
    const datos = filtro === "todos" ? reservasCache : reservasCache.filter((r) => r.estado === filtro);

    const tbody = document.getElementById("tablaReservas");
    tbody.innerHTML =
      datos
        .map(
          (r) => `<tr>
        <td>${r.nombre}</td>
        <td><a href="https://wa.me/${r.telefono.replace(/\D/g, "")}" target="_blank">${r.telefono}</a></td>
        <td>${r.servicio}</td>
        <td>${r.fecha}</td>
        <td>${r.hora}</td>
        <td><span class="badge ${r.estado}">${r.estado}</span></td>
        <td class="acciones-fila">
          ${r.estado !== "confirmada" ? `<button class="btn-admin exito peq" data-accion="confirmar" data-id="${r.id}"><i class="fa-solid fa-check"></i></button>` : ""}
          ${r.estado !== "cancelada" ? `<button class="btn-admin peligro peq" data-accion="cancelar" data-id="${r.id}"><i class="fa-solid fa-ban"></i></button>` : ""}
          <button class="btn-admin secundario peq" data-accion="eliminar" data-id="${r.id}"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`
        )
        .join("") || `<tr><td colspan="7" style="color:var(--texto-sec)">No hay reservas con este filtro.</td></tr>`;

    tbody.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => manejarAccionReserva(btn.dataset.accion, btn.dataset.id));
    });
  }

  async function manejarAccionReserva(accion, id) {
    if (accion === "confirmar") {
      await fetch(`${API_BASE}/bookings/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ estado: "confirmada" }) });
    } else if (accion === "cancelar") {
      await fetch(`${API_BASE}/bookings/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ estado: "cancelada" }) });
    } else if (accion === "eliminar") {
      if (!confirm("¿Eliminar esta reserva permanentemente?")) return;
      await fetch(`${API_BASE}/bookings/${id}`, { method: "DELETE", headers: authHeaders() });
    }
    cargarReservas();
  }

  document.getElementById("filtroEstado").addEventListener("change", renderTablaReservas);

  // ============================
  // SERVICIOS
  // ============================
  async function cargarServiciosAdmin() {
    const res = await fetch(`${API_BASE}/services`);
    const servicios = await res.json();
    document.getElementById("totalServicios").textContent = servicios.length;

    const grid = document.getElementById("gridServiciosAdmin");
    grid.innerHTML = servicios
      .map(
        (s) => `
      <div class="card-servicio-admin">
        <img src="${s.imagen}" alt="${s.nombre}">
        <div class="contenido">
          <h4>${s.nombre}</h4>
          <p>${s.descripcion}</p>
          <span class="precio-admin">Bs ${s.precio}</span> · <span style="color:var(--texto-sec);font-size:.82rem">${s.duracion}</span>
          <div class="botones-card">
            <button class="btn-admin secundario peq" data-editar="${s.id}"><i class="fa-solid fa-pen"></i> Editar</button>
            <button class="btn-admin peligro peq" data-eliminar="${s.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>`
      )
      .join("");

    grid.querySelectorAll("[data-editar]").forEach((btn) =>
      btn.addEventListener("click", () => abrirModalServicio(servicios.find((s) => s.id === btn.dataset.editar)))
    );
    grid.querySelectorAll("[data-eliminar]").forEach((btn) =>
      btn.addEventListener("click", () => eliminarServicio(btn.dataset.eliminar))
    );
  }

  function abrirModalServicio(servicio) {
    document.getElementById("tituloModalServicio").textContent = servicio ? "Editar servicio" : "Nuevo servicio";
    document.getElementById("servicioId").value = servicio?.id || "";
    document.getElementById("servicioNombre").value = servicio?.nombre || "";
    document.getElementById("servicioCategoria").value = servicio?.categoria || "";
    document.getElementById("servicioDescripcion").value = servicio?.descripcion || "";
    document.getElementById("servicioPrecio").value = servicio?.precio || "";
    document.getElementById("servicioDuracion").value = servicio?.duracion || "";
    document.getElementById("servicioImagen").value = servicio?.imagen || "";
    document.getElementById("modalServicio").classList.add("activo");
  }

  async function eliminarServicio(id) {
    if (!confirm("¿Eliminar este servicio?")) return;
    await fetch(`${API_BASE}/services/${id}`, { method: "DELETE", headers: authHeaders() });
    cargarServiciosAdmin();
  }

  document.getElementById("btnNuevoServicio").addEventListener("click", () => abrirModalServicio(null));

  document.getElementById("formServicio").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("servicioId").value;
    const payload = {
      nombre: document.getElementById("servicioNombre").value,
      categoria: document.getElementById("servicioCategoria").value,
      descripcion: document.getElementById("servicioDescripcion").value,
      precio: document.getElementById("servicioPrecio").value,
      duracion: document.getElementById("servicioDuracion").value,
      imagen: document.getElementById("servicioImagen").value,
    };

    if (id) {
      await fetch(`${API_BASE}/services/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
    } else {
      await fetch(`${API_BASE}/services`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
    }
    document.getElementById("modalServicio").classList.remove("activo");
    cargarServiciosAdmin();
  });

  // ============================
  // GALERÍA
  // ============================
  async function cargarGaleriaAdmin() {
    const res = await fetch(`${API_BASE}/gallery`);
    const imagenes = await res.json();
    document.getElementById("totalGaleria").textContent = imagenes.length;

    const grid = document.getElementById("gridGaleriaAdmin");
    grid.innerHTML = imagenes
      .map(
        (g) => `
      <div class="item-galeria-admin">
        <img src="${g.url}" alt="${g.titulo}">
        <div class="overlay-galeria">
          <span>${g.titulo}</span>
          <button class="btn-admin peligro peq" data-eliminar-img="${g.id}"><i class="fa-solid fa-trash"></i> Eliminar</button>
        </div>
      </div>`
      )
      .join("");

    grid.querySelectorAll("[data-eliminar-img]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("¿Eliminar esta imagen de la galería?")) return;
        await fetch(`${API_BASE}/gallery/${btn.dataset.eliminarImg}`, { method: "DELETE", headers: authHeaders() });
        cargarGaleriaAdmin();
      })
    );
  }

  document.getElementById("btnNuevaImagen").addEventListener("click", () => {
    document.getElementById("modalGaleria").classList.add("activo");
  });

  document.getElementById("formGaleria").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      url: document.getElementById("galeriaUrl").value,
      titulo: document.getElementById("galeriaTitulo").value,
    };
    await fetch(`${API_BASE}/gallery`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
    document.getElementById("formGaleria").reset();
    document.getElementById("modalGaleria").classList.remove("activo");
    cargarGaleriaAdmin();
  });

  // ---- Cerrar modales ----
  document.querySelectorAll("[data-cerrar]").forEach((btn) =>
    btn.addEventListener("click", () => document.getElementById(btn.dataset.cerrar).classList.remove("activo"))
  );

  // ---- Inicialización ----
  cargarReservas();
  cargarServiciosAdmin();
  cargarGaleriaAdmin();
}
