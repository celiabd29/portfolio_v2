import rateLimit from "express-rate-limit";

// Limite stricte pour les routes d'administration (écritures sensibles).
// 20 requêtes par 15 minutes et par IP.
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Trop de requêtes, réessayez plus tard." },
});

// Limite pour le formulaire de contact public.
// 10 envois par 15 minutes et par IP.
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Trop de messages envoyés, réessayez plus tard." },
});
