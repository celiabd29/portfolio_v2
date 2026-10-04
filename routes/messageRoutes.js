import express from "express";
import Message from "../models/Message.js";
import adminAuth from "../middleware/adminAuth.js";
import { adminLimiter, contactLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// Validation simple de l'email
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = { name: 100, email: 150, message: 2000 };

// ➜ Envoi d'un message (public) : rate limit + validation des champs
router.post("/send", contactLimiter, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const message =
    typeof req.body?.message === "string" ? req.body.message.trim() : "";

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }
  if (
    name.length > MAX.name ||
    email.length > MAX.email ||
    message.length > MAX.message
  ) {
    return res.status(400).json({ error: "Un ou plusieurs champs sont trop longs" });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Adresse email invalide" });
  }

  try {
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    res.status(201).json({ message: "Message envoyé avec succès !" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ➜ Lecture des messages (administration uniquement)
router.get("/", adminLimiter, adminAuth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Marquer comme lu ou non lu (administration)
router.put("/:id/read", adminLimiter, adminAuth, async (req, res) => {
  try {
    const { isRead } = req.body;
    const updated = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Supprimer un message (administration)
router.delete("/:id", adminLimiter, adminAuth, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Message supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
