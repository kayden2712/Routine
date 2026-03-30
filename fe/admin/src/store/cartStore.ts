import { create } from 'zustand';
import type { CartItem, Customer, Product } from '@/types';

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

function calculateDiscountAmount(code: string, subtotal: number): number {
  const normalized = code.trim().toUpperCase();

  if (normalized === 'VIP10' || normalized === 'ROUTINE10') {
    return Math.round(subtotal * 0.1);
  }

  if (normalized === 'WELCOME50' || normalized === 'SALE50K') {
    return Math.min(50000, subtotal);
  }

  return 0;
}

interface CartState {
  items: CartItem[];
  customer: Customer | null;
  discountCode: string;
  discountAmount: number;
  addItem: (product: Product, selectedSize?: string, selectedColor?: string) => void;
  removeItem: (productId: string, selectedSize?: string, selectedColor?: string) => void;
  updateQuantity: (productId: string, qty: number, selectedSize?: string, selectedColor?: string) => void;
  setCustomer: (customer: Customer | null) => void;
  applyDiscount: (code: string) => void;
  clearCart: () => void;
  get subtotal(): number;
  get total(): number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  discountCode: '',
  discountAmount: 0,
  addItem: (product, selectedSize, selectedColor) => {
    set((state) => {
      // Create a key that includes product id and selected variants
      const itemKey = `${product.id}:${selectedSize || ''}:${selectedColor || ''}`;
      const existing = state.items.find((item) => {
        const key = `${item.product.id}:${item.selectedSize || ''}:${item.selectedColor || ''}`;
        return key === itemKey;
      });

      const nextItems = existing
        ? state.items.map((item) => {
            const key = `${item.product.id}:${item.selectedSize || ''}:${item.selectedColor || ''}`;
            return key === itemKey
              ? { ...item, quantity: item.quantity + 1 }
              : item;
          })
        : [...state.items, { product, quantity: 1, selectedSize, selectedColor }];

      const nextSubtotal = calculateSubtotal(nextItems);
      return {
        items: nextItems,
        discountAmount: calculateDiscountAmount(state.discountCode, nextSubtotal),
      };
    });
  },
  removeItem: (productId, selectedSize, selectedColor) => {
    set((state) => {
      const itemKey = `${productId}:${selectedSize || ''}:${selectedColor || ''}`;
      const nextItems = state.items.filter((item) => {
        const key = `${item.product.id}:${item.selectedSize || ''}:${item.selectedColor || ''}`;
        return key !== itemKey;
      });
      const nextSubtotal = calculateSubtotal(nextItems);

      return {
        items: nextItems,
        discountAmount: calculateDiscountAmount(state.discountCode, nextSubtotal),
      };
    });
  },
  updateQuantity: (productId, qty, selectedSize, selectedColor) => {
    set((state) => {
      const itemKey = `${productId}:${selectedSize || ''}:${selectedColor || ''}`;
      const nextItems =
        qty <= 0
          ? state.items.filter((item) => {
              const key = `${item.product.id}:${item.selectedSize || ''}:${item.selectedColor || ''}`;
              return key !== itemKey;
            })
          : state.items.map((item) => {
              const key = `${item.product.id}:${item.selectedSize || ''}:${item.selectedColor || ''}`;
              return key === itemKey ? { ...item, quantity: qty } : item;
            });

      const nextSubtotal = calculateSubtotal(nextItems);

      return {
        items: nextItems,
        discountAmount: calculateDiscountAmount(state.discountCode, nextSubtotal),
      };
    });
  },
  setCustomer: (customer) => {
    set({ customer });
  },
  applyDiscount: (code) => {
    const subtotal = calculateSubtotal(get().items);
    const normalized = code.trim().toUpperCase();
    const discountAmount = calculateDiscountAmount(normalized, subtotal);

    set({ discountCode: normalized, discountAmount });
  },
  clearCart: () => {
    set({
      items: [],
      customer: null,
      discountCode: '',
      discountAmount: 0,
    });
  },
  get subtotal() {
    return calculateSubtotal(get().items);
  },
  get total() {
    return Math.max(0, get().subtotal - get().discountAmount);
  },
}));
