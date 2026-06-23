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
    panelConfiguracion: "Configuración general",
  };

  // Formatea cualquier número a formato wa.me (agrega código de Bolivia 591 si es un número local de 8 dígitos)
  function formatearNumeroWhatsapp(numero) {
    let limpio = String(numero || "").replace(/\D/g, "");
    if (limpio.length === 8) limpio = "591" + limpio;
    return limpio;
  }

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
    const pendientes = reservasCache.filter((r) => r.estado === "pendiente").length;
    document.getElementById("totalPendientes").textContent = pendientes;

    const badge = document.getElementById("badgePendientes");
    if (pendientes > 0) {
      badge.textContent = pendientes;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }

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
        .map((r) => {
          const numero = formatearNumeroWhatsapp(r.telefono);
          const mensaje = encodeURIComponent(
            `Hola ${r.nombre}, te escribimos de Glow Beauty Studio sobre tu reserva de "${r.servicio}" para el ${r.fecha} a las ${r.hora}.`
          );
          return `<tr>
        <td>${r.nombre}</td>
        <td>
          <a href="https://wa.me/${numero}?text=${mensaje}" target="_blank" class="btn-whatsapp-fila">
            <i class="fa-brands fa-whatsapp"></i> ${r.telefono}
          </a>
        </td>
        <td>${r.servicio}</td>
        <td>${r.fecha}</td>
        <td>${r.hora}</td>
        <td><span class="badge ${r.estado}">${r.estado}</span></td>
        <td class="acciones-fila">
          ${r.estado !== "confirmada" ? `<button class="btn-admin exito peq" data-accion="confirmar" data-id="${r.id}"><i class="fa-solid fa-check"></i></button>` : ""}
          ${r.estado !== "cancelada" ? `<button class="btn-admin peligro peq" data-accion="cancelar" data-id="${r.id}"><i class="fa-solid fa-ban"></i></button>` : ""}
          <button class="btn-admin secundario peq" data-accion="eliminar" data-id="${r.id}"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`;
        })
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

  document.getElementById("btnExportarCsv").addEventListener("click", () => {
    if (reservasCache.length === 0) return alert("No hay reservas para exportar.");

    const encabezados = ["Nombre", "Telefono", "Servicio", "Fecha", "Hora", "Estado", "Comentario", "Creado"];
    const filas = reservasCache.map((r) =>
      [r.nombre, r.telefono, r.servicio, r.fecha, r.hora, r.estado, r.comentario || "", r.creado]
        .map((campo) => `"${String(campo).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [encabezados.join(","), ...filas].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `reservas-glow-beauty-${new Date().toISOString().split("T")[0]}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  });

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
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
            <h4>${s.nombre}</h4>
            <span class="badge ${s.activo === false ? "cancelada" : "confirmada"}">${s.activo === false ? "Inactivo" : "Activo"}</span>
          </div>
          <p>${s.descripcion}</p>
          <span class="precio-admin">Bs ${s.precio}</span> · <span style="color:var(--texto-sec);font-size:.82rem">${s.duracion}</span>
          ${s.activo === false && s.disponibleDesde ? `<p style="color:var(--texto-sec);font-size:.78rem;margin-top:8px;"><i class="fa-regular fa-clock"></i> Vuelve: ${new Date(s.disponibleDesde).toLocaleString("es-BO")}</p>` : ""}
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

    const activo = servicio ? servicio.activo !== false : true;
    document.getElementById("servicioActivo").checked = activo;
    document.getElementById("servicioDisponibleDesde").value = servicio?.disponibleDesde || "";
    document.getElementById("servicioNota").value = servicio?.nota || "";
    document.getElementById("bloqueInactivo").style.display = activo ? "none" : "block";

    document.getElementById("modalServicio").classList.add("activo");
  }

  document.getElementById("servicioActivo").addEventListener("change", (e) => {
    document.getElementById("bloqueInactivo").style.display = e.target.checked ? "none" : "block";
  });

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
      activo: document.getElementById("servicioActivo").checked,
      disponibleDesde: document.getElementById("servicioDisponibleDesde").value,
      nota: document.getElementById("servicioNota").value,
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
          <div style="display:flex;gap:8px;">
            <button class="btn-admin secundario peq" data-editar-img="${g.id}"><i class="fa-solid fa-pen"></i> Reemplazar</button>
            <button class="btn-admin peligro peq" data-eliminar-img="${g.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>`
      )
      .join("");

    grid.querySelectorAll("[data-editar-img]").forEach((btn) =>
      btn.addEventListener("click", () => abrirModalGaleria(imagenes.find((g) => g.id === btn.dataset.editarImg)))
    );

    grid.querySelectorAll("[data-eliminar-img]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("¿Eliminar esta imagen de la galería?")) return;
        await fetch(`${API_BASE}/gallery/${btn.dataset.eliminarImg}`, { method: "DELETE", headers: authHeaders() });
        cargarGaleriaAdmin();
      })
    );
  }

  function abrirModalGaleria(imagen) {
    document.getElementById("tituloModalGaleria").textContent = imagen ? "Reemplazar imagen" : "Agregar imagen a la galería";
    document.getElementById("btnGuardarGaleria").textContent = imagen ? "Guardar cambios" : "Agregar";
    document.getElementById("galeriaId").value = imagen?.id || "";
    document.getElementById("galeriaUrl").value = imagen?.url || "";
    document.getElementById("galeriaTitulo").value = imagen?.titulo || "";
    document.getElementById("modalGaleria").classList.add("activo");
  }

  document.getElementById("btnNuevaImagen").addEventListener("click", () => abrirModalGaleria(null));

  document.getElementById("formGaleria").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("galeriaId").value;
    const payload = {
      url: document.getElementById("galeriaUrl").value,
      titulo: document.getElementById("galeriaTitulo").value,
    };

    if (id) {
      await fetch(`${API_BASE}/gallery/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
    } else {
      await fetch(`${API_BASE}/gallery`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
    }
    document.getElementById("formGaleria").reset();
    document.getElementById("modalGaleria").classList.remove("activo");
    cargarGaleriaAdmin();
  });

  // ============================
  // CONFIGURACIÓN GENERAL
  // ============================
  async function cargarConfiguracionAdmin() {
    const res = await fetch(`${API_BASE}/settings`);
    const cfg = await res.json();
    document.getElementById("cfgNombre").value = cfg.nombreNegocio || "";
    document.getElementById("cfgWhatsapp").value = cfg.whatsapp || "";
    document.getElementById("cfgTelefonoFijo").value = cfg.telefonoFijo || "";
    document.getElementById("cfgCorreo").value = cfg.correo || "";
    document.getElementById("cfgDireccion").value = cfg.direccion || "";
    document.getElementById("cfgHorario").value = cfg.horario || "";
    document.getElementById("cfgMapaUrl").value = cfg.mapaUrl || "";
    document.getElementById("cfgInstagram").value = cfg.instagram || "";
    document.getElementById("cfgFacebook").value = cfg.facebook || "";
    document.getElementById("cfgTiktok").value = cfg.tiktok || "";
  }

  document.getElementById("formConfiguracion").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      nombreNegocio: document.getElementById("cfgNombre").value,
      whatsapp: document.getElementById("cfgWhatsapp").value,
      telefonoFijo: document.getElementById("cfgTelefonoFijo").value,
      correo: document.getElementById("cfgCorreo").value,
      direccion: document.getElementById("cfgDireccion").value,
      horario: document.getElementById("cfgHorario").value,
      mapaUrl: document.getElementById("cfgMapaUrl").value,
      instagram: document.getElementById("cfgInstagram").value,
      facebook: document.getElementById("cfgFacebook").value,
      tiktok: document.getElementById("cfgTiktok").value,
    };
    const mensaje = document.getElementById("mensajeConfig");
    try {
      const res = await fetch(`${API_BASE}/settings`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
      if (res.ok) {
        mensaje.textContent = "Cambios guardados correctamente. Ya se reflejan en el sitio público.";
        mensaje.className = "mensaje-config ok";
      } else {
        mensaje.textContent = "Ocurrió un error al guardar los cambios.";
        mensaje.className = "mensaje-config error";
      }
    } catch {
      mensaje.textContent = "No se pudo conectar con el servidor.";
      mensaje.className = "mensaje-config error";
    }
  });

  document.getElementById("formPassword").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      claveActual: document.getElementById("pwdActual").value,
      nuevoUsuario: document.getElementById("pwdUsuario").value,
      nuevaClave: document.getElementById("pwdNueva").value,
    };
    const mensaje = document.getElementById("mensajePassword");
    try {
      const res = await fetch(`${API_BASE}/auth/password`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        mensaje.textContent = "Contraseña actualizada correctamente.";
        mensaje.className = "mensaje-config ok";
        document.getElementById("formPassword").reset();
      } else {
        mensaje.textContent = data.error || "No se pudo cambiar la contraseña.";
        mensaje.className = "mensaje-config error";
      }
    } catch {
      mensaje.textContent = "No se pudo conectar con el servidor.";
      mensaje.className = "mensaje-config error";
    }
  });

  // ---- Cerrar modales ----
  document.querySelectorAll("[data-cerrar]").forEach((btn) =>
    btn.addEventListener("click", () => document.getElementById(btn.dataset.cerrar).classList.remove("activo"))
  );

  // ---- Inicialización ----
  cargarReservas();
  cargarServiciosAdmin();
  cargarGaleriaAdmin();
  cargarConfiguracionAdmin();
}
