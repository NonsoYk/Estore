import { Text } from "@/components/ui/text";
import { Stack, useLocalSearchParams } from "expo-router";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import { VStack } from "@/components/ui/vstack";
import { useQuery } from "@tanstack/react-query";
import { fetchProductById } from "@/api/products";
import { ActivityIndicator } from "react-native";

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

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
    <Box className="flex-1 items-center justify-center bg-neutral-300 p-3">
      <Stack.Screen options={{ title: product.name }} />

      <Card className="w-full  max-w-[960px] flex-1 rounded-lg p-5">
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
            {product.price}
          </Heading>
          <Text size="sm">{product.description}</Text>
        </VStack>
        <Box className="w-full flex-col sm:flex-row">
          <Button className="mb-3 mr-0 px-4 py-2 sm:mb-0 sm:mr-3 sm:flex-1">
            <ButtonText size="sm" numberOfLines={1}>
              Add to cart
            </ButtonText>
          </Button>
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
    </Box>
  );
}
