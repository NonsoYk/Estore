import { Platform } from "react-native";
import { Link, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Inventory", href: "/inventory" },
  { label: "Log In", href: "/login" },
] as const;

export function NavBar() {
  const pathname = usePathname();
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();

  return (
    <Box
      className={
        isWeb
          ? "sticky top-0 z-50 w-full border-b border-outline-200 bg-background-0 px-6 py-3"
          : "absolute bottom-0 z-50 w-full border-t border-outline-200 bg-background-0 px-4 pt-2"
      }
      style={!isWeb ? { paddingBottom: insets.bottom + 8 } : undefined}
    >
      <HStack
        space="lg"
        className={
          isWeb ? "mx-auto max-w-[960px] justify-start" : "justify-around"
        }
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} asChild>
              <Text
                bold={active}
                className={`${active ? "text-typography-900" : "text-typography-500"} ${
                  isWeb ? "cursor-pointer hover:text-typography-700" : ""
                }`}
              >
                {item.label}
              </Text>
            </Link>
          );
        })}
      </HStack>
    </Box>
  );
}
