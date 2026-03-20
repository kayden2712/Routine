import { create } from 'zustand';
import { products as initialProducts } from '@/lib/mockData';
import type { Product } from '@/types';

interface ProductState {
  products: Product[];
  search: string;
  setSearch: (search: string) => void;
  updateStock: (productId: string, stock: number) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  removeProducts: (productIds: string[]) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: initialProducts,
  search: '',
  setSearch: (search) => set({ search }),
  updateStock: (productId, stock) => {
    set((state) => ({
      products: state.products.map((product) =>
        product.id === productId
          ? {
              ...product,
              stock,
              status: stock <= 0 ? 'out_of_stock' : stock <= product.minStock ? 'inactive' : 'active',
            }
          : product,
      ),
    }));
  },
  addProduct: (product) => {
    set((state) => ({ products: [product, ...state.products] }));
  },
  updateProduct: (product) => {
    set((state) => ({
      products: state.products.map((item) => (item.id === product.id ? product : item)),
    }));
  },
  removeProducts: (productIds) => {
    const removing = new Set(productIds);
    set((state) => ({
      products: state.products.filter((item) => !removing.has(item.id)),
    }));
  },
}));
