import { useMemo, useState } from "react";
import { ScrollView, TextInput } from "react-native";
import { Link } from "expo-router";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Card } from "@/components/ui/card";
import { Button, ButtonText } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useInventoryStore,
  computeLowStockVariants,
} from "@/store/inventoryStore";
import { ProductFormModal } from "@/components/inventory/ProductFormModal";

const NAVBAR_HEIGHT = 56;

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Subscribe directly to the products array so this screen re-renders
  // instantly whenever products are added, removed, or updated.
  const allProducts = useInventoryStore((s) => s.products);
  const adjustStock = useInventoryStore((s) => s.adjustStock);
  const deleteProduct = useInventoryStore((s) => s.deleteProduct);
  const lowStock = useMemo(
    () => computeLowStockVariants(allProducts),
    [allProducts],
  );

  const query = search.trim().toLowerCase();
  const filteredProducts = query
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query),
      )
    : allProducts;

  return (
    <Box className="flex-1 bg-background-0">
      <Box className="px-4 pt-4">
        <HStack className="mb-3 items-center justify-between">
          <Heading size="lg">Inventory</Heading>
          <Button size="sm" onPress={() => setShowForm(true)}>
            <ButtonText size="sm">+ Add Product</ButtonText>
          </Button>
        </HStack>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 10 }}
        >
          <HStack space="sm">
            <Link href="/dashboard" asChild>
              <Button size="sm" variant="outline">
                <ButtonText size="sm">Dashboard</ButtonText>
              </Button>
            </Link>
            <Link href="/new-sale" asChild>
              <Button size="sm">
                <ButtonText size="sm">New Sale</ButtonText>
              </Button>
            </Link>
            <Link href="/transactions" asChild>
              <Button size="sm" variant="outline">
                <ButtonText size="sm">Transactions</ButtonText>
              </Button>
            </Link>
            <Link href="/debtors" asChild>
              <Button size="sm" variant="outline">
                <ButtonText size="sm">Debtors</ButtonText>
              </Button>
            </Link>
          </HStack>
        </ScrollView>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or brand"
          style={{
            borderWidth: 1,
            borderColor: "#d4d4d4",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginBottom: 10,
          }}
        />

        {lowStock.length > 0 && (
          <Box className="mb-3 rounded-md bg-warning-100 p-3">
            <Text size="sm" bold className="text-warning-700">
              ⚠ {lowStock.length} variant{lowStock.length > 1 ? "s" : ""}{" "}
              running low
            </Text>
          </Box>
        )}
      </Box>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: 0,
          paddingBottom: NAVBAR_HEIGHT + insets.bottom + 24,
        }}
      >
        {filteredProducts.length === 0 && (
          <Text className="mt-8 text-center text-typography-500">
            No products yet. Tap "Add Product" to get started.
          </Text>
        )}

        {filteredProducts.map((product) => {
          const totalStock = product.variants.reduce(
            (sum, v) => sum + v.quantity,
            0,
          );
          const expanded = expandedId === product.id;

          return (
            <Card key={product.id} className="mb-3 rounded-lg p-4">
              <HStack className="items-center justify-between">
                <HStack space="sm" className="flex-1 items-center">
                  {product.image && (
                    <Image
                      source={{ uri: product.image }}
                      alt={`${product.name} image`}
                      className="h-14 w-14 rounded-md"
                      resizeMode="cover"
                    />
                  )}
                  <VStack className="flex-1">
                    <Text bold>{product.name}</Text>
                    {product.brand && (
                      <Text size="sm" className="text-typography-500">
                        {product.brand}
                      </Text>
                    )}
                    <Text size="sm" className="text-typography-500">
                      ${product.sellingPrice.toFixed(2)} · {totalStock} in stock
                    </Text>
                  </VStack>
                </HStack>
                <Button
                  variant="link"
                  onPress={() => setExpandedId(expanded ? null : product.id)}
                >
                  <ButtonText size="sm">
                    {expanded ? "Hide" : "Details"}
                  </ButtonText>
                </Button>
              </HStack>

              {expanded && (
                <VStack
                  className="mt-3 border-t border-outline-200 pt-3"
                  space="sm"
                >
                  {product.variants.length === 0 && (
                    <Text size="sm" className="text-typography-500">
                      No size/color variants recorded.
                    </Text>
                  )}

                  {product.variants.map((variant) => {
                    const isLow = variant.quantity <= variant.lowStockThreshold;
                    return (
                      <HStack
                        key={variant.id}
                        className="items-center justify-between rounded-md border border-outline-200 p-2"
                      >
                        <VStack>
                          <Text size="sm" bold>
                            {variant.size} · {variant.color}
                          </Text>
                          <Text
                            size="sm"
                            className={
                              isLow ? "text-error-600" : "text-typography-600"
                            }
                          >
                            Qty: {variant.quantity}
                            {isLow ? " (low)" : ""}
                          </Text>
                        </VStack>
                        <HStack space="sm">
                          <Button
                            size="sm"
                            variant="outline"
                            onPress={() =>
                              adjustStock(
                                product.id,
                                variant.id,
                                -1,
                                "sale",
                                "Manual sale",
                              )
                            }
                          >
                            <ButtonText size="sm">-1</ButtonText>
                          </Button>
                          <Button
                            size="sm"
                            onPress={() =>
                              adjustStock(
                                product.id,
                                variant.id,
                                1,
                                "restock",
                                "Manual restock",
                              )
                            }
                          >
                            <ButtonText size="sm">+1</ButtonText>
                          </Button>
                        </HStack>
                      </HStack>
                    );
                  })}

                  <Button
                    variant="outline"
                    className="mt-1 border-error-300"
                    onPress={() => deleteProduct(product.id)}
                  >
                    <ButtonText size="sm" className="text-error-600">
                      Delete Product
                    </ButtonText>
                  </Button>
                </VStack>
              )}
            </Card>
          );
        })}
      </ScrollView>

      <ProductFormModal visible={showForm} onClose={() => setShowForm(false)} />
    </Box>
  );
}
