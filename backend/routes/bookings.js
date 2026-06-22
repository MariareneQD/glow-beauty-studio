const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { readData, writeData } = require("../utils/db");
const { verificarToken } = require("../middleware/auth");

// POST /api/bookings (público) - crear una reserva desde el formulario del sitio
router.post("/", (req, res) => {
  const { nombre, telefono, servicio, fecha, hora, comentario } = req.body;

  if (!nombre || !telefono || !servicio || !fecha || !hora) {
    return res.status(400).json({ error: "Completa todos los campos obligatorios." });
  }

  const reservas = readData("bookings.json");
  const nueva = {
    id: "res-" + uuidv4().slice(0, 8),
    nombre,
    telefono,
    servicio,
    fecha,
    hora,
    comentario: comentario || "",
    estado: "pendiente",
    creado: new Date().toISOString(),
  };
  reservas.push(nueva);
  writeData("bookings.json", reservas);
  res.status(201).json(nueva);
});

// GET /api/bookings (admin) - listar todas las reservas
router.get("/", verificarToken, (req, res) => {
  const reservas = readData("bookings.json").sort(
    (a, b) => new Date(b.creado) - new Date(a.creado)
  );
  res.json(reservas);
});

// PUT /api/bookings/:id (admin) - actualizar estado (pendiente/confirmada/cancelada)
router.put("/:id", verificarToken, (req, res) => {
  const reservas = readData("bookings.json");
  const idx = reservas.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Reserva no encontrada." });

  reservas[idx].estado = req.body.estado || reservas[idx].estado;
  writeData("bookings.json", reservas);
  res.json(reservas[idx]);
});

// DELETE /api/bookings/:id (admin)
router.delete("/:id", verificarToken, (req, res) => {
  let reservas = readData("bookings.json");
  const existe = reservas.some((r) => r.id === req.params.id);
  if (!existe) return res.status(404).json({ error: "Reserva no encontrada." });

  reservas = reservas.filter((r) => r.id !== req.params.id);
  writeData("bookings.json", reservas);
  res.json({ ok: true });
});

module.exports = router;
