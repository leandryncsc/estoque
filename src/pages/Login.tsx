import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Package, Users, BarChart3 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [filiais, setFiliais] = useState<any[]>([]);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    type: "vendedor",
    filial_id: ""
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!registerOpen) return;
    (async () => {
      try {
        const adminRes = await fetch('/api/public/check-admin');
        if (adminRes.ok) {
          const adminExists = await adminRes.json();
          setHasAdmin(adminExists);
        }

        const filiaisRes = await fetch('/api/public/filiais');
        if (filiaisRes.ok) {
          const data = await filiaisRes.json();
          setFiliais(data);
        }
      } catch (err) {
        console.error("Erro ao buscar dados públicos", err);
      }
    })();
  }, [registerOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao logar');
      }

      localStorage.setItem('token', data.token);
      window.dispatchEvent(new Event('auth-change'));
      
      const userType = data.user.role;
      if (userType === "vendedor") {
        navigate("/pos");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      setLoginError(error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegisterError(null);
    setRegisterLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerForm.email,
          password: registerForm.password,
          name: registerForm.name,
          role: registerForm.type,
          filial_id: registerForm.type === 'administrador' ? null : registerForm.filial_id
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar');
      }

      setRegisterOpen(false);
      setRegisterForm({ name: "", email: "", password: "", type: "vendedor", filial_id: "" });
      alert("Usuário cadastrado com sucesso! Agora você já pode fazer login.");
    } catch (error: any) {
      setRegisterError(error.message);
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl mb-4 shadow-lg">
            <Package className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">StockPro</h1>
          <p className="text-muted-foreground">Sistema de Gerenciamento de Estoque</p>
        </div>

        <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Fazer Login</CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <Button type="submit" variant="business" className="w-full h-11" disabled={loginLoading}>
                {loginLoading ? "Entrando..." : "Entrar no Sistema"}
              </Button>
              {loginError && <span className="block text-xs text-red-500 text-center mt-2">{loginError}</span>}
            </form>
            <div className="pt-2 text-center">
              <Button variant="outline" className="w-full" onClick={() => setRegisterOpen(true)}>
                Cadastrar Usuário
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Usuário</DialogTitle>
              <DialogDescription>Preencha os dados para criar um novo usuário.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleRegister}>
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Nome completo"
                  value={registerForm.name}
                  onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={registerForm.email}
                  onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
                <div className="mt-2">
                  <Label htmlFor="filial">Filial</Label>
                  <select
                    id="filial"
                    value={registerForm.filial_id}
                    onChange={e => setRegisterForm(f => ({ ...f, filial_id: e.target.value }))}
                    className="w-full border rounded px-3 py-2 bg-background text-foreground border-border focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                  >
                    <option value="">Selecione a filial</option>
                    {filiais.map(filial => (
                      <option key={filial.id} value={filial.id}>{filial.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Defina uma senha"
                  value={registerForm.password}
                  onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo de Usuário</Label>
                <select
                  id="type"
                  className="w-full border rounded px-3 py-2 bg-background text-foreground border-border focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                  value={registerForm.type}
                  onChange={e => setRegisterForm(f => ({ ...f, type: e.target.value }))}
                  required
                >
                  {!hasAdmin && <option value="administrador">Administrador</option>}
                  <option value="vendedor">Vendedor</option>
                </select>
              </div>
              {registerError && <span className="text-xs text-red-500">{registerError}</span>}
              <DialogFooter>
                <Button type="submit" disabled={registerLoading} className="gap-2">
                  {registerLoading ? "Cadastrando..." : "Cadastrar"}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="mt-8 grid grid-cols-2 gap-4 text-center">
          <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-card/50">
            <ShoppingCart className="w-6 h-6 text-primary" />
            <span className="text-sm text-muted-foreground">Mini PDV</span>
          </div>
          <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-card/50">
            <Package className="w-6 h-6 text-accent" />
            <span className="text-sm text-muted-foreground">Estoque</span>
          </div>
          <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-card/50">
            <Users className="w-6 h-6 text-primary" />
            <span className="text-sm text-muted-foreground">Fornecedores</span>
          </div>
          <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-card/50">
            <BarChart3 className="w-6 h-6 text-accent" />
            <span className="text-sm text-muted-foreground">Relatórios</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;