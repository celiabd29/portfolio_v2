import express from "express";
import multer from "multer";
import Skill from "../models/Skill.js";
import adminAuth from "../middleware/adminAuth.js";
import { adminLimiter } from "../middleware/rateLimit.js";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📂 Configurer multer pour les uploads d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

// 📥 GET - Récupérer toutes les compétences
router.get("/", async (req, res) => {
  try {
    const skills = await Skill.find();
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ➕ POST - Ajouter une compétence
router.post("/add", adminLimiter, adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { name, category } = req.body;
    const image = req.file.filename;

    const newSkill = new Skill({
      name,
      category,
      image,
    });

    await newSkill.save();
    res.status(201).json({ message: "✅ Compétence ajoutée !" });
  } catch (error) {
    console.error("❌ Erreur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🔄 PUT - Modifier une compétence
router.put("/:id", adminLimiter, adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { name, category } = req.body;
    const updatedData = { name, category };

    if (req.file) {
      updatedData.image = req.file.filename;
    }

    const skill = await Skill.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });

    res.json({ message: "✅ Compétence mise à jour", skill });
  } catch (error) {
    console.error("❌ Erreur de mise à jour :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ❌ DELETE - Supprimer une compétence
router.delete("/:id", adminLimiter, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await Skill.findByIdAndDelete(id);
    res.status(200).json({ message: "✅ Compétence supprimée avec succès !" });
  } catch (error) {
    console.error("❌ Erreur suppression :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
