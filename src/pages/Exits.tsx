import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, TrendingDown, Package, Calendar, DollarSign, ShoppingCart } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StockExit {
  id: string;
  product_id: string;
  quantity: number;
  reason: string | null;
  created_at: string;
  products: {
    name: string;
    sku: string | null;
    sale_price: number;
  };
}

const Exits = () => {
  // Modal de cadastro de saída
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    product_id: "",
    quantity: "",
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
          reason: form.reason,
          movement_type: 'saida'
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao registrar saída');
      }
    } catch (error: any) {
      setLoading(false);
      toast({ title: "Erro ao registrar saída", description: error.message, variant: "destructive" });
      return;
    }
    setLoading(false);
    toast({ title: "Saída registrada!", description: "Saída de estoque realizada com sucesso." });
    setOpen(false);
    setForm({ product_id: "", quantity: "", reason: "" });
    queryClient.invalidateQueries({ queryKey: ['stock-exits'] });
  }
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exits, isLoading } = useQuery({
    queryKey: ['stock-exits'],
    queryFn: async () => {
      let url = '/api/stock-movements?type=saida';
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar saídas');
      let data: StockExit[] = await response.json();

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

  const filteredExits = exits?.filter(exit =>
    exit.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exit.products.sku && exit.products.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (exit.reason && exit.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const totalExits = filteredExits.length;
  const totalQuantity = filteredExits.reduce((sum, exit) => sum + exit.quantity, 0);
  const totalValue = filteredExits.reduce((sum, exit) => 
    sum + (exit.quantity * Number(exit.products?.sale_price || 0)), 0
  );

  /** Texto amigável para motivos gerados pelo PDV (legado com UUID ou ref. curta). */
  const getExitReasonDisplay = (reason: string | null) => {
    if (!reason) return null;
    const legacy = reason.match(/^Venda\s*-\s*ID:\s*([0-9a-f-]{36})$/i);
    if (legacy) {
      return {
        title: "Venda registrada no PDV",
        detail: `Ref. pedido ${legacy[1].slice(-8).toUpperCase()}`,
      };
    }
    const comPagamento = reason.match(
      /^Venda no PDV · pagamento:\s*(.+?) · ref\.\s*([A-Z0-9]+)$/i
    );
    if (comPagamento) {
      return {
        title: "Venda registrada no PDV",
        detail: `Pagamento: ${comPagamento[1].trim()} · Ref. pedido ${comPagamento[2]}`,
      };
    }
    const novo = reason.match(/^Venda no PDV · ref\.\s*([A-Z0-9]+)$/i);
    if (novo) {
      return {
        title: "Venda registrada no PDV",
        detail: `Ref. pedido ${novo[1]}`,
      };
    }
    return { title: reason, detail: undefined as string | undefined };
  };

  const getReasonBadge = (reason: string | null) => {
    if (!reason) return null;
    
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes('venda') || reasonLower.includes('vendido')) {
      return <Badge className="bg-success/10 text-success border-success/20">Venda</Badge>;
    }
    if (reasonLower.includes('perda') || reasonLower.includes('quebra')) {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Perda</Badge>;
    }
    if (reasonLower.includes('ajuste')) {
      return <Badge className="bg-warning/10 text-warning border-warning/20">Ajuste</Badge>;
    }
    
    return <Badge variant="outline">{reason}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Saídas de Estoque</h1>
          <p className="text-muted-foreground">Gerencie as saídas de produtos do estoque</p>
        </div>
        <>
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" />
            Nova Saída
          </Button>
          {/* Modal de cadastro de saída */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Saída de Estoque</DialogTitle>
                <DialogDescription>Preencha os dados para registrar uma saída de produto.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium mb-1">Produto*</label>
                  <select
                    className={`w-full border rounded px-3 py-2 ${errors.product_id ? 'border-red-500' : 'border-input'}`}
                    value={form.product_id}
                    onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
                    disabled={loadingProducts}
                  >
                    <option value="">Selecione...</option>
                    {products && products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>
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
                    placeholder="Motivo (ex: venda, perda, ajuste)"
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
              <div className="p-3 rounded-lg bg-destructive/10">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Saídas</p>
                <p className="text-2xl font-bold">{totalExits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <Package className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantidade Total</p>
                <p className="text-2xl font-bold">- {totalQuantity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="w-6 h-6 text-primary" />
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

      {/* Exits List */}
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
      ) : filteredExits.length > 0 ? (
        <div className="space-y-4">
          {filteredExits.map((exit) => (
            <Card key={exit.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{exit.products.name}</h3>
                      {exit.products.sku && (
                        <Badge variant="outline" className="text-xs">
                          SKU: {exit.products.sku}
                        </Badge>
                      )}
                      {getReasonBadge(exit.reason)}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        <span>Quantidade: {exit.quantity}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-primary dark:text-green-400">
                          Valor unitário: {Number(exit.products?.sale_price || 0).toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(exit.created_at), "dd/MM/yyyy 'às' HH:mm", { 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    </div>
                    {exit.reason && (() => {
                      const parsed = getExitReasonDisplay(exit.reason);
                      if (!parsed) return null;
                      return (
                        <div className="mt-2 space-y-0.5 text-sm">
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Motivo:</span>{" "}
                            {parsed.title}
                          </p>
                          {parsed.detail && (
                            <p className="text-xs text-muted-foreground font-mono break-all">
                              {parsed.detail}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="text-right">
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                      - {exit.quantity} unidades
                    </Badge>
                    <p className="text-sm text-primary dark:text-green-400 mt-1">
                      Total: {(exit.quantity * Number(exit.products?.sale_price || 0)).toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </p>
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
              <TrendingDown className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Nenhuma saída encontrada" : "Nenhuma saída registrada"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? "Tente ajustar os filtros ou termo de busca" 
                : "As saídas aparecerão aqui quando produtos forem vendidos ou baixados do estoque"
              }
            </p>
            <Button className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              Ir para o PDV
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Exits;