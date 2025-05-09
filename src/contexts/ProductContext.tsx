
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
}

export interface Category {
  id: string;
  name: string;
}

interface ProductContextType {
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Omit<Category, "id">) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
}

// Dados de exemplo
const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Hambúrgueres" },
  { id: "2", name: "Bebidas" },
  { id: "3", name: "Acompanhamentos" },
  { id: "4", name: "Sobremesas" }
];

const MOCK_PRODUCTS: Product[] = [
  { 
    id: "1", 
    name: "X-Burger", 
    price: 15.90, 
    category: "1",
    description: "Pão, hambúrguer, queijo, alface, tomate e maionese" 
  },
  { 
    id: "2", 
    name: "X-Salada", 
    price: 17.90, 
    category: "1",
    description: "Pão, hambúrguer, queijo, alface, tomate, cebola e maionese" 
  },
  { 
    id: "3", 
    name: "Refrigerante Lata", 
    price: 5.00, 
    category: "2" 
  },
  { 
    id: "4", 
    name: "Batata Frita P", 
    price: 8.90, 
    category: "3" 
  },
  { 
    id: "5", 
    name: "Sorvete", 
    price: 7.90, 
    category: "4" 
  },
];

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);

  const addProduct = (product: Omit<Product, "id">) => {
    const newProduct = {
      ...product,
      id: `prod-${Date.now()}`
    };
    
    setProducts([...products, newProduct]);
    toast.success(`Produto "${newProduct.name}" adicionado com sucesso!`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(products.map(product => 
      product.id === id ? { ...product, ...updates } : product
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

  const value = {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory
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
