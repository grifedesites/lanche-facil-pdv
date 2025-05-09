
import React, { useState } from "react";
import AppShell from "@/components/Layout/AppShell";
import { useProducts, Product } from "@/contexts/ProductContext";
import { useOrders, OrderFormItem } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Plus, Minus, Trash, ShoppingCart } from "lucide-react";

const POS: React.FC = () => {
  const { products, categories } = useProducts();
  const { currentOrder, addItem, updateItem, removeItem, clearOrder, completeOrder } = useOrders();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState("");
  const [isEditingItem, setIsEditingItem] = useState(false);

  // Calcular total do pedido
  const orderTotal = currentOrder.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleProductClick = (product: Product) => {
    addItem(product, 1);
  };

  const handleQuantityChange = (index: number, increment: number) => {
    const newQuantity = Math.max(1, currentOrder[index].quantity + increment);
    updateItem(index, newQuantity);
  };

  const handleEditItem = (index: number) => {
    const item = currentOrder[index];
    setEditingItemIndex(index);
    setItemQuantity(item.quantity);
    setItemNotes(item.notes || "");
    setIsEditingItem(true);
  };

  const handleSaveItemEdit = () => {
    if (editingItemIndex !== null) {
      updateItem(editingItemIndex, itemQuantity, itemNotes);
      setIsEditingItem(false);
      setEditingItemIndex(null);
    }
  };

  const handleCheckout = () => {
    if (currentOrder.length === 0) {
      toast.error("Adicione produtos ao pedido antes de finalizar!");
      return;
    }
    setPaymentDialogOpen(true);
  };

  const handleCompleteOrder = () => {
    if (!user) return;
    
    completeOrder(user.id, user.name, paymentMethod);
    setPaymentDialogOpen(false);
    toast.success("Pedido finalizado com sucesso!");
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <AppShell>
      <div className="h-full flex flex-col md:flex-row gap-4">
        {/* Coluna de produtos */}
        <div className="flex flex-col w-full md:w-2/3 h-full">
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={selectedCategory || ""}
              onValueChange={(value) => setSelectedCategory(value || null)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleProductClick(product)}
                >
                  <CardContent className="p-4">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-lg font-semibold text-primary">
                      {formatPrice(product.price)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {categories.find(c => c.id === product.category)?.name || 'Sem categoria'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna do pedido */}
        <div className="w-full md:w-1/3 flex flex-col border rounded-lg shadow-sm">
          <div className="p-4 bg-primary text-primary-foreground rounded-t-lg">
            <h2 className="text-xl font-semibold flex items-center">
              <ShoppingCart className="mr-2" /> Pedido Atual
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {currentOrder.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum item adicionado ao pedido.
              </div>
            ) : (
              <div className="space-y-4">
                {currentOrder.map((item, index) => (
                  <div key={index} className="flex justify-between items-start pb-2 border-b">
                    <div className="flex-1">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatPrice(item.unitPrice)} × {item.quantity}
                      </div>
                      {item.notes && (
                        <div className="text-xs italic text-muted-foreground mt-1">
                          {item.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleQuantityChange(index, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="w-6 text-center">{item.quantity}</div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleQuantityChange(index, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-1"
                        onClick={() => handleEditItem(index)}
                      >
                        <Search className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeItem(index)}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>{formatPrice(orderTotal)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatPrice(orderTotal)}</span>
            </div>
            
            <div className="mt-4 space-y-2">
              <Button onClick={handleCheckout} className="w-full" disabled={currentOrder.length === 0}>
                Finalizar Pedido
              </Button>
              <Button onClick={clearOrder} variant="outline" className="w-full" disabled={currentOrder.length === 0}>
                Limpar Pedido
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de edição de item */}
      <Dialog open={isEditingItem} onOpenChange={setIsEditingItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
          </DialogHeader>
          
          {editingItemIndex !== null && (
            <>
              <div className="space-y-4 py-4">
                <div>
                  <h3 className="font-medium">
                    {currentOrder[editingItemIndex].productName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(currentOrder[editingItemIndex].unitPrice)} cada
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <div className="flex items-center">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setItemQuantity(prev => Math.max(1, prev - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="w-16 text-center">{itemQuantity}</div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setItemQuantity(prev => prev + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-notes">Observações</Label>
                  <Textarea 
                    id="item-notes" 
                    placeholder="Ex: Sem cebola, bem passado, etc." 
                    value={itemNotes} 
                    onChange={(e) => setItemNotes(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditingItem(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveItemEdit}>
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de finalização do pedido */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Pedido</DialogTitle>
            <DialogDescription>
              Selecione o método de pagamento para finalizar o pedido.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="font-medium">Total: {formatPrice(orderTotal)}</div>
            
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCompleteOrder}>
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default POS;
