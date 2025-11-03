import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import client from "../../api/axios";
import { Card } from "../ui/Card";
import Imput from "../Imput";

const ProductsManager = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm();

  // Cargar productos y categorías
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await client.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await client.get("/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const productData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        category_id: data.category_id || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
        images: data.images ? data.images.split('\n').filter(url => url.trim()).map(url => ({
          image_url: url.trim(),
          is_primary: false
        })) : [],
        variants: data.variants ? JSON.parse(data.variants) : []
      };

      if (editingProduct) {
        await client.put(`/products/${editingProduct.id}`, productData);
      } else {
        await client.post("/products", productData);
      }

      reset();
      setEditingProduct(null);
      setShowForm(false);
      loadProducts();
    } catch (error) {
      console.error("Error guardando producto:", error.response?.data || error);
      alert(error.response?.data?.message || "Error al guardar producto");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setValue("name", product.name);
    setValue("description", product.description || "");
    setValue("price", product.price);
    setValue("category_id", product.category_id || "");
    setValue("is_active", product.is_active);
    setValue("images", product.images?.map(img => img.image_url).join('\n') || "");
    setValue("variants", JSON.stringify(product.variants || [], null, 2));
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await client.delete(`/products/${id}`);
      loadProducts();
    } catch (error) {
      console.error("Error eliminando producto:", error);
      alert("Error al eliminar producto");
    }
  };

  const handleCancel = () => {
    reset();
    setEditingProduct(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-emerald-500">Gestión de Productos</h2>
        <button
          onClick={() => {
            reset();
            setEditingProduct(null);
            setShowForm(!showForm);
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded"
        >
          {showForm ? "Cancelar" : "Nuevo Producto"}
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h3 className="text-xl font-bold text-emerald-500 mb-4">
            {editingProduct ? "Editar Producto" : "Crear Producto"}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Imput
                type="text"
                placeholder="Nombre del producto"
                {...register("name", { required: true })}
              />
              {errors.name && <span className="text-red-500 text-sm">Nombre requerido</span>}
            </div>

            <div>
              <textarea
                placeholder="Descripción"
                className="w-full p-2 bg-zinc-800 text-white rounded border border-zinc-700"
                {...register("description")}
              />
            </div>

            <div>
              <Imput
                type="number"
                step="0.01"
                placeholder="Precio"
                {...register("price", { required: true, min: 0 })}
              />
              {errors.price && <span className="text-red-500 text-sm">Precio válido requerido</span>}
            </div>

            <div>
              <select
                className="w-full p-2 bg-zinc-800 text-white rounded border border-zinc-700"
                {...register("category_id")}
              >
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                {...register("is_active")}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-white">Producto activo</label>
            </div>

            <div>
              <label className="text-white block mb-2">Imágenes (una URL por línea)</label>
              <textarea
                placeholder="https://ejemplo.com/imagen1.jpg&#10;https://ejemplo.com/imagen2.jpg"
                className="w-full p-2 bg-zinc-800 text-white rounded border border-zinc-700"
                rows="3"
                {...register("images")}
              />
            </div>

            <div>
              <label className="text-white block mb-2">Variantes (JSON array)</label>
              <textarea
                placeholder='[{"size": "S", "color": "Rojo", "stock": 10, "sku": "CAM-S-ROJO"}]'
                className="w-full p-2 bg-zinc-800 text-white rounded border border-zinc-700 font-mono text-sm"
                rows="5"
                {...register("variants")}
              />
              <p className="text-zinc-400 text-xs mt-1">Formato: Array JSON con size, color, stock, sku</p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {loading ? "Guardando..." : editingProduct ? "Actualizar" : "Crear"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de productos */}
      <div className="grid gap-4">
        {products.length === 0 ? (
          <Card>
            <p className="text-zinc-400">No hay productos</p>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{product.name}</h3>
                  {product.is_active ? (
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Activo</span>
                  ) : (
                    <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">Inactivo</span>
                  )}
                </div>
                <p className="text-zinc-400 mb-2">{product.description}</p>
                <p className="text-emerald-500 font-bold">${product.price}</p>
                {product.category_name && (
                  <p className="text-zinc-500 text-sm">Categoría: {product.category_name}</p>
                )}
                {product.variants && product.variants.length > 0 && (
                  <div className="mt-2">
                    <p className="text-zinc-500 text-sm">Variantes: {product.variants.length}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Eliminar
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductsManager;

