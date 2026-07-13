export type SyncStatus = "synced" | "pending" | "conflict";

export type Variant = {
  id: string;
  size: string;
  color: string;
  quantity: number;
  lowStockThreshold: number;
  updatedAt: string;
};

export type Product = {
  id: string;
  name: string;
  brand?: string;
  costPrice?: number;
  sellingPrice: number;
  image?: string;
  variants: Variant[];
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
};

export type StockMovementType = "restock" | "sale" | "adjustment";

export type StockMovement = {
  id: string;
  productId: string;
  variantId: string;
  type: StockMovementType;
  change: number; // positive for restock, negative for sale/outgoing adjustment
  note?: string;
  timestamp: string;
};

// A single line in a customer order, e.g. "Gucci bag, Black, qty 10 @ 5000"
export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string; // e.g. "Black" or "10 · Black"
  quantity: number;
  unitPrice: number;
  // Units of this line item that have since been returned. Kept at the
  // line level (not the order level) so partial returns of a multi-item
  // order only affect the specific product/variant that came back.
  returnedQuantity: number;
};

export type PaymentStatus = "paid" | "partial";

// Represents one customer visit/order, which can contain many items
// across many products (this replaces the paper sales notebook).
export type Order = {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: OrderItem[];
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: PaymentStatus;
  createdAt: string;
};

// A single installment payment made against ONE specific order — matches
// the "tap a transaction, log a payment against it" flow on the Debtors /
// Transactions screens. Not spread across a customer's whole history.
export type Payment = {
  id: string;
  orderId: string;
  amount: number;
  timestamp: string;
};

// A return of some quantity from one line item within an order. Validated
// against what was actually purchased (and not already returned) on that
// exact line — restocks the item and reduces the order's total/balance.
export type Return = {
  id: string;
  orderId: string;
  orderItemId: string;
  quantity: number;
  productName: string;
  variantLabel: string;
  refundAmount: number;
  timestamp: string;
};

export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
