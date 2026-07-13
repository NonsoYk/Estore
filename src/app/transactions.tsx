import { useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { router } from "expo-router";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Card } from "@/components/ui/card";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInventoryStore, computeSalesSummary } from "@/store/inventoryStore";

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SummaryRow({
  title,
  summary,
}: {
  title: string;
  summary: {
    totalSales: number;
    totalCollected: number;
    totalDebt: number;
    orderCount: number;
  };
}) {
  return (
    <Card className="mb-3 rounded-lg p-4">
      <Text bold className="mb-2">
        {title} ({summary.orderCount} transaction
        {summary.orderCount === 1 ? "" : "s"})
      </Text>
      <VStack space="xs">
        <HStack className="justify-between">
          <Text size="sm" className="text-typography-500">
            Total sales
          </Text>
          <Text bold size="sm">
            ${summary.totalSales.toFixed(2)}
          </Text>
        </HStack>
        <HStack className="justify-between">
          <Text size="sm" className="text-typography-500">
            Cash collected (what you have)
          </Text>
          <Text bold size="sm" className="text-success-600">
            ${summary.totalCollected.toFixed(2)}
          </Text>
        </HStack>
        <HStack className="justify-between">
          <Text size="sm" className="text-typography-500">
            Outstanding debt
          </Text>
          <Text
            bold
            size="sm"
            className={summary.totalDebt > 0 ? "text-error-600" : ""}
          >
            ${summary.totalDebt.toFixed(2)}
          </Text>
        </HStack>
      </VStack>
    </Card>
  );
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const orders = useInventoryStore((s) => s.orders);
  const payments = useInventoryStore((s) => s.payments);
  const returns = useInventoryStore((s) => s.returns);
  const recordPayment = useInventoryStore((s) => s.recordPayment);
  const recordReturn = useInventoryStore((s) => s.recordReturn);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [paymentInput, setPaymentInput] = useState("");
  const [returnItemId, setReturnItemId] = useState<string | null>(null);
  const [returnQty, setReturnQty] = useState("1");
  const [error, setError] = useState<string | null>(null);

  const todayISO = new Date().toISOString();
  const todaySummary = useMemo(
    () => computeSalesSummary(orders, todayISO),
    [orders, todayISO],
  );
  const overallSummary = useMemo(() => computeSalesSummary(orders), [orders]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [orders],
  );

  const handleToggle = (orderId: string) => {
    setExpandedId(expandedId === orderId ? null : orderId);
    setPaymentInput("");
    setReturnItemId(null);
    setReturnQty("1");
    setError(null);
  };

  const handleRecordPayment = (orderId: string) => {
    setError(null);
    const amount = parseFloat(paymentInput);
    if (!amount || amount <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }
    recordPayment(orderId, amount);
    setPaymentInput("");
  };

  const handleRecordReturn = (orderId: string) => {
    setError(null);
    if (!returnItemId) {
      setError("Pick which item is being returned.");
      return;
    }
    const qty = parseInt(returnQty, 10);
    if (!qty || qty <= 0) {
      setError("Enter a valid return quantity.");
      return;
    }
    recordReturn(orderId, returnItemId, qty);
    setReturnItemId(null);
    setReturnQty("1");
  };

  return (
    <Box className="flex-1 bg-background-0">
      <Box className="px-4 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <HStack className="items-center justify-between">
          <Heading size="lg">Transactions</Heading>
          <Button
            variant="outline"
            size="sm"
            onPress={() => router.push("/inventory")}
          >
            <ButtonText size="sm">Back to Inventory</ButtonText>
          </Button>
        </HStack>
      </Box>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <SummaryRow title="Today" summary={todaySummary} />
        <SummaryRow title="All time" summary={overallSummary} />

        {sortedOrders.length === 0 && (
          <Text className="mt-8 text-center text-typography-500">
            No sales recorded yet. Tap "New Sale" from Inventory to get started.
          </Text>
        )}

        {sortedOrders.map((order) => {
          const expanded = expandedId === order.id;
          const orderPayments = payments
            .filter((p) => p.orderId === order.id)
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            );
          const orderReturns = returns
            .filter((r) => r.orderId === order.id)
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            );
          const returnableItems = order.items.filter(
            (i) => i.quantity - i.returnedQuantity > 0,
          );

          return (
            <Card key={order.id} className="mb-3 rounded-lg p-4">
              <Button
                variant="link"
                className="items-stretch justify-start p-0"
                onPress={() => handleToggle(order.id)}
              >
                <HStack className="w-full items-center justify-between">
                  <VStack className="flex-1">
                    <Text bold>{order.customerName || "Walk-in customer"}</Text>
                    <Text size="sm" className="text-typography-500">
                      {formatTimestamp(order.createdAt)} · {order.items.length}{" "}
                      item{order.items.length === 1 ? "" : "s"}
                    </Text>
                  </VStack>
                  <VStack className="items-end">
                    <Text bold>${order.totalAmount.toFixed(2)}</Text>
                    {order.balance > 0 ? (
                      <Text size="sm" className="text-error-600">
                        Owes ${order.balance.toFixed(2)}
                      </Text>
                    ) : (
                      <Text size="sm" className="text-success-600">
                        Paid in full
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Button>

              {expanded && (
                <VStack
                  className="mt-3 border-t border-outline-200 pt-3"
                  space="md"
                >
                  {/* Contact info if any */}
                  {(order.customerPhone || order.customerAddress) && (
                    <VStack space="xs">
                      {order.customerPhone && (
                        <Text size="sm" className="text-typography-500">
                          Phone: {order.customerPhone}
                        </Text>
                      )}
                      {order.customerAddress && (
                        <Text size="sm" className="text-typography-500">
                          Shop number: {order.customerAddress}
                        </Text>
                      )}
                    </VStack>
                  )}

                  {/* Items */}
                  <VStack space="sm">
                    <Text bold size="sm">
                      Items
                    </Text>
                    {order.items.map((item) => (
                      <HStack
                        key={item.id}
                        className="items-center justify-between rounded-md border border-outline-200 p-2"
                      >
                        <VStack>
                          <Text size="sm" bold>
                            {item.productName} · {item.variantLabel}
                          </Text>
                          <Text size="sm" className="text-typography-500">
                            {item.quantity} × ${item.unitPrice.toFixed(2)}
                            {item.returnedQuantity > 0
                              ? ` · ${item.returnedQuantity} returned`
                              : ""}
                          </Text>
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>

                  {/* Returns history */}
                  {orderReturns.length > 0 && (
                    <VStack space="sm">
                      <Text bold size="sm">
                        Returns
                      </Text>
                      {orderReturns.map((ret) => (
                        <HStack
                          key={ret.id}
                          className="items-center justify-between rounded-md bg-background-50 p-2"
                        >
                          <VStack>
                            <Text size="sm">
                              {ret.productName} · {ret.variantLabel} ×{" "}
                              {ret.quantity}
                            </Text>
                            <Text size="sm" className="text-typography-500">
                              {formatTimestamp(ret.timestamp)}
                            </Text>
                          </VStack>
                          <Text bold size="sm" className="text-error-600">
                            − ${ret.refundAmount.toFixed(2)}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  )}

                  {/* Record a return */}
                  {returnableItems.length > 0 && (
                    <VStack space="sm">
                      <Text bold size="sm">
                        Record a return
                      </Text>
                      <HStack space="sm" className="flex-wrap">
                        {returnableItems.map((item) => (
                          <Button
                            key={item.id}
                            size="sm"
                            variant={
                              returnItemId === item.id ? "solid" : "outline"
                            }
                            onPress={() => setReturnItemId(item.id)}
                          >
                            <ButtonText size="sm">
                              {item.productName} · {item.variantLabel}
                            </ButtonText>
                          </Button>
                        ))}
                      </HStack>
                      {returnItemId && (
                        <HStack space="sm" className="items-center">
                          <Input className="flex-1">
                            <InputField
                              value={returnQty}
                              onChangeText={setReturnQty}
                              keyboardType="number-pad"
                            />
                          </Input>
                          <Button onPress={() => handleRecordReturn(order.id)}>
                            <ButtonText>Confirm Return</ButtonText>
                          </Button>
                        </HStack>
                      )}
                    </VStack>
                  )}

                  {/* Payment history + record payment, only if balance owed */}
                  {order.balance > 0 && (
                    <VStack space="sm">
                      <Text bold size="sm">
                        Payment history
                      </Text>
                      {orderPayments.length === 0 && (
                        <Text size="sm" className="text-typography-500">
                          No payments recorded yet.
                        </Text>
                      )}
                      {orderPayments.map((payment) => (
                        <HStack
                          key={payment.id}
                          className="items-center justify-between rounded-md bg-background-50 p-2"
                        >
                          <Text size="sm" className="text-typography-500">
                            {formatTimestamp(payment.timestamp)}
                          </Text>
                          <Text bold size="sm" className="text-success-600">
                            + ${payment.amount.toFixed(2)}
                          </Text>
                        </HStack>
                      ))}

                      <HStack space="sm">
                        <Input className="flex-1">
                          <InputField
                            value={paymentInput}
                            onChangeText={setPaymentInput}
                            placeholder="Amount"
                            keyboardType="decimal-pad"
                          />
                        </Input>
                        <Button onPress={() => handleRecordPayment(order.id)}>
                          <ButtonText>Save Payment</ButtonText>
                        </Button>
                      </HStack>
                    </VStack>
                  )}

                  {error && (
                    <Text size="sm" className="text-error-600">
                      {error}
                    </Text>
                  )}
                </VStack>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </Box>
  );
}
