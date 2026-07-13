import { Text } from "@/components/ui/text";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { useQuery } from "@tanstack/react-query";
import { fetchProductById } from "@/api/products";
import { ActivityIndicator, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "@/store/cartStore";

const NAVBAR_HEIGHT = 56; // approx height of your bottom NavBar content (excluding insets)

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const addProduct = useCart((state) => state.addProduct);
  const incrementProduct = useCart((state) => state.incrementProduct);
  const decrementProduct = useCart((state) => state.decrementProduct);
  const quantity = useCart(
    (state) =>
      state.items.find((item) => item.product.id === Number(id))?.quantity ?? 0,
  );

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", id],
    queryFn: () => fetchProductById(Number(id)),
  });

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Error fetching products</Text>;
  }

  return (
    <Box className="flex-1 bg-neutral-300">
      <Stack.Screen options={{ title: product.name }} />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
          paddingBottom: NAVBAR_HEIGHT + insets.bottom + 24,
        }}
      >
        <Card className="w-full max-w-[960px] rounded-lg p-5">
          <Image
            source={{
              uri: product.image,
            }}
            className="mb-6 h-[440px] w-full rounded-md"
            alt={`${product.name} image`}
            resizeMode="contain"
          />
          <Text className="text-md mb-2 font-bold text-typography-700">
            {product.name}
          </Text>
          <VStack className="mb-6" flex-1>
            <Heading size="md" className="mb-4">
              ${product.price.toFixed(2)}
            </Heading>
            <Text size="sm">{product.description}</Text>
          </VStack>

          <Button
            variant="link"
            className="mb-3 self-start px-0"
            onPress={() => router.push("/")}
          >
            <ButtonText size="sm">Back to Home</ButtonText>
          </Button>

          <Box className="w-full flex-col sm:flex-row">
            {quantity === 0 ? (
              <Button
                onPress={() => addProduct(product)}
                className="mb-3 mr-0 px-4 py-2 sm:mb-0 sm:mr-3 sm:flex-1"
              >
                <ButtonText size="sm" numberOfLines={1}>
                  Add to cart
                </ButtonText>
              </Button>
            ) : (
              <HStack className="mb-3 mr-0 items-center justify-center gap-4 rounded-md border border-outline-300 px-4 py-2 sm:mb-0 sm:mr-3 sm:flex-1">
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onPress={() => decrementProduct(product.id)}
                >
                  <ButtonText size="sm">-</ButtonText>
                </Button>
                <Text bold>{quantity}</Text>
                <Button
                  className="h-8 w-8 p-0"
                  onPress={() => incrementProduct(product.id)}
                >
                  <ButtonText size="sm">+</ButtonText>
                </Button>
              </HStack>
            )}
            <Button
              variant="outline"
              className="border-outline-300 px-4 py-2 sm:flex-1"
            >
              <ButtonText size="sm" className="text-typography-600">
                Buy Now!
              </ButtonText>
            </Button>
          </Box>
        </Card>
      </ScrollView>
    </Box>
  );
}
