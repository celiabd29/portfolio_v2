import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import Skill from "../models/Skill.js";

const router = express.Router();

// Récupération du __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/skills/"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { nom, categorie } = req.body;
    const image = req.file ? req.file.filename : null;

    const newSkill = new Skill({ nom, image, categorie });
    await newSkill.save();

    res.status(201).json(newSkill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
