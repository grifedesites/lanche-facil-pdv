
import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";

// Tipos
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
  stock?: number; // Quantidade em estoque
  minStock?: number; // Estoque mínimo para alertas
  costPrice?: number; // Preço de custo
  supplier?: string; // Fornecedor
  lastUpdated?: string; // Data da última atualização de estoque
}

export interface Category {
  id: string;
  name: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number; // Positivo para entrada, negativo para saída
  type: "in" | "out" | "adjustment" | "sale";
  reason: string;
  date: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface ProductContextType {
  products: Product[];
  categories: Category[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Omit<Category, "id">) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  updateStock: (id: string, quantity: number, reason: string) => void;
  checkLowStock: () => Product[];
  addSupplier: (supplier: Omit<Supplier, "id">) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getStockMovements: (productId?: string) => StockMovement[];
}

// Dados de exemplo
const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Hambúrgueres" },
  { id: "2", name: "Bebidas" },
  { id: "3", name: "Acompanhamentos" },
  { id: "4", name: "Sobremesas" }
];

const MOCK_SUPPLIERS: Supplier[] = [
  { id: "1", name: "Fornecedor de Carnes", phone: "(11) 98765-4321", email: "carnes@exemplo.com" },
  { id: "2", name: "Distribuidora de Bebidas", phone: "(11) 91234-5678", email: "bebidas@exemplo.com" },
];

const MOCK_PRODUCTS: Product[] = [
  { 
    id: "1", 
    name: "X-Burger", 
    price: 15.90, 
    category: "1",
    description: "Pão, hambúrguer, queijo, alface, tomate e maionese",
    stock: 50,
    minStock: 10,
    costPrice: 7.50,
    supplier: "1",
    lastUpdated: new Date().toISOString()
  },
  { 
    id: "2", 
    name: "X-Salada", 
    price: 17.90, 
    category: "1",
    description: "Pão, hambúrguer, queijo, alface, tomate, cebola e maionese",
    stock: 45,
    minStock: 10,
    costPrice: 8.20,
    supplier: "1",
    lastUpdated: new Date().toISOString()
  },
  { 
    id: "3", 
    name: "Refrigerante Lata", 
    price: 5.00, 
    category: "2",
    stock: 100,
    minStock: 20,
    costPrice: 2.10,
    supplier: "2",
    lastUpdated: new Date().toISOString()
  },
  { 
    id: "4", 
    name: "Batata Frita P", 
    price: 8.90, 
    category: "3",
    stock: 60,
    minStock: 15,
    costPrice: 3.50,
    lastUpdated: new Date().toISOString()
  },
  { 
    id: "5", 
    name: "Sorvete", 
    price: 7.90, 
    category: "4",
    stock: 30,
    minStock: 5,
    costPrice: 3.20,
    lastUpdated: new Date().toISOString()
  },
];

