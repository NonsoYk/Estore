import { create } from "zustand";
import type { Product } from "@/api/products"; // adjust if your Product type lives elsewhere

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addProduct: (product: Product) => void;
  incrementProduct: (productId: number) => void;
  decrementProduct: (productId: number) => void;
  removeProduct: (productId: number) => void;
  resetCart: () => void;
};

export const useCart = create<CartState>((set) => ({
  items: [],

  addProduct: (product) =>
    set((state) => {
      const existing = state.items.find(
        (item) => item.product.id === product.id
      );
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { items: [...state.items, { product, quantity: 1 }] };
    }),

  incrementProduct: (productId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ),
    })),

  decrementProduct: (productId) =>
    set((state) => ({
      // dropping to 0 removes the line item from the cart
      items: state.items
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0),
    })),

  removeProduct: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    })),

  resetCart: () => set({ items: [] }),
}));