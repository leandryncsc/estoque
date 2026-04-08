import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  User, 
  Users,
  Shield, 
  Bell, 
  Database,
  Palette,
  Save,
  Download,
  Upload,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const Settings = () => {
  const [settings, setSettings] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    lowStockAlert: 10,
    enableNotifications: true,
    enableEmailAlerts: false,
    enableLowStockAlerts: true,
    autoBackup: true,
    darkMode: false,
    compactView: false
  });

  const [isEditingInfo, setIsEditingInfo] = useState(false);

  React.useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
          localStorage.setItem('settings', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Erro ao carregar settings', err);
      }
    }
    loadSettings();
  }, []);

  // Salva automaticamente as Informações da Empresa ao alterar qualquer campo
  React.useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings.companyName, settings.companyEmail, settings.companyPhone, settings.companyAddress, settings.lowStockAlert]);

  const { toast } = useToast();

  const handleSave = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        localStorage.setItem('settings', JSON.stringify(settings));
        toast({
          title: "Configurações salvas",
          description: "Suas alterações foram salvas com sucesso no banco de dados.",
        });
      } else {
        throw new Error("Erro ao salvar");
      }
    } catch (err) {
      toast({
        title: "Erro ao salvar",
        description: "Houve um erro ao tentar salvar no banco de dados.",
        variant: "destructive"
      });
    }
  };

  // Filiais
  const [novaFilial, setNovaFilial] = useState({ nome: "", endereco: "" });
  const [erroFilial, setErroFilial] = useState("");
  const [editFilial, setEditFilial] = useState<any>(null);

  // Novo Administrador
  const [novoAdmin, setNovoAdmin] = useState({ name: "", email: "", password: "" });
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [erroAdmin, setErroAdmin] = useState("");

  const [editUsuario, setEditUsuario] = useState<any>(null);

  // Buscar filiais reais do Backend
  const { data: filiais = [], isLoading: loadingFiliais } = useQuery({
    queryKey: ['filiais-settings'],
    queryFn: async () => {
      const res = await fetch('/api/filiais', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!res.ok) throw new Error("Erro ao buscar filiais");
      return await res.json();
    }
  });

  const { data: usuarios = [], isLoading: loadingUsuarios } = useQuery({
    queryKey: ['usuarios-settings'],
    queryFn: async () => {
      const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      return await res.json();
    }
  });

  const queryClient = useQueryClient();

  const handleAddFilial = async () => {
    if (!novaFilial.nome) {
      setErroFilial("Preencha o nome da filial.");
      toast({ title: "Erro ao cadastrar", description: "O nome da filial é obrigatório.", variant: "destructive" });
      return;
    }
    setErroFilial("");
    const res = await fetch('/api/filiais', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novaFilial.nome, endereco: novaFilial.endereco })
    });
    if (res.ok) {
      setNovaFilial({ nome: "", endereco: "" });
      toast({ title: "Filial cadastrada", description: "Filial adicionada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ['filiais-settings'] });
    }
  };

  const handleEditFilial = (filial) => setEditFilial(filial);
  const handleUpdateFilial = async () => {
    const res = await fetch(`/api/filiais/${editFilial.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: editFilial.nome, endereco: editFilial.endereco })
    });
    if (res.ok) {
      setEditFilial(null);
      toast({ title: "Filial atualizada", description: "Dados da filial atualizados." });
      queryClient.invalidateQueries({ queryKey: ['filiais-settings'] });
    }
  };
  const handleDeleteFilial = async (id) => {
    const res = await fetch(`/api/filiais/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) {
      toast({ title: "Filial removida", description: "Filial excluída." });
      queryClient.invalidateQueries({ queryKey: ['filiais-settings'] });
    }
  };

  const handleRegisterAdmin = async () => {
    if(!novoAdmin.name || !novoAdmin.email || !novoAdmin.password) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    setLoadingAdmin(true);
    setErroAdmin("");
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: novoAdmin.email,
        password: novoAdmin.password,
        name: novoAdmin.name
      })
    });
    setLoadingAdmin(false);
    
    if (!res.ok) {
      const err = await res.json();
      setErroAdmin(err.error || 'Erro ao cadastrar');
      toast({ title: "Erro ao cadastrar", description: err.error || 'Erro', variant: "destructive" });
      return;
    }
    
    setNovoAdmin({ name: "", email: "", password: "" });
    toast({ title: "Administrador cadastrado!", description: "Um novo administrador foi criado." });
    queryClient.invalidateQueries({ queryKey: ['usuarios-settings'] });
  };

  const handleDeleteUsuario = async (userId: string) => {
    const confirm = window.confirm("Tem certeza que deseja excluir completamente este usuário?");
    if (!confirm) return;
    const res = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!res.ok) {
      toast({ title: "Erro ao excluir", description: "Falha na exclusão.", variant: "destructive" });
    } else {
      toast({ title: "Usuário excluído", description: "O usuário foi removido permanentemente." });
      queryClient.invalidateQueries({ queryKey: ['usuarios-settings'] });
    }
  };

  const handleUpdateUsuario = async () => {
    if (!editUsuario.name) return;
    
    const payload = {
      name: editUsuario.name,
      role: editUsuario.role,
      filial_id: editUsuario.filial_id || null,
      new_email: editUsuario.new_email || null,
      new_password: editUsuario.new_password || null
    };
    
    const res = await fetch(`/api/users/${editUsuario.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      toast({ title: "Erro", description: "Erro ao atualizar usuário", variant: "destructive" });
      return;
    }

    toast({ title: "Usuário atualizado", description: "As permissões e credenciais foram salvas." });
    setEditUsuario(null);
    queryClient.invalidateQueries({ queryKey: ['usuarios-settings'] });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Cadastro de Filiais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Filiais
          </CardTitle>
          <CardDescription>Cadastre e gerencie suas filiais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulário de cadastro/edição */}
          {editFilial ? (
            <div className="flex gap-2">
              <Input
                placeholder="Nome da filial"
                value={editFilial.nome}
                onChange={e => setEditFilial({ ...editFilial, nome: e.target.value })}
              />
              <Input
                placeholder="Endereço"
                value={editFilial.endereco}
                onChange={e => setEditFilial({ ...editFilial, endereco: e.target.value })}
              />
              <Button onClick={handleUpdateFilial}>Salvar</Button>
              <Button variant="outline" onClick={() => setEditFilial(null)}>Cancelar</Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Nome da filial"
                value={novaFilial.nome}
                onChange={e => setNovaFilial({ ...novaFilial, nome: e.target.value })}
                className={erroFilial ? "border-red-500" : ""}
              />
              <Input
                placeholder="Endereço"
                value={novaFilial.endereco}
                onChange={e => setNovaFilial({ ...novaFilial, endereco: e.target.value })}
              />
              <Button onClick={handleAddFilial}>Cadastrar</Button>
              {erroFilial && (
                <span className="text-red-500 text-sm ml-2">{erroFilial}</span>
              )}
            </div>
          )}
          {/* Listagem de filiais */}
          <div className="space-y-2 mt-4">
            {filiais.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma filial cadastrada.</p>
            ) : (
              filiais.map(filial => (
                <div key={filial.id} className="flex items-center gap-2 border rounded p-2">
                  <span className="font-medium">{filial.nome}</span>
                  <span className="text-sm text-muted-foreground">{filial.endereco}</span>
                  <Button size="sm" variant="outline" onClick={() => handleEditFilial(filial)}>Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteFilial(filial.id)}>Excluir</Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Cadastro de Administradores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Cadastrar Novo Administrador
          </CardTitle>
          <CardDescription>Adicione administradores extras ao sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Nome completo"
              value={novoAdmin.name}
              onChange={e => setNovoAdmin({ ...novoAdmin, name: e.target.value })}
            />
            <Input
              type="email"
              placeholder="E-mail"
              value={novoAdmin.email}
              onChange={e => setNovoAdmin({ ...novoAdmin, email: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Senha"
              value={novoAdmin.password}
              onChange={e => setNovoAdmin({ ...novoAdmin, password: e.target.value })}
            />
            <Button onClick={handleRegisterAdmin} disabled={loadingAdmin}>
              {loadingAdmin ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
          {erroAdmin && <span className="text-red-500 text-sm">{erroAdmin}</span>}
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuários Cadastrados
          </CardTitle>
          <CardDescription>Lista de administradores e vendedores do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usuarios.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum usuário encontrado.</p>
            ) : (
              <div className="grid gap-4">
                {usuarios.map((u: any) => (
                  <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2">
                    {editUsuario && editUsuario.id === u.id ? (
                      <div className="flex flex-col w-full gap-2 p-3 bg-muted/30 rounded border border-border">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input className="flex-1 min-w-[120px]" value={editUsuario.name} onChange={e => setEditUsuario({...editUsuario, name: e.target.value})} placeholder="Nome completo" />
                          <select className="border rounded px-2 h-10 w-full sm:w-[120px] bg-background text-foreground" value={editUsuario.role} onChange={e => setEditUsuario({...editUsuario, role: e.target.value})}>
                            <option value="administrador">Admin</option>
                            <option value="vendedor">Vendedor</option>
                          </select>
                          <select className="border rounded px-2 h-10 w-full sm:w-[140px] bg-background text-foreground" value={editUsuario.filial_id || ""} onChange={e => setEditUsuario({...editUsuario, filial_id: e.target.value || null})}>
                            <option value="">Sem filial</option>
                            {filiais.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 mt-1">
                          <Input type="email" className="flex-1" value={editUsuario.new_email || ""} onChange={e => setEditUsuario({...editUsuario, new_email: e.target.value})} placeholder="Novo e-mail (deixe em branco para ignorar)" />
                          <Input type="password" className="flex-1" value={editUsuario.new_password || ""} onChange={e => setEditUsuario({...editUsuario, new_password: e.target.value})} placeholder="Nova senha (deixe em branco para ignorar)" />
                          <div className="flex gap-1 shrink-0 ml-auto">
                            <Button size="sm" onClick={handleUpdateUsuario}>Salvar</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditUsuario(null)}>Cancelar</Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">ID: {u.user_id?.split('-')[0]}...</p>
                        </div>
                        <div className="flex w-full sm:w-auto flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <div className="text-left sm:text-right flex flex-col justify-center sm:items-end">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${u.role === 'administrador' || u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent-foreground'}`}>
                              {u.role === 'administrador' || u.role === 'admin' ? 'Admin' : 'Vendedor'}
                            </span>
                            {u.filiais?.nome && (
                              <p className="text-xs text-muted-foreground mt-1.5">Filial: {u.filiais.nome}</p>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-1 shrink-0 w-full sm:w-auto">
                            <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setEditUsuario(u)}>Editar</Button>
                            <Button size="sm" variant="destructive" className="w-full sm:w-auto" onClick={() => handleDeleteUsuario(u.user_id)}>Excluir</Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do seu sistema</p>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações da Empresa
            </CardTitle>
            <CardDescription className="mt-1">
              Configure os dados da sua empresa
            </CardDescription>
          </div>
          <div>
            {!isEditingInfo ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditingInfo(true)} className="gap-2">
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditingInfo(false)}>Cancelar</Button>
                <Button size="sm" onClick={async () => {
                  await handleSave();
                  setIsEditingInfo(false);
                }} className="gap-2">
                  <Save className="w-4 h-4" />
                  Salvar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input
                id="company-name"
                value={settings.companyName}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  companyName: e.target.value 
                }))}
                placeholder="Nome da sua empresa"
                disabled={!isEditingInfo}
                className={!isEditingInfo ? "bg-muted text-muted-foreground" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">Email</Label>
              <Input
                id="company-email"
                type="email"
                value={settings.companyEmail}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  companyEmail: e.target.value 
                }))}
                placeholder="email@empresa.com"
                disabled={!isEditingInfo}
                className={!isEditingInfo ? "bg-muted text-muted-foreground" : ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-phone">Telefone</Label>
              <Input
                id="company-phone"
                value={settings.companyPhone}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  companyPhone: e.target.value 
                }))}
                placeholder="(11) 99999-9999"
                disabled={!isEditingInfo}
                className={!isEditingInfo ? "bg-muted text-muted-foreground" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="low-stock-alert">Alerta de Estoque Baixo</Label>
              <Input
                id="low-stock-alert"
                type="number"
                value={settings.lowStockAlert}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  lowStockAlert: parseInt(e.target.value) || 0
                }))}
                placeholder="10"
                disabled={!isEditingInfo}
                className={!isEditingInfo ? "bg-muted text-muted-foreground" : ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-address">Endereço</Label>
            <Input
              id="company-address"
              value={settings.companyAddress}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                companyAddress: e.target.value 
              }))}
              placeholder="Endereço completo da empresa"
              disabled={!isEditingInfo}
              className={!isEditingInfo ? "bg-muted text-muted-foreground" : ""}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default Settings;