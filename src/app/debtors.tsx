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
import { useInventoryStore } from "@/store/inventoryStore";

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

export default function DebtorsScreen() {
  const insets = useSafeAreaInsets();
  const orders = useInventoryStore((s) => s.orders);
  const payments = useInventoryStore((s) => s.payments);
  const recordPayment = useInventoryStore((s) => s.recordPayment);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [paymentInput, setPaymentInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Debtors only — sorted by who owes the most, so the biggest outstanding
  // amounts surface first. This is deliberately separate from the full
  // Transactions ledger, which shows every sale regardless of balance.
  const debtors = useMemo(
    () =>
      orders.filter((o) => o.balance > 0).sort((a, b) => b.balance - a.balance),
    [orders],
  );

  const totalDebt = debtors.reduce((sum, o) => sum + o.balance, 0);

  const handleToggle = (orderId: string) => {
    setExpandedId(expandedId === orderId ? null : orderId);
    setPaymentInput("");
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

  return (
    <Box className="flex-1 bg-background-0">
      <Box className="px-4 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <HStack className="items-center justify-between">
          <Heading size="lg">Debtors</Heading>
          <Button
            variant="outline"
            size="sm"
            onPress={() => router.push("/inventory")}
          >
            <ButtonText size="sm">Back to Inventory</ButtonText>
          </Button>
        </HStack>
        {debtors.length > 0 && (
          <Text size="sm" className="mt-1 text-typography-500">
            {debtors.length} outstanding transaction
            {debtors.length === 1 ? "" : "s"} · Total owed $
            {totalDebt.toFixed(2)}
          </Text>
        )}
      </Box>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        {debtors.length === 0 && (
          <Text className="mt-8 text-center text-typography-500">
            No outstanding balances. Everyone's paid up.
          </Text>
        )}

        {debtors.map((order) => {
          const expanded = expandedId === order.id;
          const orderPayments = payments
            .filter((p) => p.orderId === order.id)
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
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
                    <Text bold>{order.customerName || "Unnamed customer"}</Text>
                    {order.customerAddress && (
                      <Text size="sm" className="text-typography-500">
                        Shop {order.customerAddress}
                      </Text>
                    )}
                    <Text size="sm" className="text-typography-500">
                      {formatTimestamp(order.createdAt)}
                    </Text>
                  </VStack>
                  <VStack className="items-end">
                    <Text bold className="text-error-600">
                      ${order.balance.toFixed(2)}
                    </Text>
                    <Text size="sm" className="text-typography-500">
                      {expanded ? "Hide" : "Details"}
                    </Text>
                  </VStack>
                </HStack>
              </Button>

              {expanded && (
                <VStack
                  className="mt-3 border-t border-outline-200 pt-3"
                  space="md"
                >
                  <VStack space="sm">
                    <Text bold size="sm">
                      Order
                    </Text>
                    {order.items.map((item) => (
                      <HStack key={item.id} className="justify-between">
                        <Text size="sm">
                          {item.productName} · {item.variantLabel}
                        </Text>
                        <Text size="sm" className="text-typography-500">
                          {item.quantity} × ${item.unitPrice.toFixed(2)}
                        </Text>
                      </HStack>
                    ))}
                    <HStack className="justify-between border-t border-outline-200 pt-1">
                      <Text size="sm" className="text-typography-500">
                        Total ${order.totalAmount.toFixed(2)} · Paid $
                        {order.amountPaid.toFixed(2)}
                      </Text>
                    </HStack>
                  </VStack>

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
                  </VStack>

                  <VStack space="sm">
                    <Text bold size="sm">
                      Record a payment
                    </Text>
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
                    {error && (
                      <Text size="sm" className="text-error-600">
                        {error}
                      </Text>
                    )}
                  </VStack>
                </VStack>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </Box>
  );
}
