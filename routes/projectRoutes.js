import express from "express";
import multer from "multer";
import Project from "../models/Project.js";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurer multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ➕ Route POST pour ajouter un projet
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { title, description, technologies, link, category } = req.body;
    const image = req.file.filename;

    const newProject = new Project({
      title,
      description,
      technologies,
      link,
      category,
      image,
    });

    await newProject.save();
    res.status(201).json({ message: "✅ Projet ajouté !" });
  } catch (error) {
    console.error("❌ Erreur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
// ➕ Route pour modifier un projet
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, description, technologies, link, category } = req.body;
    const updatedData = {
      title,
      description,
      technologies,
      link,
      category,
    };

    if (req.file) {
      updatedData.image = req.file.filename;
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
      }
    );

    res.json({ message: "✅ Projet mis à jour", project });
  } catch (error) {
    console.error("❌ Erreur de mise à jour :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// DELETE un projet par ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Project.findByIdAndDelete(id);
    res.status(200).json({ message: "✅ Projet supprimé avec succès !" });
  } catch (error) {
    console.error("❌ Erreur suppression :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
