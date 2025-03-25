import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

// ➜ Route pour envoyer un message
router.post("/send", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    res.status(201).json({ message: "Message envoyé avec succès !" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ➜ Route pour récupérer les messages (optionnel, si tu veux les afficher sur un dashboard)
router.get("/", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
