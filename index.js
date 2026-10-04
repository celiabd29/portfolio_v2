import "dotenv/config"; // charge .env avant tout autre import (ex. client Anthropic de bipRoutes)
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import User from "./models/User.js";
import Skill from "./models/Skill.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import projectRoutes from "./routes/projectRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import bipRoutes from "./routes/bipRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import adminAuth from "./middleware/adminAuth.js";
import { adminLimiter } from "./middleware/rateLimit.js";
import path from "path";
import { fileURLToPath } from "url";

// Pour récupérer le bon __dirname (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Render est derrière un proxy : nécessaire pour le rate limit par IP (Bip)
app.set("trust proxy", 1);

// En-têtes de sécurité. On autorise le chargement cross-origin des ressources
// (les images de /uploads sont servies au front, sur un autre domaine).
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS limité aux domaines autorisés (variable ALLOWED_ORIGINS, séparés par des virgules).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      // Requêtes sans origine (curl, same-origin, health checks) autorisées.
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Origine non autorisée par CORS"));
    },
  })
);

// Middleware
app.use(express.json({ limit: "4kb" })); // Pour traiter les JSON (payload limité)
app.use(express.urlencoded({ extended: true, limit: "4kb" })); // formulaires (taille limitée)
// Utilisation des routes
app.use("/skills", skillRoutes);
app.use("/messages", messageRoutes);
app.use("/bip", bipRoutes); // => POST /bip/ask
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/projects", projectRoutes);

const JWT_SECRET = process.env.JWT_SECRET;

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connecté à MongoDB Atlas");
  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB :", error);
    process.exit(1);
  }
};

connectDB();

// ✅ Route de santé : réveille le serveur Render (pas d'auth, pas de DB)
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

// ✅ Route de test
app.get("/", (req, res) => {
  res.send("🚀 Backend Portfolio fonctionne !");
});

// Route d'inscription (réservée à l'administration : pas d'inscription publique)
app.post("/register", adminLimiter, adminAuth, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Cet email est déjà utilisé." });

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "✅ Utilisateur créé !" });
  } catch (error) {
    console.error("❌ Erreur d'inscription :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route de connexion
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Utilisateur introuvable." });

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(400).json({ message: "Mot de passe incorrect." });

    // Générer un token JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "✅ Connexion réussie", token });
  } catch (error) {
    console.error("❌ Erreur de connexion :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route protégée (profil utilisateur)
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user)
      return res.status(404).json({ message: "Utilisateur introuvable." });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Routes API : Préfixe `/api`
app.get("/api/users", adminLimiter, adminAuth, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Route pour créer un utilisateur
app.post("/api/users", adminLimiter, adminAuth, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Tous les champs sont obligatoires." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // Mot de passe toujours haché avant stockage (jamais en clair).
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Utilisateur créé avec succès !" });
  } catch (error) {
    console.error("❌ Erreur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ➤ Route pour récupérer toutes les compétences
app.get("/skills", async (req, res) => {
  try {
    const skills = await Skill.find();
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ➤ Route pour ajouter une compétence (administration)
app.post("/skills", adminLimiter, adminAuth, async (req, res) => {
  try {
    const { category, name, icon } = req.body;
    if (!category || !name || !icon) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    const newSkill = new Skill({ category, name, icon });
    await newSkill.save();

    res.status(201).json({ message: "✅ Compétence ajoutée avec succès !" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Gestion centralisée des erreurs : jamais de stack trace en production.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  const payload = { error: status === 500 ? "Erreur serveur" : err.message };
  if (process.env.NODE_ENV !== "production" && status === 500) {
    payload.detail = err.message;
  }
  res.status(status).json(payload);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});

// Empêche les timeouts précoces sur Render
server.keepAliveTimeout = 120 * 1000;

server.headersTimeout = 120 * 1000;
// Exporter l'app pour Vercel
export default app;
