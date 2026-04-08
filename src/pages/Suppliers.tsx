import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Search, Filter, Edit, Phone, Mail, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUserType } from "@/hooks/useUserType";

interface Supplier {
  id: string;
  name: string;
  cnpj_cpf: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

const Suppliers = () => {
  const { type: userType } = useUserType();
  const isAdmin = userType === 'administrador';
  // Função para apagar fornecedor
  async function handleDelete(id: string) {
    const confirm = window.confirm("Tem certeza que deseja apagar este fornecedor?");
    if (!confirm) return;
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erro ao apagar o fornecedor');
      toast({ title: "Fornecedor apagado!", description: "Operação realizada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    } catch (error: any) {
      toast({ title: "Erro ao apagar", description: error.message, variant: "destructive" });
    }
  }
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cnpj_cpf: "",
    email: "",
    phone: "",
    address: ""
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: suppliers, isLoading, error } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar fornecedores');
      return await response.json() as Supplier[];
    },
  });

  // Check if user has access to suppliers data
  const hasAccessError = error && error.message.includes('row-level security policy');

  function validate() {
    const errs: any = {};
    if (!form.name.trim()) errs.name = "Nome é obrigatório";
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = "Email inválido";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setLoading(true);
    let errorMsg;
    
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    try {
      if (editId) {
        const response = await fetch(`/api/suppliers/${editId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(form)
        });
        if (!response.ok) {
          const res = await response.json();
          throw new Error(res.error || 'Erro ao atualizar');
        }
      } else {
        const response = await fetch('/api/suppliers', {
          method: 'POST',
          headers,
          body: JSON.stringify(form)
        });
        if (!response.ok) {
          const res = await response.json();
          throw new Error(res.error || 'Erro ao cadastrar');
        }
      }
    } catch (err: any) {
      errorMsg = err.message;
    }

    setLoading(false);
    if (errorMsg) {
      toast({ title: editId ? "Erro ao atualizar" : "Erro ao cadastrar", description: errorMsg, variant: "destructive" });
      return;
    }
    toast({ title: editId ? "Fornecedor atualizado!" : "Fornecedor cadastrado!", description: "Operação realizada com sucesso." });
    setOpen(false);
    setForm({ name: "", cnpj_cpf: "", email: "", phone: "", address: "" });
    setEditId(null);
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  }

  const filteredSuppliers = suppliers?.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.cnpj_cpf && supplier.cnpj_cpf.includes(searchTerm)) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <div className="space-y-6">
      {/* Access Denied Message */}
      {hasAccessError ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-muted-foreground mb-6">
              Apenas administradores podem visualizar e gerenciar fornecedores.
            </p>
            <Button onClick={() => navigate("/")}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Fornecedores</h1>
              <p className="text-muted-foreground">Gerencie os fornecedores da sua empresa</p>
            </div>
            <>
              <Button className="gap-2" onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4" />
                Novo Fornecedor
              </Button>
              {/* Modal de cadastro */}
              <Dialog open={open} onOpenChange={val => {
                setOpen(val);
                if (!val) {
                  setEditId(null);
                  setForm({ name: "", cnpj_cpf: "", email: "", phone: "", address: "" });
                }
              }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editId ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
                    <DialogDescription>{editId ? "Altere os dados do fornecedor e salve." : "Preencha os dados para cadastrar um novo fornecedor."}</DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleSubmit}>
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
                        placeholder="CNPJ ou CPF"
                        value={form.cnpj_cpf}
                        onChange={e => setForm(f => ({ ...f, cnpj_cpf: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                    </div>
                    <div>
                      <Input
                        placeholder="Telefone"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Endereço"
                        value={form.address}
                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
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

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome, CNPJ/CPF ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Suppliers Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{supplier.name}</CardTitle>
                        {supplier.cnpj_cpf && (
                          <Badge variant="outline" className="text-xs">
                            {supplier.cnpj_cpf.length > 14 ? 'CNPJ' : 'CPF'}: {supplier.cnpj_cpf}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{supplier.address}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="gap-2 flex-1" onClick={() => {
                        setForm({
                          name: supplier.name || "",
                          cnpj_cpf: supplier.cnpj_cpf || "",
                          email: supplier.email || "",
                          phone: supplier.phone || "",
                          address: supplier.address || ""
                        });
                        setEditId(supplier.id);
                        setOpen(true);
                      }}>
                        <Edit className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button disabled={!isAdmin} variant="destructive" size="sm" className="gap-2 flex-1" onClick={() => handleDelete(supplier.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        Apagar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm 
                    ? "Tente ajustar os filtros ou termo de busca" 
                    : "Comece adicionando seu primeiro fornecedor"
                  }
                </p>
                <Button className="gap-2" onClick={() => {
                  navigate("/suppliers");
                  setOpen(true);
                }}>
                  <Plus className="w-4 h-4" />
                  Adicionar Primeiro Fornecedor
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Suppliers;