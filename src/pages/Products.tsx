import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserType } from "@/hooks/useUserType";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { 
  Package, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Minus
} from "lucide-react";

const Products = () => {
  const { type: userType } = useUserType();
  const isAdmin = userType === 'administrador';
  // Buscar filiais cadastradas
  const { data: filiais, isLoading: loadingFiliais } = useQuery({
    queryKey: ['filiais'],
    queryFn: async () => {
      const response = await fetch('/api/public/filiais');
      if (!response.ok) throw new Error('Erro ao buscar filiais');
      return await response.json();
    },
  });
  async function handleDelete(id: string) {
    const confirm = window.confirm("Tem certeza que deseja apagar este produto?");
    if (!confirm) return;
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erro ao apagar o produto');
      toast({ title: "Produto apagado!", description: "Operação realizada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error: any) {
      toast({ title: "Erro ao apagar", description: error.message, variant: "destructive" });
    }
  }
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    cost_price: "",
    sale_price: "",
    stock_quantity: "",
    supplier_id: "",
    filial_id: ""
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryProduct, setEntryProduct] = useState<any>(null);
  const [entryQty, setEntryQty] = useState("");
  const [entryObs, setEntryObs] = useState("");
  const [entryLoading, setEntryLoading] = useState(false);
  const queryClient = useQueryClient();
  // Buscar produtos cadastrados
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar produtos');
      return await response.json();
    },
  });

  // Buscar fornecedores cadastrados
  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar fornecedores');
      return await response.json();
    },
  });

  function validate() {
  const errs: any = {};
  if (!form.name.trim()) errs.name = "Nome é obrigatório";
  if (!form.sku.trim()) errs.sku = "SKU é obrigatório";
  if (!form.sale_price.trim() || isNaN(Number(form.sale_price))) errs.sale_price = "Preço de venda obrigatório";
  if (!form.supplier_id) errs.supplier_id = "Selecione um fornecedor";
  // filial_id não é obrigatório, pode ser vazio (opção 'Todas')
  return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    let errorMsg;
    
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    
    const payload = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      cost_price: form.cost_price ? Number(form.cost_price) : null,
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      stock_quantity: form.stock_quantity ? Number(form.stock_quantity) : null,
      supplier_id: form.supplier_id,
      filial_id: form.filial_id || null
    };

    try {
      if (editId) {
        const response = await fetch(`/api/products/${editId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const res = await response.json();
          throw new Error(res.error || 'Erro ao editar');
        }
      } else {
        const response = await fetch(`/api/products`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const res = await response.json();
          throw new Error(res.error || 'Erro ao criar');
        }
      }
    } catch (err: any) {
      errorMsg = err.message;
    }

    setLoading(false);
    if (errorMsg) {
      toast({ title: "Erro ao salvar produto", description: errorMsg, variant: "destructive" });
      return;
    }
    toast({ title: editId ? "Produto atualizado!" : "Produto cadastrado!", description: "Operação realizada com sucesso." });
    setOpen(false);
  setForm({ name: "", sku: "", category: "", cost_price: "", sale_price: "", stock_quantity: "", supplier_id: "", filial_id: "" });
  setForm({ name: "", sku: "", category: "", cost_price: "", sale_price: "", stock_quantity: "", supplier_id: "", filial_id: "" });
    setEditId(null);
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }

  const getStockBadge = (stock: number, status: string) => {
    const settings = typeof window !== 'undefined' ? localStorage.getItem('settings') : null;
    const lowStockLimit = settings ? JSON.parse(settings).lowStockAlert : 8;
    if (status === "out_of_stock" || stock === 0) {
      return <Badge variant="destructive" className="gap-1"><Minus className="w-3 h-3" />Sem Estoque</Badge>;
    }
    if (status === "low_stock" || stock <= lowStockLimit) {
      return <Badge variant="secondary" className="gap-1 bg-warning/10 text-warning border-warning/20"><AlertTriangle className="w-3 h-3" />Estoque Baixo</Badge>;
    }
    return <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3" />Em Estoque</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Gerencie seu catálogo de produtos</p>
        </div>
        <>
          <Button variant="business" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
          {/* Modal de cadastro */}
          <Dialog open={open} onOpenChange={val => {
            setOpen(val);
            if (!val) {
              setEditId(null);
              setForm({ name: "", sku: "", category: "", cost_price: "", sale_price: "", stock_quantity: "", supplier_id: "", filial_id: "" });
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                <DialogDescription>{editId ? "Altere os dados do produto e salve." : "Preencha os dados para cadastrar um novo produto."}</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium mb-1">Filial</label>
                  <select
                    className="w-full border rounded px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/50 border-input"
                    value={form.filial_id}
                    onChange={e => setForm(f => ({ ...f, filial_id: e.target.value }))}
                    disabled={loadingFiliais}
                  >
                    <option value="" className="bg-background text-foreground">Todas</option>
                    {filiais && filiais.map((filial: any) => (
                      <option key={filial.id} value={filial.id} className="bg-background text-foreground">{filial.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Input
                    placeholder="Nome*"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                </div>
                <div>
                  <Input
                    placeholder="SKU*"
                    value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    className={errors.sku ? "border-red-500" : ""}
                  />
                  {errors.sku && <span className="text-xs text-red-500">{errors.sku}</span>}
                </div>
                <div>
                  <Input
                    placeholder="Categoria"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  />
                </div>
                {isAdmin && (
                <div>
                  <Input
                    placeholder="Preço de custo"
                    type="number"
                    value={form.cost_price}
                    onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))}
                  />
                </div>
                )}
                <div>
                  <Input
                    placeholder="Preço de venda*"
                    type="number"
                    value={form.sale_price}
                    onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))}
                    className={errors.sale_price ? "border-red-500" : ""}
                  />
                  {errors.sale_price && <span className="text-xs text-red-500">{errors.sale_price}</span>}
                </div>
                <div>
                  <Input
                    placeholder="Estoque"
                    type="number"
                    value={form.stock_quantity}
                    onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fornecedor*</label>
                  <select
                    className={`w-full border rounded px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/50 ${errors.supplier_id ? 'border-red-500' : 'border-input'}`}
                    value={form.supplier_id}
                    onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}
                    disabled={loadingSuppliers}
                  >
                    <option value="" className="bg-background text-foreground">Selecione...</option>
                    {suppliers && suppliers.map((s: any) => (
                      <option key={s.id} value={s.id} className="bg-background text-foreground">{s.name}</option>
                    ))}
                  </select>
                  {errors.supplier_id && <span className="text-xs text-red-500">{errors.supplier_id}</span>}
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

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg leading-tight mb-1 line-clamp-2">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    SKU: {product.sku}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="shrink-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                  <Button disabled={!isAdmin} variant="destructive" size="sm" className="shrink-0" onClick={() => handleDelete(product.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category and Stock Status */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Categoria:</span>
                  <Badge variant="outline">{product.category}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {getStockBadge(product.stock_quantity, undefined)}
                </div>
              </div>

              {/* Stock and Pricing */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estoque:</span>
                  <span className="font-semibold">{product.stock_quantity} unidades</span>
                </div>
                {isAdmin && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Custo:</span>
                  <span className="font-medium">R$ {product.cost_price != null ? Number(product.cost_price).toFixed(2) : '0,00'}</span>
                </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Venda:</span>
                  <span className="font-bold text-primary">R$ {product.sale_price != null ? Number(product.sale_price).toFixed(2) : '0,00'}</span>
                </div>
              </div>

              {/* Supplier */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">Fornecedor:</p>
                <p className="text-sm font-medium line-clamp-1">ID: {product.supplier_id}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                  setForm({
                    name: product.name || "",
                    sku: product.sku || "",
                    category: product.category || "",
                    cost_price: product.cost_price?.toString() || "",
                    sale_price: product.sale_price?.toString() || "",
                    stock_quantity: product.stock_quantity?.toString() || "",
                    supplier_id: product.supplier_id || "",
                    filial_id: (product as any).filial_id || ""
                  });
                  setEditId(product.id);
                  setOpen(true);
                }}>
                  Editar
                </Button>
                <Button variant="business" size="sm" className="flex-1" onClick={() => {
                  setEntryProduct(product);
                  setEntryOpen(true);
                }}>
                  <Package className="w-3 h-3 mr-1" />
                  Entrada
                </Button>
      {/* Modal de entrada de estoque */}
      <Dialog open={entryOpen} onOpenChange={val => {
        setEntryOpen(val);
        if (!val) {
          setEntryProduct(null);
          setEntryQty("");
          setEntryObs("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrada de Estoque</DialogTitle>
            <DialogDescription>Informe a quantidade para entrada no produto <b>{entryProduct?.name}</b>.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={async e => {
            e.preventDefault();
            if (!entryQty || isNaN(Number(entryQty)) || Number(entryQty) <= 0) {
              toast({ title: "Quantidade inválida", description: "Informe uma quantidade maior que zero.", variant: "destructive" });
              return;
            }
            setEntryLoading(true);
            try {
              const res = await fetch(`/api/products/${entryProduct.id}`, {
                method: 'PUT',
                headers: { 
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                  stock_quantity: (Number(entryProduct.stock_quantity) || 0) + Number(entryQty)
                })
              });
              if (!res.ok) throw new Error('Erro ao salvar entrada de estoque');
            } catch (err: any) {
              toast({ title: "Erro ao registrar entrada", description: err.message, variant: "destructive" });
              setEntryLoading(false);
              return;
            }
            setEntryLoading(false);
            toast({ title: "Entrada registrada!", description: `Foram adicionadas ${entryQty} unidades ao produto.` });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setEntryOpen(false);
            setEntryProduct(null);
            setEntryQty("");
            setEntryObs("");
          }}>
            <div>
              <Input
                placeholder="Quantidade"
                type="number"
                value={entryQty}
                onChange={e => setEntryQty(e.target.value)}
                min={1}
              />
            </div>
            <div>
              <Input
                placeholder="Observação (opcional)"
                value={entryObs}
                onChange={e => setEntryObs(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={entryLoading} className="gap-2">
                {entryLoading ? "Salvando..." : "Registrar Entrada"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State for filtered results */}
      {products.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Não há produtos que correspondam aos seus critérios de busca.
            </p>
            <Button variant="business" onClick={() => {
              navigate("/products");
              setOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Produto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Products;