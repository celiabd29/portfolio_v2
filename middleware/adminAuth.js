import crypto from "crypto";

// Authentification des routes d'administration.
// Token statique dans la variable d'environnement ADMIN_TOKEN, envoyé par le
// front dans l'en-tête "Authorization: Bearer <token>".
// Comparaison à temps constant (timingSafeEqual) sur des empreintes de taille
// fixe, pour éviter les attaques temporelles et ne pas fuiter la longueur.
const sha256 = (value) =>
  crypto.createHash("sha256").update(String(value)).digest();

export default function adminAuth(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  // Aucun token admin configuré : on refuse par défaut (fail closed).
  if (!expected) return res.status(401).json({ error: "Non autorisé" });

  const header = req.headers.authorization || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  const match = crypto.timingSafeEqual(sha256(provided), sha256(expected));
  if (!match) return res.status(401).json({ error: "Non autorisé" });

  next();
}
