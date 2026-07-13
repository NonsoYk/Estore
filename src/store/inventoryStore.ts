import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Product,
  Variant,
  StockMovement,
  StockMovementType,
  Order,
  OrderItem,
  Payment,
  Return,
  generateId,
} from "@/types/inventory";

type InventoryState = {
  products: Product[];
  movements: StockMovement[];
  orders: Order[];
  payments: Payment[];
  returns: Return[];

  addProduct: (input: {
    name: string;
    brand?: string;
    costPrice?: number;
    sellingPrice: number;
    image?: string;
    variants?: {
      size: string;
      color: string;
      quantity: number;
      lowStockThreshold?: number;
    }[];
  }) => string;

  updateProduct: (
    productId: string,
    updates: Partial<
      Pick<Product, "name" | "brand" | "costPrice" | "sellingPrice" | "image">
    >,
  ) => void;

  deleteProduct: (productId: string) => void;

  addVariant: (
    productId: string,
    variant: {
      size: string;
      color: string;
      quantity: number;
      lowStockThreshold?: number;
    },
  ) => void;

  deleteVariant: (productId: string, variantId: string) => void;

  adjustStock: (
    productId: string,
    variantId: string,
    change: number,
    type: StockMovementType,
    note?: string,
  ) => void;

  // Records a full customer order (one or many items across many products),
  // reduces stock for each item sold, and tracks payment/credit if the
  // customer didn't pay in full. This is the digital replacement for the
  // paper sales notebook. Works for walk-in sales too — customerName is
  // optional unless there's a balance owed (enforced in the UI).
  addOrder: (input: {
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    items: {
      productId: string;
      variantId: string;
      quantity: number;
      unitPrice: number;
    }[];
    amountPaid: number;
  }) => string;

  getOutstandingOrders: () => Order[];

  // Records a payment against one specific order (not spread across a
  // customer's whole history) — matches the "tap a transaction, log a
  // payment against it" flow of the Transactions register.
  recordPayment: (orderId: string, amount: number) => void;

  // Records a return of some quantity of one line item within an order.
  // Validated against what was actually purchased (and not already
  // returned) on that exact line, so a customer can't "return" a color
  // they never bought. Restocks the item and reduces the order's total.
  recordReturn: (
    orderId: string,
    orderItemId: string,
    quantity: number,
  ) => void;

  getPaymentsForOrder: (orderId: string) => Payment[];
  getReturnsForOrder: (orderId: string) => Return[];

  getLowStockVariants: () => { product: Product; variant: Variant }[];
  searchProducts: (query: string) => Product[];
};

// Combines customer name + shop number into one matching key, so two
// different customers who happen to share a first name aren't merged
// into the same credit account. Both are normalized (trimmed, lowercased)
// so small formatting differences don't create duplicate accounts.
export function buildCustomerKey(name?: string, shopNumber?: string): string {
  const n = (name ?? "").trim().toLowerCase();
  const s = (shopNumber ?? "").trim().toLowerCase();
  return `${n}|${s}`;
}

// Pure function, safe to use with useMemo(() => computeLowStockVariants(products), [products]).
// Do not use store.getLowStockVariants() directly as a live selector — it
// builds new objects every call, which causes an infinite render loop when
// used as a live Zustand selector.
export function computeLowStockVariants(products: Product[]) {
  const result: { product: Product; variant: Variant }[] = [];
  products.forEach((product) => {
    product.variants.forEach((variant) => {
      if (variant.quantity <= variant.lowStockThreshold) {
        result.push({ product, variant });
      }
    });
  });
  return result;
}

function isSameDay(isoA: string, isoB: string) {
  return isoA.slice(0, 10) === isoB.slice(0, 10);
}

export type SalesSummary = {
  totalSales: number; // net of returns
  totalCollected: number; // cash actually received — "how much money we have"
  totalDebt: number; // outstanding balance — "how much we're owed"
  orderCount: number;
};

// Pure function — use via useMemo(() => computeSalesSummary(orders), [orders])
// for "today", or pass no date filter for all-time totals.
export function computeSalesSummary(
  orders: Order[],
  onlyDateISO?: string,
): SalesSummary {
  const relevant = onlyDateISO
    ? orders.filter((o) => isSameDay(o.createdAt, onlyDateISO))
    : orders;

  return relevant.reduce<SalesSummary>(
    (acc, o) => ({
      totalSales: acc.totalSales + o.totalAmount,
      totalCollected: acc.totalCollected + o.amountPaid,
      totalDebt: acc.totalDebt + o.balance,
      orderCount: acc.orderCount + 1,
    }),
    { totalSales: 0, totalCollected: 0, totalDebt: 0, orderCount: 0 },
  );
}

