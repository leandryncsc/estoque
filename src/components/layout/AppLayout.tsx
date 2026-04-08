import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  Menu,
  X,
  LogOut,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink, useLocation } from "react-router-dom";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { useUserType } from "@/hooks/useUserType";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { type, user } = useUserType();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Package, label: "Produtos", href: "/products" },
    { icon: ShoppingCart, label: "Mini PDV", href: "/pos" },
    { icon: Users, label: "Fornecedores", href: "/suppliers" },
    { icon: TrendingUp, label: "Entradas", href: "/entries" },
    { icon: TrendingDown, label: "Saídas", href: "/exits" },
    { icon: BarChart3, label: "Relatórios", href: "/reports" },
    { icon: Settings, label: "Configurações", href: "/settings" }
  ];

  // Filtra menu para vendedor
  const filteredMenu = type === "vendedor"
    ? menuItems.filter(item => ["Mini PDV", "Produtos","Fornecedores"].includes(item.label))
    : menuItems;

  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-change'));
    navigate("/login");
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden print:h-auto print:block print:bg-white print:overflow-visible">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 print:hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">StockPro</h1>
              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredMenu.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                  asChild
                >
                  <NavLink to={item.href}>
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                </Button>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-glow rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-accent-foreground">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 print:hidden">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-foreground">Sistema de Gerenciamento</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitch />
            <Button variant="default" size="sm" className="hidden sm:flex" asChild>
              <NavLink to="/pos">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Abrir PDV
              </NavLink>
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 print:p-0 print:overflow-visible">
          {children}
        </main>
        {/* Footer */}
        <footer className="w-full text-center py-3 text-xs text-muted-foreground bg-card border-t border-border print:hidden">
          © 2025 Criado por Leandro Bezerra
        </footer>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AppLayout;