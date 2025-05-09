
import { NavLink } from "react-router-dom";
import {
  Home,
  ShoppingBag,
  Clipboard,
  FileText,
  Settings,
  Users,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    return cn(
      "flex items-center p-2 rounded-md hover:bg-primary/10 transition-colors",
      isActive ? "bg-primary/20 font-semibold" : "font-normal"
    );
  };

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex justify-between items-center">
        {!collapsed && <h2 className="font-semibold">Menu</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <nav className="px-2 py-4 space-y-2">
        {isAdmin && (
          <>
            <NavLink to="/dashboard" className={getLinkClass}>
              <Home className="h-5 w-5 mr-3" />
              {!collapsed && <span>Dashboard</span>}
            </NavLink>
            <NavLink to="/products" className={getLinkClass}>
              <ShoppingBag className="h-5 w-5 mr-3" />
              {!collapsed && <span>Produtos</span>}
            </NavLink>
            <NavLink to="/users" className={getLinkClass}>
              <Users className="h-5 w-5 mr-3" />
              {!collapsed && <span>Usuários</span>}
            </NavLink>
            <NavLink to="/reports" className={getLinkClass}>
              <FileText className="h-5 w-5 mr-3" />
              {!collapsed && <span>Relatórios</span>}
            </NavLink>
            <NavLink to="/settings" className={getLinkClass}>
              <Settings className="h-5 w-5 mr-3" />
              {!collapsed && <span>Configurações</span>}
            </NavLink>
          </>
        )}
        <NavLink to="/pos" className={getLinkClass}>
          <Clipboard className="h-5 w-5 mr-3" />
          {!collapsed && <span>Vendas (PDV)</span>}
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
