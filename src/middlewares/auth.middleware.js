import { verifyToken } from "../libs/jwrt.js";
import { pool } from "../db.js";

// Middleware para validar JWT tokens
export const authRequired = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: "Token de acceso requerido." });
    }

    const decoded = await verifyToken(token);
    req.user = decoded; // Agregar información del usuario al request
    next();
  } catch (error) {
    console.error("❌ Error en authRequired:", error);
    return res.status(403).json({ message: "Token inválido o expirado." });
  }
};

// Middleware para verificar que el usuario es admin
export const adminRequired = async (req, res, next) => {
  try {
    // Primero verificar que está autenticado
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Autenticación requerida." });
    }

    // Consultar si el usuario es admin
    const result = await pool.query(
      "SELECT is_admin FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    if (!result.rows[0].is_admin) {
      return res.status(403).json({ message: "Acceso denegado. Se requiere permisos de administrador." });
    }

    next();
  } catch (error) {
    console.error("❌ Error en adminRequired:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Middleware para validar esquemas (ya existía)
export const validateSchema = (schema) => async (req, res, next) => {
  try {
    await schema.parse(req.body);
    next();
  } catch (error) {
    console.log(error)
    return res.status(400).json({ message: error.errors[0].message });
  }
};