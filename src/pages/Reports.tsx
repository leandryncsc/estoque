import { useState, useEffect } from "react";
import { useUserType } from "@/hooks/useUserType";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Calendar,
  Download,
  FileText,
  PieChart,
  LineChart
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
// Supabase removido
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

const Reports = () => {
  // Estado para filial selecionada e lista de filiais
  const [selectedFilial, setSelectedFilial] = useState<string>("all");
  const [filiais, setFiliais] = useState<any[]>([]);

  const { type: userType } = useUserType();

  // Buscar filiais
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/filiais', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) setFiliais(await res.json());
      } catch (err) {}
    })();
  }, []);
  // Função para exportar vendas para CSV
  function exportSalesCSV() {
    if (!salesData || salesData.length === 0) {
      alert("Não há dados de vendas para exportar.");
      return;
    }
    try {
      const header = ["ID", "Valor Total", "Data", "Forma de Pagamento", "Itens Vendidos"];
      const rows = salesData.map(sale => [
        sale.id,
        sale.total_amount,
        format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        sale.payment_method,
        sale.sale_items?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) || 0
      ]);
      const csvContent = [header, ...rows]
        .map(row => row.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-vendas-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      alert("Erro ao exportar CSV. Tente novamente.");
    }
  }
  const [periodFilter, setPeriodFilter] = useState("month");

  const getPeriodDates = () => {
    const today = new Date();
    switch (periodFilter) {
      case 'today':
        return { start: new Date(today.setHours(0, 0, 0, 0)), end: new Date() };
      case 'week':
        return { start: subDays(today, 7), end: new Date() };
      case 'month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'year':
        return { start: startOfYear(today), end: endOfYear(today) };
      default:
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  };

  const { start: startDate, end: endDate } = getPeriodDates();

  // Busca Unificada de Relatórios
  const { data: reportsData, isLoading: loadingReports } = useQuery({
    queryKey: ['reports', periodFilter, selectedFilial],
    queryFn: async () => {
      let url = '/api/reports';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (selectedFilial) params.append('filial_id', selectedFilial);
      params.append('userType', userType);

      const response = await fetch(`${url}?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Erro ao buscar relatórios');
      return await response.json();
    },
  });

  const salesData = reportsData?.salesData || [];
  const stockData = reportsData?.stockData || [];
  const lowStockProducts = reportsData?.lowStockProducts || [];

  const isLoading = loadingReports;

  // Calculate metrics
  const totalSales = salesData?.length || 0;
  const totalRevenue = salesData?.reduce((sum: number, sale: any) => sum + Number(sale.total_amount), 0) || 0;
  const totalItemsSold = salesData?.reduce((sum, sale) => 
    sum + sale.sale_items.reduce((itemSum: number, item: { quantity: number; unit_price: number }) => itemSum + item.quantity, 0), 0
  ) || 0;

  const stockEntries = stockData?.filter(movement => movement.movement_type === 'entrada') || [];
  const stockExits = stockData?.filter(movement => movement.movement_type === 'saida') || [];
  
  const totalEntriesQuantity = stockEntries.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalExitsQuantity = stockExits.reduce((sum, exit) => sum + exit.quantity, 0);

  // Payment methods distribution
  const paymentMethods = salesData?.reduce((acc: any, sale) => {
    acc[sale.payment_method] = (acc[sale.payment_method] || 0) + 1;
    return acc;
  }, {}) || {};

  const reportCards: Array<{
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }> = [
    {
      title: "Vendas no Período",
      value: totalSales.toString(),
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Receita Total",
      value: totalRevenue.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }),
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Itens Vendidos",
      value: totalItemsSold.toString(),
      icon: Package,
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      title: "Entradas de Estoque",
      value: `+${totalEntriesQuantity}`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Saídas de Estoque",
      value: `-${totalExitsQuantity}`,
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
    {
      title: "Produtos em Falta",
      value: (lowStockProducts?.length ?? 0).toString(),
      icon: Package,
      color: "text-warning",
      bgColor: "bg-warning/10"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise completa do seu negócio</p>
        </div>
        <div className="flex gap-2">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
          {/* Filtro de filial para administrador */}
          {userType === 'administrador' && filiais.length > 0 && (
            <Select
              value={selectedFilial}
              onValueChange={setSelectedFilial}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Todas as filiais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as filiais</SelectItem>
                {filiais.map(filial => (
                  <SelectItem key={filial.id} value={filial.id}>{filial.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" className="gap-2" onClick={exportSalesCSV}>
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Period Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              Período: {format(startDate, "dd/MM/yyyy", { locale: ptBR })} até {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Main Metrics */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCards.map((card, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Métodos de Pagamento
            </CardTitle>
            <CardDescription>Distribuição das vendas por forma de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(paymentMethods).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(paymentMethods).map(([method, count]) => (
                  <div key={method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <span className="capitalize">{method}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{String(count)}</span>
                      <Badge variant="outline">
                        {((Number(count) / totalSales) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma venda registrada no período
              </p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Produtos com Estoque Baixo
            </CardTitle>
            <CardDescription>Produtos que precisam de reposição</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {lowStockProducts.slice(0, 10).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                      )}
                    </div>
                    <Badge 
                      variant={product.stock_quantity === 0 ? "destructive" : "secondary"}
                    >
                      {product.stock_quantity} unid.
                    </Badge>
                  </div>
                ))}
                {lowStockProducts.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground">
                    +{lowStockProducts.length - 10} produtos adicionais
                  </p>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Todos os produtos têm estoque adequado
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Vendas Recentes
          </CardTitle>
          <CardDescription>Últimas vendas realizadas no período</CardDescription>
        </CardHeader>
        <CardContent>
          {salesData && salesData.length > 0 ? (
            <div className="space-y-3">
              {salesData.slice(0, 10).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <DollarSign className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {Number(sale.total_amount).toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Badge className="capitalize">{sale.payment_method}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma venda registrada no período
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;