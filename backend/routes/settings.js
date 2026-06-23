const express = require("express");
const router = express.Router();
const { readData, writeData } = require("../utils/db");
const { verificarToken } = require("../middleware/auth");

// GET /api/settings (público) - el frontend lo usa para mostrar whatsapp, horario, redes, etc.
router.get("/", (req, res) => {
  res.json(readData("settings.json"));
});

// PUT /api/settings (admin) - actualizar configuración general
router.put("/", verificarToken, (req, res) => {
  const actual = readData("settings.json");
  const actualizado = { ...actual, ...req.body };
  writeData("settings.json", actualizado);
  res.json(actualizado);
});

module.exports = router;
