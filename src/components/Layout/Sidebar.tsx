import {
  LayoutDashboard,
  ClipboardList,
  ShoppingCart,
  Users,
  Settings,
  Power,
  ClipboardCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  requireAdmin?: boolean;
}

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navigation: NavItem[] = [
    {
      title: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="h-5 w-5" />,
      requireAdmin: true
    },
    {
      title: "Pedidos",
      href: "/orders",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      title: "Produtos",
      href: "/products",
      icon: <ShoppingCart className="h-5 w-5" />,
      requireAdmin: true
    },
    {
      title: "Usuários",
      href: "/users",
      icon: <Users className="h-5 w-5" />,
      requireAdmin: true
    },
    {
      title: "Relatórios",
      href: "/reports",
      icon: <ClipboardList className="h-5 w-5" />,
      requireAdmin: true
    },
    {
      title: "Gerenciar Caixa",
      href: "/cashier-management",
      icon: <ShoppingCart className="h-5 w-5" />,
      requireAdmin: true
    },
    {
      title: "Relatório de Caixa",
      href: "/cashier-reports",
      icon: <ClipboardCheck className="h-5 w-5" />,
      requireAdmin: true
    },
    {
      title: "Configurações",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
      requireAdmin: true
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao fazer logout.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64 px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
      </div>
      <nav className="flex-grow">
        <ul>
          {navigation.map((item) => {
            if (item.requireAdmin && !user?.isAdmin) {
              return null;
            }

            return (
              <li key={item.href} className="mb-2">
                <a
                  href={item.href}
                  className="flex items-center space-x-3 py-2 px-4 rounded-md hover:bg-gray-800 transition-colors duration-200"
                >
                  {item.icon}
                  <span>{item.title}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-3 py-2 px-4 rounded-md hover:bg-gray-800 transition-colors duration-200"
        >
          <Power className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
