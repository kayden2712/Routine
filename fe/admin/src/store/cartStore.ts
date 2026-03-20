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
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
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
  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((item) => item.product.id === product.id);
      const nextItems = existing
        ? state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...state.items, { product, quantity: 1 }];

      const nextSubtotal = calculateSubtotal(nextItems);
      return {
        items: nextItems,
        discountAmount: calculateDiscountAmount(state.discountCode, nextSubtotal),
      };
    });
  },
  removeItem: (productId) => {
    set((state) => {
      const nextItems = state.items.filter((item) => item.product.id !== productId);
      const nextSubtotal = calculateSubtotal(nextItems);

      return {
        items: nextItems,
        discountAmount: calculateDiscountAmount(state.discountCode, nextSubtotal),
      };
    });
  },
  updateQuantity: (productId, qty) => {
    set((state) => {
      const nextItems =
        qty <= 0
          ? state.items.filter((item) => item.product.id !== productId)
          : state.items.map((item) =>
              item.product.id === productId ? { ...item, quantity: qty } : item,
            );

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
