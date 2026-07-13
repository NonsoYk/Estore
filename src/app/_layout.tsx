import "@/global.css";
import { Link, Stack } from "expo-router";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { Moon, ShoppingCart, Sun } from "lucide-react-native";
import { Pressable } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { useState } from "react";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <GluestackUIProvider mode={colorMode}>
          <Stack
            screenOptions={{
              headerRight: () => (
                <Box
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Pressable
                    onPress={() =>
                      setColorMode(colorMode === "light" ? "dark" : "light")
                    }
                  >
                    <Icon
                      as={colorMode === "light" ? Moon : Sun}
                      size="xl"
                      className="text-black"
                    />
                  </Pressable>

                  <Link href={"/cart"} asChild>
                    <Pressable style={{ paddingHorizontal: 16 }}>
                      <Icon
                        as={ShoppingCart}
                        size="xl"
                        className="text-black"
                      />
                    </Pressable>
                  </Link>
                </Box>
              ),
            }}
          >
            <Stack.Screen name="index" options={{ title: "shop" }} />
            <Stack.Screen name="product/[id]" options={{ title: "Product" }} />
          </Stack>
        </GluestackUIProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
