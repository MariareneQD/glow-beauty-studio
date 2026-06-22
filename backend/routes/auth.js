const express = require("express");
const router = express.Router();
const { readData } = require("../utils/db");
const { crearSesion, cerrarSesion, verificarToken } = require("../middleware/auth");

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { usuario, clave } = req.body;
  const admin = readData("admin.json");

  if (usuario === admin.usuario && clave === admin.clave) {
    const token = crearSesion();
    return res.json({ token, usuario: admin.usuario });
  }
  return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
});

// POST /api/auth/logout
router.post("/logout", verificarToken, (req, res) => {
  const token = req.headers["authorization"].slice(7);
  cerrarSesion(token);
  res.json({ ok: true });
});

// GET /api/auth/verificar  -> usado por el panel para saber si la sesión sigue activa
router.get("/verificar", verificarToken, (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