// Sales total per day for the last N days (oldest to newest), for a bar
// chart. Days with no sales still appear with a value of 0.
export function computeDailySalesTrend(orders: Order[], days: number = 7) {
  const results: { label: string; dateISO: string; total: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateISO = d.toISOString();
    const total = orders
      .filter((o) => isSameDay(o.createdAt, dateISO))
      .reduce((sum, o) => sum + o.totalAmount, 0);
    results.push({
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      dateISO,
      total,
    });
  }
  return results;
}

// Best-selling products by quantity sold (net of returns), for a leaderboard.
export function computeTopProducts(orders: Order[], limit: number = 5) {
  const map = new Map<
    string,
    { productName: string; unitsSold: number; revenue: number }
  >();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const netQty = item.quantity - item.returnedQuantity;
      if (netQty <= 0) return;
      const existing = map.get(item.productId);
      const revenue = netQty * item.unitPrice;
      if (existing) {
        existing.unitsSold += netQty;
        existing.revenue += revenue;
      } else {
        map.set(item.productId, {
          productName: item.productName,
          unitsSold: netQty,
          revenue,
        });
      }
    });
  });

  return Array.from(map.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, limit);
}

// Total retail value currently sitting in stock (units × selling price).
export function computeInventoryValue(products: Product[]) {
  return products.reduce(
    (sum, p) =>
      sum + p.variants.reduce((s, v) => s + v.quantity * p.sellingPrice, 0),
    0,
  );
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      products: [],
      movements: [],
      orders: [],
      payments: [],
      returns: [],

      addProduct: (input) => {
        const now = new Date().toISOString();
        const id = generateId();

        const variants: Variant[] = (input.variants ?? []).map((v) => ({
          id: generateId(),
          size: v.size,
          color: v.color,
          quantity: v.quantity,
          lowStockThreshold: v.lowStockThreshold ?? 5,
          updatedAt: now,
        }));

        const product: Product = {
          id,
          name: input.name,
          brand: input.brand,
          costPrice: input.costPrice,
          sellingPrice: input.sellingPrice,
          image: input.image,
          variants,
          createdAt: now,
          updatedAt: now,
          syncStatus: "pending",
        };

        set((state) => ({ products: [...state.products, product] }));
        return id;
      },

      updateProduct: (productId, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId
              ? { ...p, ...updates, updatedAt: now, syncStatus: "pending" }
              : p,
          ),
        }));
      },

      deleteProduct: (productId) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== productId),
          movements: state.movements.filter((m) => m.productId !== productId),
        }));
      },

      addVariant: (productId, variant) => {
        const now = new Date().toISOString();
        const newVariant: Variant = {
          id: generateId(),
          size: variant.size,
          color: variant.color,
          quantity: variant.quantity,
          lowStockThreshold: variant.lowStockThreshold ?? 5,
          updatedAt: now,
        };

        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  variants: [...p.variants, newVariant],
                  updatedAt: now,
                  syncStatus: "pending",
                }
              : p,
          ),
        }));

        // log the initial stock as a restock movement so history is complete
        if (variant.quantity > 0) {
          set((state) => ({
            movements: [
              ...state.movements,
              {
                id: generateId(),
                productId,
                variantId: newVariant.id,
                type: "restock",
                change: variant.quantity,
                note: "Initial stock",
                timestamp: now,
              },
            ],
          }));
        }
      },

      deleteVariant: (productId, variantId) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId
              ? { ...p, variants: p.variants.filter((v) => v.id !== variantId) }
              : p,
          ),
          movements: state.movements.filter((m) => m.variantId !== variantId),
        }));
      },

      adjustStock: (productId, variantId, change, type, note) => {
        const now = new Date().toISOString();

        set((state) => ({
          products: state.products.map((p) => {
            if (p.id !== productId) return p;
            return {
              ...p,
              updatedAt: now,
              syncStatus: "pending",
              variants: p.variants.map((v) =>
                v.id === variantId
                  ? {
                      ...v,
                      quantity: Math.max(0, v.quantity + change),
                      updatedAt: now,
                    }
                  : v,
              ),
            };
          }),
          movements: [
            ...state.movements,
            {
              id: generateId(),
              productId,
              variantId,
              type,
              change,
              note,
              timestamp: now,
            },
          ],
        }));
      },

      addOrder: (input) => {
        const now = new Date().toISOString();
        const orderId = generateId();
        const products = get().products;

        const orderItems: OrderItem[] = input.items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          const variant = product?.variants.find(
            (v) => v.id === item.variantId,
          );
          return {
            id: generateId(),
            productId: item.productId,
            productName: product?.name ?? "Unknown product",
            variantId: item.variantId,
            variantLabel: variant
              ? `${variant.size} · ${variant.color}`
              : "Unknown variant",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            returnedQuantity: 0,
          };
        });

        const totalAmount = orderItems.reduce(
          (sum, i) => sum + i.quantity * i.unitPrice,
          0,
        );
        const balance = Math.max(0, totalAmount - input.amountPaid);
        const status: Order["status"] = balance > 0 ? "partial" : "paid";

        const order: Order = {
          id: orderId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerAddress: input.customerAddress,
          items: orderItems,
          totalAmount,
          amountPaid: input.amountPaid,
          balance,
          status,
          createdAt: now,
        };

        // Reduce stock for every item in the order, one movement per line.
        input.items.forEach((item) => {
          get().adjustStock(
            item.productId,
            item.variantId,
            -Math.abs(item.quantity),
            "sale",
            input.customerName
              ? `Sale to ${input.customerName}`
              : "Sale (walk-in)",
          );
        });

        set((state) => ({ orders: [...state.orders, order] }));
        return orderId;
      },

      getOutstandingOrders: () => {
        return get().orders.filter((o) => o.status === "partial");
      },

      recordPayment: (orderId, amount) => {
        if (amount <= 0) return;
        const now = new Date().toISOString();
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order || order.balance <= 0) return;

        const applied = Math.min(amount, order.balance);

        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const newAmountPaid = o.amountPaid + applied;
            const newBalance = o.balance - applied;
            return {
              ...o,
              amountPaid: newAmountPaid,
              balance: newBalance,
              status: newBalance <= 0 ? "paid" : "partial",
            };
          }),
          payments: [
            ...s.payments,
            { id: generateId(), orderId, amount: applied, timestamp: now },
          ],
        }));
      },

      recordReturn: (orderId, orderItemId, quantity) => {
        if (quantity <= 0) return;
        const now = new Date().toISOString();
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;
        const item = order.items.find((i) => i.id === orderItemId);
        if (!item) return;

        const remainingReturnable = item.quantity - item.returnedQuantity;
        const applied = Math.min(quantity, remainingReturnable);
        if (applied <= 0) return;

        const refundAmount = applied * item.unitPrice;

        set((s) => ({
          orders: s.orders.map((o): Order => {
            // 1. Added explicit return type to map
            if (o.id !== orderId) return o;

            const updatedItems = o.items.map((i) =>
              i.id === orderItemId
                ? { ...i, returnedQuantity: i.returnedQuantity + applied }
                : i,
            );

            const newTotalAmount = Math.max(0, o.totalAmount - refundAmount);
            const newBalance = Math.max(0, o.balance - refundAmount);
            const overPaidDifference = refundAmount - o.balance;
            const newAmountPaid =
              overPaidDifference > 0
                ? Math.max(0, o.amountPaid - overPaidDifference)
                : o.amountPaid;

            return {
              ...o,
              items: updatedItems,
              totalAmount: newTotalAmount,
              amountPaid: newAmountPaid,
              balance: newBalance,
              status: (newBalance <= 0 ? "paid" : "partial") as Order["status"], // 2. Explicitly cast type literal
            };
          }),
          returns: [
            ...s.returns,
            {
              id: generateId(),
              orderId,
              orderItemId,
              productName: item.productName,
              variantLabel: item.variantLabel,
              quantity: applied,
              refundAmount,
              timestamp: now,
            },
          ],
        }));

        // Changed type to "restock" to correctly match StockMovementType from types definition
        get().adjustStock(
          item.productId,
          item.variantId,
          applied,
          "restock",
          `Return from order #${orderId}`,
        );
      },

      getPaymentsForOrder: (orderId) => {
        return get().payments.filter((p) => p.orderId === orderId);
      },

      getReturnsForOrder: (orderId) => {
        return get().returns.filter((r) => r.orderId === orderId);
      },

      getLowStockVariants: () => {
        return computeLowStockVariants(get().products);
      },

      searchProducts: (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return get().products;
        return get().products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.brand?.toLowerCase().includes(q),
        );
      },
    }),
    {
      name: "inventory-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
