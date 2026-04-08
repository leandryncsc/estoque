interface Profile {
  filial_id: string;
}
import { useState, useEffect } from "react";
import { useUserType } from "@/hooks/useUserType";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  Search, 
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  User,
  Package,
  Printer
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number;
  stock_quantity: number;
  category: string | null;
  filial_id: string | null;
}

interface CartItem extends Product {
  quantity: number;
}

const ImprovedMiniPOS = () => {
  const { type: userType, user } = useUserType();
  const [filialId, setFilialId] = useState<string>("all");
  const [filiais, setFiliais] = useState<any[]>([]);
  const [filialNome, setFilialNome] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/public/filiais');
        if (response.ok) {
          const filiaisData = await response.json();
          setFiliais(filiaisData);
        }
      } catch (err) {}

      if (!user) {
        setFilialId("");
        return;
      }
      
      const filial_id = user.filial_id;
      if (!filial_id) {
        setFilialId(userType === 'administrador' ? "all" : "");
        return;
      }
      if (userType === 'administrador') {
        setFilialId("all");
      } else {
        setFilialId(filial_id);
      }
    })();
  }, [userType, user]);

  useEffect(() => {
    if (!filialId || filialId === "all") return;
    const filial = filiais.find(f => f.id === filialId);
    if (filial) {
      setFilialNome(filial.nome);
    }
  }, [filialId, filiais]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix'>("dinheiro");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [completedSaleData, setCompletedSaleData] = useState<any>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [printFormat, setPrintFormat] = useState<'80mm' | 'a4'>('80mm');
  const { toast, dismiss } = useToast();
  const queryClient = useQueryClient();

  // Load products filtrando por filial
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', filialId, userType],
    queryFn: async () => {
      const response = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar produtos');
      let data: Product[] = await response.json();
      
      if (userType === 'administrador') {
        if (filialId && filialId !== "all") {
          data = data.filter(p => p.filial_id === filialId);
        }
      } else {
        if (filialId && filialId !== "all") {
          data = data.filter(p => !p.filial_id || p.filial_id === filialId);
        }
      }
      
      return data;
    },
    enabled: true
  });

  // Load store settings for receipt
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar configurações');
      return await response.json();
    }
  });

  // Process sale mutation
  const processSaleMutation = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error("Carrinho vazio");
      const total = getTotal();
      const actualFilialId = (!filialId || filialId === "all") ? null : filialId;

      const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: Number(item.sale_price)
      }));

      const payload = {
        total_amount: total,
        payment_method: selectedPayment,
        customer_id: null,
        filial_id: actualFilialId,
        items
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro processando a venda');
      }

      return await response.json();
    },
    onSuccess: (sale) => {
      setCompletedSaleData({
        cart: [...cart],
        total: getTotal(),
        payment: selectedPayment,
        date: new Date().toISOString(),
        id: sale.id,
        amountPaid: amountPaid,
        change: Math.max(0, amountPaid - getTotal())
      });
      setShowReceiptDialog(true);
      toast({
        title: "Venda realizada com sucesso!",
        description: `Venda ${sale.id.slice(-8)} processada com sucesso.`,
      });
      setCart([]);
      setAmountPaid(0);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao processar venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products?.filter(product =>
    (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    ) && (
      userType !== 'vendedor' ||
      filialId === 'all' ||
      filialId === '' ||
      product.filial_id === filialId || 
      product.filial_id === null || 
      product.filial_id === ''
    )
  ) || [];

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${product.stock_quantity} unidades disponíveis.`,
          variant: "destructive",
        });
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }

    const product = cart.find(item => item.id === id);
    if (product && newQuantity > product.stock_quantity) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${product.stock_quantity} unidades disponíveis.`,
        variant: "destructive",
      });
      return;
    }

    setCart(cart.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (Number(item.sale_price) * item.quantity), 0);
  };

  const getChange = () => {
    return Math.max(0, amountPaid - getTotal());
  };

  const clearCart = () => {
    setCart([]);
  };

  const processPayment = () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho para finalizar a venda.",
        variant: "destructive",
      });
      return;
    }

    // Filial is not mandatory anymore
    // if (!filialId || filialId === "all") {
    //   toast({
    //     title: "Selecione uma filial",
    //     description: "Escolha uma filial para finalizar a venda.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    if (selectedPayment === 'dinheiro' && amountPaid < getTotal()) {
      toast({
        title: "Valor insuficiente",
        description: "O valor pago deve ser igual ou maior que o total.",
        variant: "destructive",
      });
      return;
    }

    processSaleMutation.mutate();
  };

  const paymentIcons = {
    dinheiro: Banknote,
    cartao_credito: CreditCard,
    cartao_debito: CreditCard,
    pix: Smartphone
  };

  const PaymentIcon = paymentIcons[selectedPayment];

  return (
    <>
      <div className="h-full flex gap-6 print:hidden">
      {/* Products Section */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Produtos</h2>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar produtos por nome ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products Grid */}
        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => addToCart(product)}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {product.stock_quantity}
                      </Badge>
                    </div>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-primary">
                        {product.sale_price != null
                          ? Number(product.sale_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : 'R$ 0,00'}
                      </p>
                      <Button size="sm" className="gap-1">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loadingProducts && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Tente ajustar o termo de busca" : "Nenhum produto com estoque disponível"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cart Section */}
      <div className="w-96 space-y-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrinho ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Cart Items */}
            <div className="max-h-64 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Carrinho vazio</p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {Number(item.sale_price).toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Payment Section */}
            <div className="p-6 space-y-4">
              {/* Total */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">
                    {getTotal().toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </span>
                </div>
              </div>

              {/* Filial Selection */}
              {filiais.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filial (Opcional):</label>
                  <Select
                    value={filialId}
                    onValueChange={setFilialId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todas as filiais" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Nenhuma / Todas as filiais</SelectItem>
                      {filiais.map(filial => (
                        <SelectItem key={filial.id} value={filial.id}>{filial.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Forma de Pagamento:</label>
                <Select value={selectedPayment} onValueChange={(value: any) => setSelectedPayment(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" />
                        <span>Dinheiro</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cartao_credito">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>Cartão de Crédito</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cartao_debito">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>Cartão de Débito</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pix">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        <span>PIX</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Money Payment */}
              {selectedPayment === 'dinheiro' && (
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
                  <label className="text-sm font-medium">Valor Recebido (Dinheiro):</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amountPaid || ""}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    placeholder={`Ex: ${getTotal().toFixed(2)}`}
                    className="text-lg font-semibold h-12"
                  />
                  
                  <div className="flex justify-between items-center bg-background p-2 rounded border mt-2">
                    <span className="font-medium text-sm">Troco a devolver:</span>
                    <span className={`font-bold text-lg ${getChange() > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {getChange().toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </span>
                  </div>

                  {amountPaid > 0 && amountPaid < getTotal() && (
                    <div className="text-destructive text-sm font-medium mt-1">
                      Falta receber: {(getTotal() - amountPaid).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  className="w-full gap-2" 
                  size="lg"
                  onClick={processPayment}
                  disabled={cart.length === 0 || processSaleMutation.isPending}
                >
                  <PaymentIcon className="w-4 h-4" />
                  {processSaleMutation.isPending ? "Processando..." : "Finalizar Venda"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  Limpar Carrinho
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

      {/* Dialog for Receipt */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Venda Finalizada!</DialogTitle>
            <DialogDescription>Deseja imprimir o cupom não fiscal/recibo desta venda?</DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-3">
              <label className="text-sm font-medium">Formato de Impressão</label>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                   variant={printFormat === '80mm' ? 'default' : 'outline'} 
                   onClick={() => setPrintFormat('80mm')}
                   className="flex flex-col h-auto py-4 gap-2"
                >
                  <Receipt className="w-6 h-6" />
                  <span>Bobina 80mm</span>
                  <span className="text-xs font-normal opacity-70">PDV / ECF</span>
                </Button>
                <Button 
                   variant={printFormat === 'a4' ? 'default' : 'outline'} 
                   onClick={() => setPrintFormat('a4')}
                   className="flex flex-col h-auto py-4 gap-2"
                >
                  <Printer className="w-6 h-6" />
                  <span>Folha A4</span>
                  <span className="text-xs font-normal opacity-70">Impressora comum</span>
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              Novo Pedido
            </Button>
            <Button className="gap-2" onClick={() => {
              // Limpar avisos/toasts antes da impressão
              dismiss(); 
              // Fechar o próprio dialog de impressão antes de abrir a janela do sistema
              setShowReceiptDialog(false);
              // Pequeno atraso para a animação do dialog/toast sumir da tela
              setTimeout(() => {
                window.print();
              }, 300);
            }}>
              <Printer className="w-4 h-4" />
              Imprimir Cupom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print-only Receipt (Cupom) */}
      {completedSaleData && (
        <>
          {/* Dynamic Page Styling for Print Roll format */}
          {printFormat === '80mm' && (
            <style type="text/css" media="print">
              {`@page { size: 80mm auto; margin: 0; }`}
            </style>
          )}

          <div className={cn(
            "hidden print:block text-black bg-white p-4 font-mono leading-tight mx-auto",
            printFormat === '80mm' ? "w-[80mm] text-[11px]" : "w-full max-w-3xl text-[14px]"
          )} style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <div className="text-center mb-4">
              <p className={cn("font-bold uppercase", printFormat === '80mm' ? "text-sm" : "text-xl")}>{settings?.companyName || "LOJA DEMO (STOCKPRO)"}</p>
              <p>{settings?.companyAddress || "Endereço não informado"}</p>
              <p>Telefone: {settings?.companyPhone || "Não informado"}</p>
            <div className="border-b border-dashed border-black my-2"></div>
            <p>{format(new Date(completedSaleData.date), "dd/MM/yyyy HH:mm:ss")} CCF:{completedSaleData.id.slice(-6).toUpperCase()}</p>
              <p className={cn("font-bold my-1", printFormat === '80mm' ? "text-sm" : "text-lg")}>CUPOM NÃO FISCAL</p>
          </div>
          
          <div className="border-b border-dashed border-black mb-2"></div>
          
          <div className="w-full">
            <div className="flex justify-between font-bold pb-1 text-[10px]">
              <div className="w-[12%]">ITEM</div>
              <div className="w-[33%]">CÓDIGO</div>
              <div className="w-[55%] text-right">DESCRIÇÃO</div>
            </div>
            <div className="flex justify-between font-bold pb-1 text-[10px]">
              <div className="w-[20%] text-right pr-2">QTD.</div>
              <div className="w-[10%]">UN.</div>
              <div className="w-[35%] text-right">VL.UNIT(R$)</div>
              <div className="w-[35%] text-right">VL.ITEM(R$)</div>
            </div>
            
            <div className="border-b border-dashed border-black mb-2"></div>
            
            {completedSaleData.cart.map((item: any, index: number) => (
              <div key={index} className={cn("mb-1", printFormat === '80mm' ? "text-[10px]" : "text-[12px]")}>
                <div className="flex justify-between">
                  <div className="w-[12%]">{String(index + 1).padStart(3, '0')}</div>
                  <div className="w-[33%]">{item.sku || 'S/N'}</div>
                  <div className="w-[55%] truncate text-right">{item.name.toUpperCase()}</div>
                </div>
                <div className="flex justify-between">
                  <div className="w-[20%] text-right pr-2">{item.quantity}</div>
                  <div className="w-[10%]">UN x</div>
                  <div className="w-[35%] text-right">{Number(item.sale_price).toFixed(2).replace('.', ',')}</div>
                  <div className="w-[35%] text-right">{(item.quantity * Number(item.sale_price)).toFixed(2).replace('.', ',')}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-b border-dashed border-black my-2"></div>
          
          <div className={cn("flex justify-between font-bold", printFormat === '80mm' ? "text-sm" : "text-lg")}>
            <span>TOTAL R$</span>
            <span>{completedSaleData.total.toFixed(2).replace('.', ',')}</span>
          </div>
          
          <div className="flex justify-between mt-1">
            <span className={cn("capitalize", printFormat === '80mm' ? "text-xs" : "text-sm")}>{completedSaleData.payment.replace('_', ' ')}</span>
            <span>{completedSaleData.amountPaid > 0 ? completedSaleData.amountPaid.toFixed(2).replace('.', ',') : completedSaleData.total.toFixed(2).replace('.', ',')}</span>
          </div>
          
          {completedSaleData.change > 0 && (
            <div className={cn("flex justify-between", printFormat === '80mm' ? "text-xs" : "text-sm")}>
              <span>Troco</span>
              <span>{completedSaleData.change.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          
          <div className="border-b border-dashed border-black my-2"></div>
          <div className="text-center mt-4">
            <div className="border-t border-b border-solid border-black py-1 my-2">
              <p className={cn("font-bold", printFormat === '80mm' ? "text-sm" : "text-lg")}>*** CUPOM NÃO FISCAL ***</p>
            </div>
            <p>Obrigado pela preferência!</p>
            <p>Volte sempre!</p>
          </div>
        </div>
      </>
      )}
    </>
  );
};

export default ImprovedMiniPOS;