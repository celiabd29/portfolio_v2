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
    if (!name || !icon || !category) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    const newSkill = new Skill({ name, icon, category });
    await newSkill.save();

    res.status(201).json({ message: "Compétence ajoutée avec succès !" });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la compétence :", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

module.exports = router;
