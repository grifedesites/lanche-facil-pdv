
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: Tentativa de acesso a uma rota inexistente:",
      location.pathname
    );
  }, [location.pathname]);

  // Determina a página inicial com base no tipo de usuário
  const homePath = isAuthenticated ? (isAdmin ? "/dashboard" : "/pos") : "/login";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-6xl font-bold mb-4 text-red-500">404</h1>
        <p className="text-xl text-gray-600 mb-6">Ops! Página não encontrada</p>
        <p className="text-gray-500 mb-6">
          A página "{location.pathname}" não existe ou foi removida.
        </p>
        <Link to={homePath} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-md transition-colors">
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
