// Route Express de Bip, l'assistant IA du portfolio.
// Dépendances : @anthropic-ai/sdk, express-rate-limit
// Variable d'environnement requise : ANTHROPIC_API_KEY (jamais côté front)
import express from "express";
import rateLimit from "express-rate-limit";
import Anthropic from "@anthropic-ai/sdk";
import { BIP_CONTEXT } from "./bip-context.js";

const router = express.Router();
const client = new Anthropic();
const MODEL = process.env.BIP_MODEL || "claude-haiku-4-5";
const MAX_LEN = 300;

// 10 questions par minute et par IP, pour protéger la clé API
const limiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Trop de questions d'un coup, réessaie dans une minute." },
});

router.post("/ask", limiter, async (req, res) => {
  const raw = req.body?.question;
  const question = typeof raw === "string" ? raw.trim().slice(0, MAX_LEN) : "";
  if (!question) return res.status(400).json({ error: "Question manquante" });

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 350,
      system: BIP_CONTEXT,
      messages: [{ role: "user", content: question }],
    });
    const answer = msg.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    res.json({ answer });
  } catch (err) {
    console.error("[bip]", err.status ?? "", err.message);
    res.status(502).json({ error: "Bip est indisponible pour le moment." });
  }
});

export default router;