const MOCK_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: "1",
    productId: "1",
    quantity: 50,
    type: "in",
    reason: "Estoque inicial",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "2",
    productId: "2",
    quantity: 45,
    type: "in",
    reason: "Estoque inicial",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "3",
    productId: "3",
    quantity: 100,
    type: "in",
    reason: "Compra de fornecedor",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "4",
    productId: "1",
    quantity: -5,
    type: "out",
    reason: "Venda",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(MOCK_STOCK_MOVEMENTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);

  const addProduct = (product: Omit<Product, "id">) => {
    const newProduct = {
      ...product,
      id: `prod-${Date.now()}`,
      lastUpdated: new Date().toISOString()
    };
    
    setProducts([...products, newProduct]);
    
    // Se houver estoque inicial, registrar movimento
    if (newProduct.stock && newProduct.stock > 0) {
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        quantity: newProduct.stock,
        type: "in",
        reason: "Estoque inicial",
        date: new Date().toISOString()
      };
      
      setStockMovements([...stockMovements, movement]);
    }
    
    toast.success(`Produto "${newProduct.name}" adicionado com sucesso!`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    // Se estiver atualizando o estoque diretamente
    if ('stock' in updates) {
      const currentProduct = products.find(p => p.id === id);
      if (currentProduct) {
        const currentStock = currentProduct.stock || 0;
        const newStock = updates.stock || 0;
        const difference = newStock - currentStock;
        
        if (difference !== 0) {
          // Registrar movimento de estoque para ajuste direto
          const movement: StockMovement = {
            id: `mov-${Date.now()}`,
            productId: id,
            quantity: difference,
            type: "adjustment",
            reason: "Ajuste manual de estoque",
            date: new Date().toISOString()
          };
          
          setStockMovements([...stockMovements, movement]);
        }
      }
    }
    
    setProducts(products.map(product => 
      product.id === id ? { 
        ...product, 
        ...updates, 
        lastUpdated: new Date().toISOString() 
      } : product
    ));
    
    toast.success("Produto atualizado com sucesso!");
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(product => product.id !== id));
    toast.success("Produto removido com sucesso!");
  };

  const addCategory = (category: Omit<Category, "id">) => {
    const newCategory = {
      ...category,
      id: `cat-${Date.now()}`
    };
    
    setCategories([...categories, newCategory]);
    toast.success(`Categoria "${newCategory.name}" adicionada com sucesso!`);
  };

  const updateCategory = (id: string, name: string) => {
    setCategories(categories.map(category => 
      category.id === id ? { ...category, name } : category
    ));
    toast.success("Categoria atualizada com sucesso!");
  };

  const deleteCategory = (id: string) => {
    if (products.some(product => product.category === id)) {
      toast.error("Não é possível excluir uma categoria que contém produtos!");
      return;
    }
    
    setCategories(categories.filter(category => category.id !== id));
    toast.success("Categoria removida com sucesso!");
  };

  // Atualizar estoque com registro de movimentos
  const updateStock = (id: string, quantity: number, reason: string) => {
    const product = products.find(p => p.id === id);
    if (!product) {
      toast.error("Produto não encontrado!");
      return;
    }

    const currentStock = product.stock || 0;
    const newStock = currentStock + quantity;
    
    if (newStock < 0) {
      toast.error(`Estoque insuficiente para o produto "${product.name}"`);
      return;
    }
    
    // Registrar movimento de estoque
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: id,
      quantity,
      type: quantity > 0 ? "in" : "out",
      reason,
      date: new Date().toISOString()
    };
    
    setStockMovements([...stockMovements, movement]);
    
    // Atualizar o produto
    setProducts(products.map(p => 
      p.id === id ? { 
        ...p, 
        stock: newStock,
        lastUpdated: new Date().toISOString()
      } : p
    ));
    
    toast.success(`Estoque atualizado para ${newStock} unidades`);
  };

  // Verificar produtos com estoque baixo
  const checkLowStock = () => {
    return products.filter(
      product => (product.stock !== undefined && product.minStock !== undefined) && 
                 (product.stock <= product.minStock)
    );
  };
  
  // Funções para gerenciar fornecedores
  const addSupplier = (supplier: Omit<Supplier, "id">) => {
    const newSupplier = {
      ...supplier,
      id: `sup-${Date.now()}`
    };
    
    setSuppliers([...suppliers, newSupplier]);
    toast.success(`Fornecedor "${newSupplier.name}" adicionado com sucesso!`);
  };
  
  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(suppliers.map(supplier => 
      supplier.id === id ? { ...supplier, ...updates } : supplier
    ));
    toast.success("Fornecedor atualizado com sucesso!");
  };
  
  const deleteSupplier = (id: string) => {
    if (products.some(product => product.supplier === id)) {
      toast.error("Não é possível excluir um fornecedor vinculado a produtos!");
      return;
    }
    
    setSuppliers(suppliers.filter(supplier => supplier.id !== id));
    toast.success("Fornecedor removido com sucesso!");
  };
  
  // Obter movimentos de estoque (filtrado ou todos)
  const getStockMovements = (productId?: string) => {
    if (productId) {
      return stockMovements.filter(m => m.productId === productId);
    }
    return stockMovements;
  };

  const value = {
    products,
    categories,
    stockMovements,
    suppliers,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    updateStock,
    checkLowStock,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getStockMovements
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export const useProducts = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProducts deve ser usado dentro de um ProductProvider");
  }
  return context;
};
