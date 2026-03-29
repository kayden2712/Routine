import { create } from 'zustand';
import {
  createProductApi,
  deleteProductApi,
  fetchProductsApi,
  updateProductApi,
  updateProductStockApi,
} from '@/lib/backendApi';
import type { Product } from '@/types';

interface ProductState {
  products: Product[];
  search: string;
  loading: boolean;
  fetchProducts: () => Promise<void>;
  setSearch: (search: string) => void;
  updateStock: (productId: string, stock: number) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  removeProducts: (productIds: string[]) => Promise<void>;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  search: '',
  loading: false,
  fetchProducts: async () => {
    set({ loading: true });
    try {
      const products = await fetchProductsApi();
      set({ products });
    } finally {
      set({ loading: false });
    }
  },
  setSearch: (search) => set({ search }),
  updateStock: async (productId, stock) => {
    const updated = await updateProductStockApi(productId, stock);
    set((state) => ({
      products: state.products.map((product) =>
        product.id === productId
          ? updated
          : product,
      ),
    }));
  },
  addProduct: async (product) => {
    const created = await createProductApi({
      code: product.code,
      name: product.name,
      category: product.category,
      description: '',
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      minStock: product.minStock,
      imageUrl: product.imageUrl,
    });
    set((state) => ({ products: [created, ...state.products] }));
  },
  updateProduct: async (product) => {
    const updated = await updateProductApi(product.id, {
      code: product.code,
      name: product.name,
      category: product.category,
      description: '',
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      minStock: product.minStock,
      imageUrl: product.imageUrl,
    });
    set((state) => ({
      products: state.products.map((item) => (item.id === product.id ? updated : item)),
    }));
  },
  removeProducts: async (productIds) => {
    await Promise.all(productIds.map((id) => deleteProductApi(id)));
    const removing = new Set(productIds);
    set((state) => ({
      products: state.products.filter((item) => !removing.has(item.id)),
    }));
  },
}));
