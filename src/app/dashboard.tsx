import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Card } from "@/components/ui/card";
import { Button, ButtonText } from "@/components/ui/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useInventoryStore,
  computeSalesSummary,
  computeDailySalesTrend,
  computeTopProducts,
  computeInventoryValue,
  computeLowStockVariants,
} from "@/store/inventoryStore";

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "success" | "error" | "default";
}) {
  const color =
    accent === "success"
      ? "text-success-600"
      : accent === "error"
        ? "text-error-600"
        : "text-typography-900";

  return (
    <Card className="flex-1 rounded-lg p-4">
      <Text size="sm" className="mb-1 text-typography-500">
        {label}
      </Text>
      <Text bold size="xl" className={color}>
        {value}
      </Text>
    </Card>
  );
}

function DailyBarChart({ data }: { data: { label: string; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const chartHeight = 140;

  return (
    <Card className="rounded-lg p-4">
      <Text bold className="mb-4">
        Sales — last 7 days
      </Text>
      <HStack
        className="items-end justify-between"
        style={{ height: chartHeight }}
      >
        {data.map((d, idx) => {
          const barHeight = Math.max(4, (d.total / max) * (chartHeight - 24));
          return (
            <VStack key={idx} className="flex-1 items-center" space="xs">
              <Text size="xs" className="text-typography-500">
                {d.total > 0 ? `$${Math.round(d.total)}` : ""}
              </Text>
              <View
                style={{
                  height: barHeight,
                  width: "60%",
                  borderRadius: 6,
                  backgroundColor: "#6366f1",
                }}
              />
              <Text size="xs" className="text-typography-500">
                {d.label}
              </Text>
            </VStack>
          );
        })}
      </HStack>
    </Card>
  );
}

function CollectedVsDebtBar({
  collected,
  debt,
}: {
  collected: number;
  debt: number;
}) {
  const total = collected + debt || 1;
  const collectedPct = (collected / total) * 100;
  const debtPct = (debt / total) * 100;

  return (
    <Card className="rounded-lg p-4">
      <Text bold className="mb-3">
        Cash vs Outstanding
      </Text>
      <View
        style={{
          flexDirection: "row",
          height: 20,
          borderRadius: 10,
          overflow: "hidden",
          backgroundColor: "#e5e5e5",
        }}
      >
        <View
          style={{ width: `${collectedPct}%`, backgroundColor: "#22c55e" }}
        />
        <View style={{ width: `${debtPct}%`, backgroundColor: "#ef4444" }} />
      </View>
      <HStack className="mt-3 justify-between">
        <HStack space="xs" className="items-center">
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#22c55e",
            }}
          />
          <Text size="sm" className="text-typography-500">
            Collected ${collected.toFixed(2)}
          </Text>
        </HStack>
        <HStack space="xs" className="items-center">
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#ef4444",
            }}
          />
          <Text size="sm" className="text-typography-500">
            Owed ${debt.toFixed(2)}
          </Text>
        </HStack>
      </HStack>
    </Card>
  );
}

function TopProductsList({
  products,
}: {
  products: { productName: string; unitsSold: number; revenue: number }[];
}) {
  const max = Math.max(...products.map((p) => p.unitsSold), 1);

  return (
    <Card className="rounded-lg p-4">
      <Text bold className="mb-3">
        Top selling products
      </Text>
      {products.length === 0 && (
        <Text size="sm" className="text-typography-500">
          No sales yet.
        </Text>
      )}
      <VStack space="sm">
        {products.map((p, idx) => (
          <VStack key={idx} space="xs">
            <HStack className="justify-between">
              <Text size="sm" bold>
                {idx + 1}. {p.productName}
              </Text>
              <Text size="sm" className="text-typography-500">
                {p.unitsSold} sold · ${p.revenue.toFixed(2)}
              </Text>
            </HStack>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: "#e5e5e5",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 6,
                  width: `${(p.unitsSold / max) * 100}%`,
                  backgroundColor: "#6366f1",
                  borderRadius: 3,
                }}
              />
            </View>
          </VStack>
        ))}
      </VStack>
    </Card>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const orders = useInventoryStore((s) => s.orders);
  const products = useInventoryStore((s) => s.products);

  const todaySummary = useMemo(
    () => computeSalesSummary(orders, new Date().toISOString()),
    [orders],
  );
  const overallSummary = useMemo(() => computeSalesSummary(orders), [orders]);
  const dailyTrend = useMemo(() => computeDailySalesTrend(orders, 7), [orders]);
  const topProducts = useMemo(() => computeTopProducts(orders, 5), [orders]);
  const inventoryValue = useMemo(
    () => computeInventoryValue(products),
    [products],
  );
  const lowStockCount = useMemo(
    () => computeLowStockVariants(products).length,
    [products],
  );

  return (
    <Box className="flex-1 bg-background-0">
      <Box className="px-4 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <HStack className="items-center justify-between">
          <Heading size="lg">Dashboard</Heading>
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
        <VStack space="md">
          <HStack space="md">
            <MetricCard
              label="Today's Sales"
              value={`$${todaySummary.totalSales.toFixed(2)}`}
            />
            <MetricCard
              label="Cash Collected"
              value={`$${overallSummary.totalCollected.toFixed(2)}`}
              accent="success"
            />
          </HStack>
          <HStack space="md">
            <MetricCard
              label="Outstanding Debt"
              value={`$${overallSummary.totalDebt.toFixed(2)}`}
              accent={overallSummary.totalDebt > 0 ? "error" : "default"}
            />
            <MetricCard
              label="Inventory Value"
              value={`$${inventoryValue.toFixed(2)}`}
            />
          </HStack>
          <HStack space="md">
            <MetricCard
              label="All-time Sales"
              value={`$${overallSummary.totalSales.toFixed(2)}`}
            />
            <MetricCard
              label="Low Stock Items"
              value={String(lowStockCount)}
              accent={lowStockCount > 0 ? "error" : "default"}
            />
          </HStack>

          <DailyBarChart data={dailyTrend} />
          <CollectedVsDebtBar
            collected={overallSummary.totalCollected}
            debt={overallSummary.totalDebt}
          />
          <TopProductsList products={topProducts} />
        </VStack>
      </ScrollView>
    </Box>
  );
}
