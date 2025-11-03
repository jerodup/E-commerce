import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import client from "../../api/axios";
import { Card } from "../ui/Card";
import Imput from "../Imput";

const CategoriesManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm();

  useEffect(() => {
    loadCategories();
  }, []);

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
      if (editingCategory) {
        await client.put(`/categories/${editingCategory.id}`, data);
      } else {
        await client.post("/categories", data);
      }

      reset();
      setEditingCategory(null);
      setShowForm(false);
      loadCategories();
    } catch (error) {
      console.error("Error guardando categoría:", error.response?.data || error);
      alert(error.response?.data?.message || "Error al guardar categoría");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setValue("name", category.name);
    setValue("description", category.description || "");
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;
    try {
      await client.delete(`/categories/${id}`);
      loadCategories();
    } catch (error) {
      console.error("Error eliminando categoría:", error);
      alert(error.response?.data?.message || "Error al eliminar categoría");
    }
  };

  const handleCancel = () => {
    reset();
    setEditingCategory(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-emerald-500">Gestión de Categorías</h2>
        <button
          onClick={() => {
            reset();
            setEditingCategory(null);
            setShowForm(!showForm);
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded"
        >
          {showForm ? "Cancelar" : "Nueva Categoría"}
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h3 className="text-xl font-bold text-emerald-500 mb-4">
            {editingCategory ? "Editar Categoría" : "Crear Categoría"}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Imput
                type="text"
                placeholder="Nombre de la categoría"
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

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {loading ? "Guardando..." : editingCategory ? "Actualizar" : "Crear"}
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

      {/* Lista de categorías */}
      <div className="grid gap-4">
        {categories.length === 0 ? (
          <Card>
            <p className="text-zinc-400">No hay categorías</p>
          </Card>
        ) : (
          categories.map((category) => (
            <Card key={category.id} className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                {category.description && (
                  <p className="text-zinc-400">{category.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
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

export default CategoriesManager;

