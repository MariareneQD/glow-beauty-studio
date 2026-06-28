const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { readData, writeData } = require("../utils/db");
const { verificarToken } = require("../middleware/auth");

// GET /api/gallery (público)
router.get("/", (req, res) => {
  res.json(readData("gallery.json"));
});

// POST /api/gallery (admin) - agrega imagen por URL
router.post("/", verificarToken, (req, res) => {
  const galeria = readData("gallery.json");
  const nueva = {
    id: "gal-" + uuidv4().slice(0, 8),
    url: req.body.url,
    titulo: req.body.titulo || "Trabajo realizado",
  };
  galeria.push(nueva);
  writeData("gallery.json", galeria);
  res.status(201).json(nueva);
});

// PUT /api/gallery/:id (admin) - reemplazar imagen/título existente
router.put("/:id", verificarToken, (req, res) => {
  const galeria = readData("gallery.json");
  const idx = galeria.findIndex((g) => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Imagen no encontrada." });

  galeria[idx] = {
    ...galeria[idx],
    url: req.body.url || galeria[idx].url,
    titulo: req.body.titulo || galeria[idx].titulo,
  };
  writeData("gallery.json", galeria);
  res.json(galeria[idx]);
});

// DELETE /api/gallery/:id (admin)
router.delete("/:id", verificarToken, (req, res) => {
  let galeria = readData("gallery.json");
  const existe = galeria.some((g) => g.id === req.params.id);
  if (!existe) return res.status(404).json({ error: "Imagen no encontrada." });

  galeria = galeria.filter((g) => g.id !== req.params.id);
  writeData("gallery.json", galeria);
  res.json({ ok: true });
});

module.exports = router;
