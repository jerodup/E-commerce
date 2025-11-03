import { pool } from "../db.js";

// Obtener todos los productos con sus categorías, imágenes y variantes
export const getProducts = async (req, res) => {
  try {
    const { category_id, is_active } = req.query;

    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.category_id,
        p.is_active,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        u.username as created_by_username
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (category_id) {
      query += ` AND p.category_id = $${paramCount}`;
      params.push(category_id);
      paramCount++;
    }

    if (is_active !== undefined) {
      query += ` AND p.is_active = $${paramCount}`;
      params.push(is_active === 'true');
      paramCount++;
    }

    query += ` ORDER BY p.created_at DESC`;

    const productsResult = await pool.query(query, params);

    // Para cada producto, obtener sus imágenes y variantes
    const productsWithDetails = await Promise.all(
      productsResult.rows.map(async (product) => {
        // Obtener imágenes
        const imagesResult = await pool.query(
          "SELECT id, image_url, is_primary, display_order FROM product_images WHERE product_id = $1 ORDER BY display_order, created_at",
          [product.id]
        );

        // Obtener variantes
        const variantsResult = await pool.query(
          "SELECT id, size, color, stock, sku FROM product_variants WHERE product_id = $1 ORDER BY size, color",
          [product.id]
        );

        return {
          ...product,
          images: imagesResult.rows,
          variants: variantsResult.rows,
        };
      })
    );

    res.json(productsWithDetails);
  } catch (error) {
    console.error("❌ Error en getProducts:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Obtener un producto específico por ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const productResult = await pool.query(
      `
      SELECT 
        p.*,
        c.name as category_name,
        u.username as created_by_username
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
      `,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    const product = productResult.rows[0];

    // Obtener imágenes
    const imagesResult = await pool.query(
      "SELECT id, image_url, is_primary, display_order FROM product_images WHERE product_id = $1 ORDER BY display_order, created_at",
      [id]
    );

    // Obtener variantes
    const variantsResult = await pool.query(
      "SELECT id, size, color, stock, sku FROM product_variants WHERE product_id = $1 ORDER BY size, color",
      [id]
    );

    res.json({
      ...product,
      images: imagesResult.rows,
      variants: variantsResult.rows,
    });
  } catch (error) {
    console.error("❌ Error en getProductById:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Crear un nuevo producto
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category_id, is_active, images, variants } = req.body;
    const userId = req.user.userId;

    // Validación básica
    if (!name || price === undefined) {
      return res.status(400).json({ message: "Nombre y precio son requeridos." });
    }

    if (price < 0) {
      return res.status(400).json({ message: "El precio no puede ser negativo." });
    }

    // Crear producto
    const productResult = await pool.query(
      `INSERT INTO products (name, description, price, category_id, created_by, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, description || null, price, category_id || null, userId, is_active !== undefined ? is_active : true]
    );

    const product = productResult.rows[0];
    const productId = product.id;

    // Insertar imágenes si se proporcionan
    if (images && Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        await pool.query(
          `INSERT INTO product_images (product_id, image_url, is_primary, display_order) 
           VALUES ($1, $2, $3, $4)`,
          [productId, img.image_url, img.is_primary || false, img.display_order || 0]
        );
      }
    }

    // Insertar variantes si se proporcionan
    if (variants && Array.isArray(variants) && variants.length > 0) {
      for (const variant of variants) {
        await pool.query(
          `INSERT INTO product_variants (product_id, size, color, stock, sku) 
           VALUES ($1, $2, $3, $4, $5)`,
          [productId, variant.size || null, variant.color || null, variant.stock || 0, variant.sku || null]
        );
      }
    }

    // Obtener el producto completo con relaciones
    const fullProduct = await pool.query(
      `
      SELECT 
        p.*,
        c.name as category_name,
        u.username as created_by_username
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
      `,
      [productId]
    );

    const imagesResult = await pool.query(
      "SELECT * FROM product_images WHERE product_id = $1",
      [productId]
    );

    const variantsResult = await pool.query(
      "SELECT * FROM product_variants WHERE product_id = $1",
      [productId]
    );

    res.status(201).json({
      message: "Producto creado exitosamente.",
      product: {
        ...fullProduct.rows[0],
        images: imagesResult.rows,
        variants: variantsResult.rows,
      },
    });
  } catch (error) {
    console.error("❌ Error en createProduct:", error);
    if (error.code === "23505") {
      return res.status(409).json({ message: "Ya existe un producto con esos datos." });
    }
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Actualizar un producto
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category_id, is_active, images, variants } = req.body;

    // Verificar que el producto existe
    const productCheck = await pool.query("SELECT id FROM products WHERE id = $1", [id]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    // Validación
    if (price !== undefined && price < 0) {
      return res.status(400).json({ message: "El precio no puede ser negativo." });
    }

    // Construir query de actualización dinámicamente
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
    if (price !== undefined) {
      updates.push(`price = $${paramCount}`);
      params.push(price);
      paramCount++;
    }
    if (category_id !== undefined) {
      updates.push(`category_id = $${paramCount}`);
      params.push(category_id);
      paramCount++;
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
      paramCount++;
    }

    if (updates.length > 0) {
      params.push(id);
      await pool.query(
        `UPDATE products SET ${updates.join(", ")} WHERE id = $${paramCount}`,
        params
      );
    }

    // Actualizar imágenes si se proporcionan
    if (images !== undefined) {
      // Eliminar imágenes existentes
      await pool.query("DELETE FROM product_images WHERE product_id = $1", [id]);
      
      // Insertar nuevas imágenes
      if (Array.isArray(images) && images.length > 0) {
        for (const img of images) {
          await pool.query(
            `INSERT INTO product_images (product_id, image_url, is_primary, display_order) 
             VALUES ($1, $2, $3, $4)`,
            [id, img.image_url, img.is_primary || false, img.display_order || 0]
          );
        }
      }
    }

    // Actualizar variantes si se proporcionan
    if (variants !== undefined) {
      // Eliminar variantes existentes
      await pool.query("DELETE FROM product_variants WHERE product_id = $1", [id]);
      
      // Insertar nuevas variantes
      if (Array.isArray(variants) && variants.length > 0) {
        for (const variant of variants) {
          await pool.query(
            `INSERT INTO product_variants (product_id, size, color, stock, sku) 
             VALUES ($1, $2, $3, $4, $5)`,
            [id, variant.size || null, variant.color || null, variant.stock || 0, variant.sku || null]
          );
        }
      }
    }

    // Obtener el producto actualizado
    const updatedProduct = await pool.query(
      `
      SELECT 
        p.*,
        c.name as category_name,
        u.username as created_by_username
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
      `,
      [id]
    );

    const imagesResult = await pool.query(
      "SELECT * FROM product_images WHERE product_id = $1",
      [id]
    );

    const variantsResult = await pool.query(
      "SELECT * FROM product_variants WHERE product_id = $1",
      [id]
    );

    res.json({
      message: "Producto actualizado exitosamente.",
      product: {
        ...updatedProduct.rows[0],
        images: imagesResult.rows,
        variants: variantsResult.rows,
      },
    });
  } catch (error) {
    console.error("❌ Error en updateProduct:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Eliminar un producto (soft delete cambiando is_active, o hard delete)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard = false } = req.query; // Por defecto soft delete

    const productCheck = await pool.query("SELECT id FROM products WHERE id = $1", [id]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    if (hard === "true") {
      // Hard delete - elimina todo (cascade elimina imágenes y variantes)
      await pool.query("DELETE FROM products WHERE id = $1", [id]);
      res.json({ message: "Producto eliminado permanentemente." });
    } else {
      // Soft delete - solo desactiva
      await pool.query("UPDATE products SET is_active = false WHERE id = $1", [id]);
      res.json({ message: "Producto desactivado exitosamente." });
    }
  } catch (error) {
    console.error("❌ Error en deleteProduct:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

