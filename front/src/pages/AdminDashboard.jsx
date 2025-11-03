import { useState } from "react";
import ProductsManager from "../components/admin/ProductsManager";
import CategoriesManager from "../components/admin/CategoriesManager";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("products");

  return (
    <div className="min-h-[calc(100vh-68px)] bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-emerald-500 mb-6">Panel de Administración</h1>
        
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-zinc-700">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "products"
                ? "text-emerald-500 border-b-2 border-emerald-500"
                : "text-zinc-400 hover:text-zinc-300"
            }`}
          >
            Productos
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "categories"
                ? "text-emerald-500 border-b-2 border-emerald-500"
                : "text-zinc-400 hover:text-zinc-300"
            }`}
          >
            Categorías
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === "products" && <ProductsManager />}
          {activeTab === "categories" && <CategoriesManager />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

