const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const servicesRoutes = require("./routes/services");
const galleryRoutes = require("./routes/gallery");
const bookingsRoutes = require("./routes/bookings");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ---- API ----
app.use("/api/auth", authRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/bookings", bookingsRoutes);

// ---- Frontend estático (sitio público + panel admin) ----
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_DIR));

app.get("/admin", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "admin", "login.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Glow Beauty corriendo en http://localhost:${PORT}`);
  console.log(`🔑 Panel admin en http://localhost:${PORT}/admin`);
});
