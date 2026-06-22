// Almacen de tokens en memoria (suficiente para una demo / panel admin único).
// En producción se recomienda usar JWT firmado o sesiones con expiración real en BD.
const sesionesActivas = new Set();

function generarToken() {
  return (
    Math.random().toString(36).slice(2) +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}

function crearSesion() {
  const token = generarToken();
  sesionesActivas.add(token);
  return token;
}

function cerrarSesion(token) {
  sesionesActivas.delete(token);
}

function verificarToken(req, res, next) {
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token || !sesionesActivas.has(token)) {
    return res.status(401).json({ error: "No autorizado. Inicia sesión nuevamente." });
  }
  next();
}

module.exports = { crearSesion, cerrarSesion, verificarToken };
