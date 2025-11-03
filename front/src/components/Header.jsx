import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Menu, X } from "lucide-react"; // iconos livianos de lucide-react

export default function Header() {
  const { isAuth, user, signout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signout();
    setIsOpen(false);
  };

  return (
    <header className="bg-zinc-900 text-white">
      <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
        {/* Logo */}
        <Link to="/" className="text-3xl font-bold text-emerald-500">
          E-commerce
        </Link>

        {/* Botón hamburguesa (solo visible en móvil) */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Menú principal */}
        <nav
          className={`${
            isOpen ? "block" : "hidden"
          } absolute top-16 left-0 w-full bg-zinc-900 md:static md:flex md:items-center md:space-x-6 md:w-auto md:bg-transparent`}
        >
          <ul className="flex flex-col gap-4 md:flex-row items-center space-y-4 md:space-y-0 p-4 md:p-0">
            

            {isAuth && user ? (
              <>
                <li>
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    Dashboard
                  </Link>
                </li>
                {user.is_admin && (
                  <li>
                    <Link 
                      to="/admin" 
                      onClick={() => setIsOpen(false)}
                      className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-sm"
                    >
                      Admin
                    </Link>
                  </li>
                )}
                <li className="text-emerald-400">
                  Hola, {user.username}
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/register" onClick={() => setIsOpen(false)}>
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    Sign In
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
