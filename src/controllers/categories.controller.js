import { pool } from "../db.js";

// Obtener todas las categorías
export const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error en getCategories:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Obtener una categoría por ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM categories WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Categoría no encontrada." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error en getCategoryById:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Crear una nueva categoría
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "El nombre es requerido." });
    }

    const result = await pool.query(
      "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
      [name, description || null]
    );

    res.status(201).json({
      message: "Categoría creada exitosamente.",
      category: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error en createCategory:", error);
    if (error.code === "23505") {
      return res.status(409).json({ message: "Ya existe una categoría con ese nombre." });
    }
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Actualizar una categoría
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const categoryCheck = await pool.query(
      "SELECT id FROM categories WHERE id = $1",
      [id]
    );
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ message: "Categoría no encontrada." });
    }

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No hay campos para actualizar." });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE categories SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    res.json({
      message: "Categoría actualizada exitosamente.",
      category: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error en updateCategory:", error);
    if (error.code === "23505") {
      return res.status(409).json({ message: "Ya existe una categoría con ese nombre." });
    }
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Eliminar una categoría
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const categoryCheck = await pool.query(
      "SELECT id FROM categories WHERE id = $1",
      [id]
    );
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ message: "Categoría no encontrada." });
    }

    // Verificar si hay productos usando esta categoría
    const productsCheck = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE category_id = $1",
      [id]
    );

    if (parseInt(productsCheck.rows[0].count) > 0) {
      return res.status(409).json({
        message: "No se puede eliminar la categoría porque hay productos asociados.",
      });
    }

    await pool.query("DELETE FROM categories WHERE id = $1", [id]);

    res.json({ message: "Categoría eliminada exitosamente." });
  } catch (error) {
    console.error("❌ Error en deleteCategory:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

