import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product, ProductSize } from '@/types/customer.types'

interface AddToCartPayload {
  product: Product
  size: ProductSize
  color: string
  quantity?: number
}

interface CartState {
  items: CartItem[]
  addToCart: (payload: AddToCartPayload) => void
  removeFromCart: (productId: string, size: ProductSize, color: string) => void
  updateQuantity: (productId: string, size: ProductSize, color: string, quantity: number) => void
  clearCart: () => void
  getSubtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addToCart: ({ product, size, color, quantity = 1 }) =>
        set((state) => {
          const found = state.items.find(
            (item) => item.productId === product.id && item.size === size && item.color === color,
          )

          if (found) {
            return {
              items: state.items.map((item) =>
                item === found
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              ),
            }
          }

          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                name: product.name,
                image: product.image,
                price: product.price,
                size,
                color,
                quantity,
              },
            ],
          }
        }),
      removeFromCart: (productId, size, color) =>
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.productId === productId && item.size === size && item.color === color),
          ),
        })),
      updateQuantity: (productId, size, color, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.size === size && item.color === color
              ? { ...item, quantity: Math.max(1, quantity) }
              : item,
          ),
        })),
      clearCart: () => set({ items: [] }),
      getSubtotal: () =>
        get().items.reduce((total, item) => total + item.price * item.quantity, 0),
    }),
    {
      name: 'routine-customer-cart',
    },
  ),
)
