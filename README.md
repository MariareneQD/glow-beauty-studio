# Glow Beauty Studio — Sitio web con Backend y Frontend

Sitio web completo para una tienda/salón de belleza, con backend en Node.js + Express y frontend en HTML/CSS/JS, incluyendo panel de administración independiente.

## 📁 Estructura

```
glow-beauty/
├── backend/
│   ├── server.js          # Servidor Express (API + sirve el frontend)
│   ├── package.json
│   ├── data/               # "Base de datos" en JSON (servicios, reservas, galería, admin)
│   ├── routes/              # Rutas de la API (auth, services, gallery, bookings)
│   ├── middleware/auth.js   # Autenticación por token para el panel admin
│   └── utils/db.js
└── frontend/
    ├── index.html           # Sitio público
    ├── css/style.css
    ├── js/main.js
    └── admin/                # Panel de administración (independiente)
        ├── login.html
        ├── dashboard.html
        ├── css/admin.css
        └── js/admin.js
```

## 🚀 Cómo ejecutar

```bash
cd backend
npm install
npm start
```

- Sitio público: **http://localhost:3000**
- Panel de administración: **http://localhost:3000/admin**

## 🔑 Credenciales de administrador (demo)

```
Usuario: admin
Contraseña: admin123
```

Cámbialas editando `backend/data/admin.json`. Para producción real, se recomienda:
- Usar contraseñas con hash (bcrypt) en lugar de texto plano.
- Usar JWT con expiración o sesiones respaldadas por base de datos en vez del almacenamiento de tokens en memoria.
- Migrar de archivos JSON a una base de datos real (PostgreSQL, MongoDB, etc.) si el negocio crece.

## ✨ Funcionalidades incluidas

**Sitio público**
- Header fijo con navegación y menú móvil.
- Hero con llamada a la acción (reservar / WhatsApp).
- Sección de **Servicios** (cargados dinámicamente desde el backend).
- **Carrusel de galería** con resultados de trabajos realizados (autoplay, flechas, puntos).
- Sección **Sobre nosotros**.
- Formulario de **Reservas** conectado a la API (guarda en el backend).
- Botón de reserva directa por **WhatsApp**.
- Sección de **Ubicación** con paleta morado/negro y mapa embebido.
- Sección de **Contacto** con WhatsApp, correo, teléfono y redes sociales.
- Botón flotante de WhatsApp.
- Footer completo.

**Panel de administración** (`/admin`)
- Login protegido.
- Dashboard con resumen general (reservas, pendientes, servicios, imágenes).
- Gestión de **reservas**: confirmar, cancelar, eliminar, filtrar por estado.
- Gestión de **servicios**: crear, editar, eliminar (con imagen, precio, duración).
- Gestión de **galería**: agregar o eliminar imágenes de trabajos realizados.

## 🖼️ Imágenes

Las imágenes de muestra provienen de Unsplash (uso libre). Puedes reemplazarlas por fotos reales de tu salón agregándolas desde el panel de administración o editando los archivos en `backend/data/`.

## 📞 Personalización rápida

- Número de WhatsApp: reemplaza `59100000000` en `frontend/index.html`.
- Redes sociales: edita los enlaces en la sección de contacto y footer.
- Mapa: cambia la dirección en el `src` del `iframe` de la sección de ubicación.
- Colores: variables CSS al inicio de `frontend/css/style.css` (`--morado-*`, `--negro`, `--dorado`).
