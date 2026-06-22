const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { readData, writeData } = require("../utils/db");
const { verificarToken } = require("../middleware/auth");

// GET /api/services  (público)
router.get("/", (req, res) => {
  res.json(readData("services.json"));
});

// POST /api/services  (admin)
router.post("/", verificarToken, (req, res) => {
  const servicios = readData("services.json");
  const nuevo = {
    id: "srv-" + uuidv4().slice(0, 8),
    nombre: req.body.nombre,
    categoria: req.body.categoria,
    descripcion: req.body.descripcion,
    precio: Number(req.body.precio) || 0,
    duracion: req.body.duracion,
    imagen: req.body.imagen,
  };
  servicios.push(nuevo);
  writeData("services.json", servicios);
  res.status(201).json(nuevo);
});

// PUT /api/services/:id  (admin)
router.put("/:id", verificarToken, (req, res) => {
  const servicios = readData("services.json");
  const idx = servicios.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Servicio no encontrado." });

  servicios[idx] = { ...servicios[idx], ...req.body, precio: Number(req.body.precio) || servicios[idx].precio };
  writeData("services.json", servicios);
  res.json(servicios[idx]);
});

// DELETE /api/services/:id  (admin)
router.delete("/:id", verificarToken, (req, res) => {
  let servicios = readData("services.json");
  const existe = servicios.some((s) => s.id === req.params.id);
  if (!existe) return res.status(404).json({ error: "Servicio no encontrado." });

  servicios = servicios.filter((s) => s.id !== req.params.id);
  writeData("services.json", servicios);
  res.json({ ok: true });
});

module.exports = router;
