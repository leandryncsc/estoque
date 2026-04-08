import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, TrendingUp, Package, Calendar, DollarSign } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StockEntry {
  id: string;
  product_id: string;
  quantity: number;
  cost_price: number | null;
  reason: string | null;
  created_at: string;
  products: {
    name: string;
    sku: string | null;
  };
}

const Entries = () => {
  const navigate = useNavigate();
  // Modal de cadastro de entrada
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    product_id: "",
    quantity: "",
    cost_price: "",
    reason: ""
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Buscar produtos para o select
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar produtos');
      return await response.json();
    },
  });

  function validate() {
    const errs: any = {};
    if (!form.product_id) errs.product_id = "Selecione o produto";
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0) errs.quantity = "Quantidade obrigatória";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      const response = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: form.product_id,
          quantity: Number(form.quantity),
          cost_price: form.cost_price ? Number(form.cost_price) : null,
          reason: form.reason,
          movement_type: 'entrada'
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao registrar entrada');
      }
    } catch (error: any) {
      setLoading(false);
      toast({ title: "Erro ao registrar entrada", description: error.message, variant: "destructive" });
      return;
    }
    setLoading(false);
    toast({ title: "Entrada registrada!", description: "Entrada de estoque realizada com sucesso." });
    setOpen(false);
    setForm({ product_id: "", quantity: "", cost_price: "", reason: "" });
    queryClient.invalidateQueries({ queryKey: ['stock-entries'] });
  }
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entries, isLoading } = useQuery({
    queryKey: ['stock-entries'],
    queryFn: async () => {
      let url = '/api/stock-movements?type=entrada';
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar entradas');
      let data: StockEntry[] = await response.json();

      if (periodFilter !== 'all') {
        const today = new Date();
        let startDate: Date | undefined;
        
        switch (periodFilter) {
          case 'today':
            startDate = new Date(today.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(today.setDate(today.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(today.setMonth(today.getMonth() - 1));
            break;
        }
        
        if (startDate) {
          const startIso = startDate.toISOString();
          data = data.filter(entry => entry.created_at >= startIso);
        }
      }
      
      return data;
    },
  });

  const filteredEntries = entries?.filter(entry =>
    entry.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.products.sku && entry.products.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (entry.reason && entry.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const totalEntries = filteredEntries.length;
  const totalQuantity = filteredEntries.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalValue = filteredEntries.reduce((sum, entry) => 
    sum + (entry.cost_price ? entry.quantity * entry.cost_price : 0), 0
  );

  return (
  <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Entradas de Estoque</h1>
          <p className="text-muted-foreground">Gerencie as entradas de produtos no estoque</p>
        </div>
        <>
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" />
            Nova Entrada
          </Button>
          {/* Modal de cadastro de entrada */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Entrada de Estoque</DialogTitle>
                <DialogDescription>Preencha os dados para registrar uma entrada de produto.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium mb-1">Produto*</label>
                  <select
                    className={`w-full border rounded px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/50 ${errors.product_id ? 'border-red-500' : 'border-input'}`}
                    value={form.product_id}
                    onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
                    disabled={loadingProducts}
                  >
                    <option value="" className="bg-background text-foreground">Selecione...</option>
                    {products && products.map((p: any) => (
                      <option key={p.id} value={p.id} className="bg-background text-foreground">{p.name} {p.sku ? `(${p.sku})` : ''}</option>
                    ))}
                  </select>
                  {errors.product_id && <span className="text-xs text-red-500">{errors.product_id}</span>}
                </div>
                <div>
                  <Input
                    placeholder="Quantidade*"
                    type="number"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    className={errors.quantity ? "border-red-500" : ""}
                  />
                  {errors.quantity && <span className="text-xs text-red-500">{errors.quantity}</span>}
                </div>
                <div>
                  <Input
                    placeholder="Custo unitário"
                    type="number"
                    value={form.cost_price}
                    onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Motivo (opcional)"
                    value={form.reason}
                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading} className="gap-2">
                    {loading ? "Salvando..." : "Salvar"}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Entradas</p>
                <p className="text-2xl font-bold">{totalEntries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantidade Total</p>
                <p className="text-2xl font-bold">{totalQuantity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  {totalValue.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produtos cadastrados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Produtos cadastrados
          </CardTitle>
          <CardDescription>Catálogo de produtos disponíveis para entrada</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingProducts ? (
            <div className="text-muted-foreground">Carregando produtos...</div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p: any) => (
                <div key={p.id} className="border rounded p-3 flex flex-col gap-1">
                  <span className="font-semibold text-foreground">{p.name}</span>
                  {p.sku && <span className="text-xs text-muted-foreground">SKU: {p.sku}</span>}
                  <span className="text-xs text-muted-foreground">Custo: {typeof p.cost_price === 'number' ? p.cost_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
                  <span className="text-xs text-muted-foreground">Venda: {typeof p.sale_price === 'number' ? p.sale_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
                  <span className="text-xs text-muted-foreground">Estoque: {typeof p.stock_quantity === 'number' ? p.stock_quantity : '-'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">Nenhum produto cadastrado.</div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por produto, SKU ou motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEntries.length > 0 ? (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{entry.products.name}</h3>
                      {entry.products.sku && (
                        <Badge variant="outline" className="text-xs">
                          SKU: {entry.products.sku}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        <span>Quantidade: {entry.quantity}</span>
                      </div>
                      {entry.cost_price && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            Custo unitário: {entry.cost_price.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    </div>
                    {entry.reason && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <strong>Motivo:</strong> {entry.reason}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge className="bg-accent/10 text-accent border-accent/20">
                      + {entry.quantity} unidades
                    </Badge>
                    {entry.cost_price && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Total: {(entry.quantity * entry.cost_price).toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Nenhuma entrada encontrada" : "Nenhuma entrada registrada"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? "Tente ajustar os filtros ou termo de busca" 
                : "Comece registrando sua primeira entrada de estoque"
              }
            </p>
            <Button className="gap-2" onClick={() => {
              navigate("/entries");
              setOpen(true);
            }}>
              <Plus className="w-4 h-4" />
              Registrar Primeira Entrada
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Entries;