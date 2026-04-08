import React from "react";
import { useUserType } from "@/hooks/useUserType";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  BarChart3,
  Plus
} from "lucide-react";
// Supabase removido

const Dashboard = () => {
  const { type: userType } = useUserType();
  // Estado para filial selecionada e lista de filiais
  const [selectedFilial, setSelectedFilial] = React.useState<string | null>(null);
  const [filiais, setFiliais] = React.useState<any[]>([]);
  // Buscar quantidades reais
  const [productsCount, setProductsCount] = React.useState<number>(0);
  const [suppliersCount, setSuppliersCount] = React.useState<number>(0);
  const [lowStockCount, setLowStockCount] = React.useState<number>(0);
  const [salesToday, setSalesToday] = React.useState<number>(0);
  const [salesAmountToday, setSalesAmountToday] = React.useState<number>(0);
  const [recentSales, setRecentSales] = React.useState<any[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/public/filiais');
        if (response.ok) {
          const filiaisData = await response.json();
          setFiliais(filiaisData);
        }
      } catch (err) {}
      
      const user = localStorage.getItem('user');
      if (userType === 'administrador') {
        setSelectedFilial(null);
      } else {
        if (user) {
           const parsedUser = JSON.parse(user);
           setSelectedFilial(parsedUser.filial_id || null);
        }
      }
    })();
  }, [userType]);

  React.useEffect(() => {
    (async () => {
      try {
        let url = '/api/dashboard/stats';
        const params = new URLSearchParams();
        if (selectedFilial) params.append('filial_id', selectedFilial);
        params.append('userType', userType);
        
        const settings = localStorage.getItem('settings');
        if (settings) {
          const parsed = JSON.parse(settings);
          if (parsed.lowStockAlert) {
            params.append('lowStockLimit', parsed.lowStockAlert);
          }
        }
        
        const response = await fetch(`${url}?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProductsCount(data.productsCount || 0);
          setSuppliersCount(data.suppliersCount || 0);
          setLowStockCount(data.lowStockCount || 0);
          setSalesToday(data.salesTodayCount || 0);
          setSalesAmountToday(data.salesTodayAmount || 0);
          setRecentSales(data.recentSales || []);
        } else {
          setProductsCount(0);
          setSuppliersCount(0);
          setLowStockCount(0);
          setSalesToday(0);
          setSalesAmountToday(0);
          setRecentSales([]);
        }
      } catch (err) {
        console.error('Erro buscando dashboard stats:', err);
      }
    })();
  }, [userType, selectedFilial]);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
          {/* Select de filial para administrador */}
      
          {/* Alerta se não houver dados para a filial */}
          {typeof selectedFilial !== 'undefined' && (productsCount === 0 && suppliersCount === 0 && salesToday === 0) && (
            <div className="mt-2 p-2 bg-warning/20 text-warning rounded">
              {userType === 'administrador' && !selectedFilial
                ? 'Nenhum dado encontrado no sistema. Verifique se há produtos, fornecedores ou vendas cadastrados.'
                : 'Nenhum dado encontrado para esta filial. Verifique se há produtos, fornecedores ou vendas cadastrados.'}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos em Estoque</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{productsCount}</div>
            <p className="text-xs text-muted-foreground">
              {productsCount === 0 ? "Nenhum produto cadastrado" : `${productsCount} produtos cadastrados`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-success/5 to-success/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores Ativos</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{suppliersCount}</div>
            <p className="text-xs text-muted-foreground">
              {suppliersCount === 0 ? "Nenhum fornecedor cadastrado" : `${suppliersCount} fornecedores cadastrados`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-warning/5 to-warning/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              {lowStockCount === 0 ? "Nenhum produto em baixo estoque" : `${lowStockCount} produtos em baixo estoque`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-accent/5 to-accent/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent dark:text-green-400">
               {salesAmountToday.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {salesToday} transações realizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Button variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2" asChild>
              <NavLink to="/products">
                <Package className="w-6 h-6" />
                <span>Novo Produto</span>
              </NavLink>
            </Button>
            <Button variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2" asChild>
              <NavLink to="/suppliers">
                <Users className="w-6 h-6" />
                <span>Fornecedor</span>
              </NavLink>
            </Button>
            <Button variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2" asChild>
              <NavLink to="/entries">
                <TrendingUp className="w-6 h-6" />
                <span>Entrada</span>
              </NavLink>
            </Button>
            <Button variant="outline" className="h-16 sm:h-20 flex-col gap-1 sm:gap-2" asChild>
              <NavLink to="/reports">
                <BarChart3 className="w-6 h-6" />
                <span>Relatórios</span>
              </NavLink>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Vendas Recentes
            </CardTitle>
            <CardDescription>
              Últimas transações realizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentSales.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">Nenhuma venda recente</div>
            ) : (
              <ul className="space-y-2">
                {recentSales.map(sale => (
                  <li key={sale.id} className="flex justify-between items-center text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{new Date(sale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-bold"> {sale.total_amount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;