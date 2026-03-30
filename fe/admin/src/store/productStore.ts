import { create } from 'zustand';
import {
  createProductApi,
  deleteProductApi,
  fetchProductsApi,
  updateProductApi,
  updateProductStockApi,
} from '@/lib/backendApi';
import type { Product } from '@/types';

const DUPLICATE_ERROR_HINTS = ['đã tồn tại', 'trùng', 'already exists', 'duplicate'];

function isDuplicateCodeError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const normalizedMessage = error.message.toLowerCase();
  return DUPLICATE_ERROR_HINTS.some((hint) => normalizedMessage.includes(hint));
}

function buildRetryCode(existingCodes: Set<string>): string {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const nextCode = `SP${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 10)}`;
    if (!existingCodes.has(nextCode)) {
      return nextCode;
    }
  }

  return `SP${Date.now()}${Math.floor(Math.random() * 100)}`;
}

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

export const useProductStore = create<ProductState>((set, get) => ({
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
    const existingCodes = new Set<string>(
      get().products.map((item) => item.code.trim().toUpperCase()),
    );
    let requestCode = product.code.trim().toUpperCase();
    let created: Product | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        created = await createProductApi({
          code: requestCode,
          name: product.name,
          category: product.category,
          gender: product.gender,
          description: product.description ?? '',
          price: product.price,
          oldPrice: product.oldPrice,
          costPrice: product.costPrice,
          stock: product.stock,
          minStock: product.minStock,
          imageUrl: product.imageUrl,
          imageUrls: product.imageUrls,
          sizes: product.sizes ?? product.variants?.map((variant) => variant.size) ?? [],
          colors: product.colors ?? product.variants?.map((variant) => variant.color) ?? [],
          sizeStocks: (product.variants ?? []).reduce<Record<string, number>>((acc, variant) => {
            acc[variant.size] = variant.stock;
            return acc;
          }, {}),
          variants: (product.variants ?? []).map((variant) => ({
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
          })),
        });
        break;
      } catch (error) {
        if (!isDuplicateCodeError(error) || attempt === 1) {
          throw error;
        }

        existingCodes.add(requestCode);
        requestCode = buildRetryCode(existingCodes);
      }
    }

    if (!created) {
      throw new Error('Không thể tạo sản phẩm do trùng mã. Vui lòng thử lại.');
    }

    set((state) => ({ products: [created, ...state.products] }));
  },
  updateProduct: async (product) => {
    const updated = await updateProductApi(product.id, {
      code: product.code,
      name: product.name,
      category: product.category,
      gender: product.gender,
      description: product.description ?? '',
      price: product.price,
      oldPrice: product.oldPrice,
      costPrice: product.costPrice,
      stock: product.stock,
      minStock: product.minStock,
      imageUrl: product.imageUrl,
      imageUrls: product.imageUrls,
      sizes: product.sizes ?? product.variants?.map((variant) => variant.size) ?? [],
      colors: product.colors ?? product.variants?.map((variant) => variant.color) ?? [],
      sizeStocks: (product.variants ?? []).reduce<Record<string, number>>((acc, variant) => {
        acc[variant.size] = variant.stock;
        return acc;
      }, {}),
      variants: (product.variants ?? []).map((variant) => ({
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
      })),
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
