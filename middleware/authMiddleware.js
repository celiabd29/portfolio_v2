import jwt from "jsonwebtoken";

// Middleware pour protéger les routes d'écriture (POST/PUT/DELETE).
// Réutilise le même système JWT que la route /profile.
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Accès refusé" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token invalide" });
  }
};

export default authMiddleware;
