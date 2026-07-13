import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useCart } from "@/store/cartStore";
import { Redirect } from "expo-router";
import { FlatList } from "react-native";

export default function CartScreen() {
  const items = useCart((state) => state.items);
  const resetCart = useCart((state) => state.resetCart);
  const incrementProduct = useCart((state) => state.incrementProduct);
  const decrementProduct = useCart((state) => state.decrementProduct);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const onPayNow = async () => {
    resetCart();
  };

  if (items.length === 0) {
    return <Redirect href={"/"} />;
  }

  return (
    <Box className="flex-1 bg-background-0">
      <FlatList
        data={items}
        contentContainerClassName="gap-2 max-w-[960] w-full mx-auto p-3"
        renderItem={({ item }) => (
          <HStack className="items-center rounded-lg bg-background-50 p-3">
            <VStack space="sm" className="flex-1">
              <Text bold>{item.product.name}</Text>
              <Text>${item.product.price.toFixed(2)} each</Text>
              <Text bold>
                Subtotal: ${(item.product.price * item.quantity).toFixed(2)}
              </Text>
            </VStack>
            <HStack className="ml-auto items-center gap-3">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onPress={() => decrementProduct(item.product.id)}
              >
                <ButtonText size="sm">-</ButtonText>
              </Button>
              <Text bold>{item.quantity}</Text>
              <Button
                className="h-8 w-8 p-0"
                onPress={() => incrementProduct(item.product.id)}
              >
                <ButtonText size="sm">+</ButtonText>
              </Button>
            </HStack>
          </HStack>
        )}
        ListFooterComponent={() => (
          <VStack space="sm" className="mt-2 rounded-lg bg-background-50 p-3">
            <HStack className="justify-between">
              <Text bold>Total Quantity</Text>
              <Text bold>{totalQuantity}</Text>
            </HStack>
            <HStack className="justify-between">
              <Text bold>Total Price</Text>
              <Text bold>${totalPrice.toFixed(2)}</Text>
            </HStack>
            <Button onPress={onPayNow} className="mt-2">
              <ButtonText>Pay Now</ButtonText>
            </Button>
          </VStack>
        )}
      ></FlatList>
    </Box>
  );
}
