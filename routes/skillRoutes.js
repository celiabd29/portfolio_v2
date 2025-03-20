const express = require("express");
const router = express.Router();
const Skill = require("../models/Skill");

// Tester si la route fonctionne
router.get("/", async (req, res) => {
  try {
    const skills = await Skill.find();
    res.json(skills);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des compétences" });
  }
});

// Route pour ajouter une compétence
router.post("/add", async (req, res) => {
  try {
    const { name, icon, category } = req.body;
    const newSkill = new Skill({ name, icon, category });
    await newSkill.save();
    res.status(201).json({ message: "Compétence ajoutée avec succès !" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'ajout de la compétence" });
  }
});

module.exports = router;
