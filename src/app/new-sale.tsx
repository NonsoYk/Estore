import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Card } from "@/components/ui/card";
import { Button, ButtonText } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Input, InputField } from "@/components/ui/input";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInventoryStore } from "@/store/inventoryStore";
import { generateId } from "@/types/inventory";

// A line the user has added to the current order, before it's saved.
type CartItem = {
  key: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantId: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
};

export default function NewSaleScreen() {
  const insets = useSafeAreaInsets();
  const products = useInventoryStore((s) => s.products);
  const addOrder = useInventoryStore((s) => s.addOrder);
  const scrollRef = useRef<ScrollView>(null);

  // Which product's picker (variant + quantity) is currently open
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer + payment
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [error, setError] = useState<string | null>(null);

  const openProduct = products.find((p) => p.id === openProductId) ?? null;

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const total = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    [cart],
  );
  const paid = parseFloat(amountPaid || "0") || 0;
  const balance = Math.max(0, total - paid);
  const requiresDetails = balance > 0;

  const handleTapProduct = (id: string) => {
    if (openProductId === id) {
      setOpenProductId(null);
      return;
    }
    setOpenProductId(id);
    setVariantId(null);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    setError(null);
    if (!openProduct) return;
    if (!variantId) {
      setError("Pick a color/size first.");
      return;
    }
    const variant = openProduct.variants.find((v) => v.id === variantId);
    if (!variant) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === openProduct.id && i.variantId === variantId,
      );
      if (existingIndex !== -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }
      return [
        ...prev,
        {
          key: generateId(),
          productId: openProduct.id,
          productName: openProduct.name,
          productImage: openProduct.image,
          variantId,
          variantLabel: `${variant.size} · ${variant.color}`,
          quantity,
          unitPrice: openProduct.sellingPrice,
        },
      ];
    });

    setOpenProductId(null);
    setVariantId(null);
    setQuantity(1);
  };

  const handleRemoveItem = (key: string) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  };

  const handleGoToCheckout = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const handleSaveOrder = () => {
    setError(null);
    if (cart.length === 0) {
      setError("Add at least one item to the cart.");
      return;
    }
    if (requiresDetails && !customerName.trim()) {
      setError("Customer name is required when there's a balance owed.");
      return;
    }
    if (requiresDetails && !customerAddress.trim()) {
      setError(
        "Shop number is required when there's a balance owed, so we can tell customers with the same name apart.",
      );
      return;
    }

    addOrder({
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      items: cart.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      amountPaid: paid,
    });

    // If the customer still owes money, take the owner straight to the
    // Debtors page so the new balance is immediately visible and logged.
    if (balance > 0) {
      router.replace("/debtors");
    } else {
      router.back();
    }
  };

  return (
    <Box className="flex-1 bg-background-0">
      <Box className="px-4 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <HStack className="items-center justify-between">
          <Heading size="lg">New Sale</Heading>
          <Button variant="outline" size="sm" onPress={() => router.back()}>
            <ButtonText size="sm">Back to Inventory</ButtonText>
          </Button>
        </HStack>
      </Box>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 100,
        }}
      >
        <Text bold size="lg" className="mb-3">
          Tap a product to add it
        </Text>

        {/* --- Product image grid --- */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {products.map((product) => {
            const isOpen = openProductId === product.id;
            return (
              <Pressable
                key={product.id}
                onPress={() => handleTapProduct(product.id)}
                style={{ width: "47%" }}
              >
                <Card
                  className={`rounded-lg p-2 ${
                    isOpen ? "border-2 border-primary-500" : ""
                  }`}
                >
                  {product.image ? (
                    <Image
                      source={{ uri: product.image }}
                      alt={`${product.name} image`}
                      className="mb-2 aspect-square w-full rounded-md"
                      resizeMode="cover"
                    />
                  ) : (
                    <Box className="mb-2 aspect-square w-full items-center justify-center rounded-md bg-background-100">
                      <Text size="xs" className="text-typography-400">
                        No image
                      </Text>
                    </Box>
                  )}
                  <Text bold size="sm" numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text size="sm" className="text-typography-500">
                    ${product.sellingPrice.toFixed(2)}
                  </Text>
                </Card>
              </Pressable>
            );
          })}

          {products.length === 0 && (
            <Text className="text-typography-500">
              No products yet — add one from the Inventory page first.
            </Text>
          )}
        </View>

        {/* --- Variant + quantity picker for the open product --- */}
        {openProduct && (
          <Card className="mb-4 rounded-lg border-2 border-primary-500 p-4">
            <Text bold className="mb-2">
              {openProduct.name}
            </Text>

            <Text size="sm" className="mb-2 text-typography-500">
              Choose color / size
            </Text>
            <HStack space="sm" className="mb-4 flex-wrap">
              {openProduct.variants.map((v) => (
                <Button
                  key={v.id}
                  size="sm"
                  variant={variantId === v.id ? "solid" : "outline"}
                  onPress={() => setVariantId(v.id)}
                >
                  <ButtonText size="sm">
                    {v.size} · {v.color} ({v.quantity} left)
                  </ButtonText>
                </Button>
              ))}
              {openProduct.variants.length === 0 && (
                <Text size="sm" className="text-typography-500">
                  No variants recorded for this product.
                </Text>
              )}
            </HStack>

            <Text size="sm" className="mb-2 text-typography-500">
              Quantity
            </Text>
            <HStack space="md" className="mb-4 items-center">
              <Button
                size="sm"
                variant="outline"
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <ButtonText size="lg">−</ButtonText>
              </Button>
              <Text bold size="lg">
                {quantity}
              </Text>
              <Button
                size="sm"
                variant="outline"
                onPress={() => setQuantity((q) => q + 1)}
              >
                <ButtonText size="lg">+</ButtonText>
              </Button>
            </HStack>

            <Button onPress={handleAddToCart}>
              <ButtonText>Add to Cart</ButtonText>
            </Button>
          </Card>
        )}

        {/* --- Cart --- */}
        {cart.length > 0 && (
          <Card className="mb-4 rounded-lg p-4">
            <Text bold className="mb-3">
              Cart ({cartCount} item{cartCount === 1 ? "" : "s"})
            </Text>
            <VStack space="sm">
              {cart.map((item) => (
                <HStack
                  key={item.key}
                  className="items-center rounded-md border border-outline-200 p-2"
                  space="sm"
                >
                  {item.productImage ? (
                    <Image
                      source={{ uri: item.productImage }}
                      alt={`${item.productName} image`}
                      className="h-12 w-12 rounded-md"
                      resizeMode="cover"
                    />
                  ) : (
                    <Box className="h-12 w-12 items-center justify-center rounded-md bg-background-100" />
                  )}
                  <VStack className="flex-1">
                    <Text bold size="sm">
                      {item.productName} · {item.variantLabel}
                    </Text>
                    <Text size="sm" className="text-typography-500">
                      {item.quantity} × ${item.unitPrice.toFixed(2)} = $
                      {(item.quantity * item.unitPrice).toFixed(2)}
                    </Text>
                  </VStack>
                  <Button
                    variant="link"
                    onPress={() => handleRemoveItem(item.key)}
                  >
                    <ButtonText size="sm" className="text-error-600">
                      Remove
                    </ButtonText>
                  </Button>
                </HStack>
              ))}
              <HStack className="justify-between border-t border-outline-200 pt-2">
                <Text bold>Total</Text>
                <Text bold>${total.toFixed(2)}</Text>
              </HStack>
            </VStack>
          </Card>
        )}

        {/* --- Customer + payment --- */}
        <Card className="rounded-lg p-4">
          <Text bold className="mb-3">
            Customer & payment
          </Text>
          <VStack space="sm">
            <Text size="sm" className="text-typography-500">
              Customer name{" "}
              {requiresDetails ? "(required — balance owed)" : "(optional)"}
            </Text>
            <Input>
              <InputField
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="e.g. Mrs. Adaeze"
              />
            </Input>

            <Text size="sm" className="mt-2 text-typography-500">
              Phone (optional)
            </Text>
            <Input>
              <InputField
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="080..."
                keyboardType="phone-pad"
              />
            </Input>

            <Text size="sm" className="mt-2 text-typography-500">
              Shop number{" "}
              {requiresDetails ? "(required — balance owed)" : "(optional)"}
            </Text>
            <Input>
              <InputField
                value={customerAddress}
                onChangeText={setCustomerAddress}
                placeholder="e.g. Shop 12, Main Market"
              />
            </Input>

            <Text size="sm" className="mt-2 text-typography-500">
              Amount paid
            </Text>
            <Input>
              <InputField
                value={amountPaid}
                onChangeText={setAmountPaid}
                placeholder={total ? total.toFixed(2) : "0.00"}
                keyboardType="decimal-pad"
              />
            </Input>

            <HStack className="mt-2 justify-between">
              <Text className="text-typography-500">Balance owed</Text>
              <Text bold className={balance > 0 ? "text-error-600" : ""}>
                ${balance.toFixed(2)}
              </Text>
            </HStack>
          </VStack>
        </Card>

        {error && (
          <Text size="sm" className="mt-3 text-error-600">
            {error}
          </Text>
        )}

        <Button className="mt-4" onPress={handleSaveOrder}>
          <ButtonText>Save Order</ButtonText>
        </Button>
      </ScrollView>

      {/* --- Floating cart summary bar --- */}
      {cart.length > 0 && (
        <Pressable onPress={handleGoToCheckout}>
          <Box
            className="absolute bottom-0 w-full border-t border-outline-200 bg-background-0 px-4"
            style={{ paddingBottom: insets.bottom + 12, paddingTop: 12 }}
          >
            <HStack className="items-center justify-between">
              <Text bold>
                {cartCount} item{cartCount === 1 ? "" : "s"} · $
                {total.toFixed(2)}
              </Text>
              <Text bold className="text-primary-500">
                Go to Checkout ↓
              </Text>
            </HStack>
          </Box>
        </Pressable>
      )}
    </Box>
  );
}
