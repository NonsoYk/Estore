import { ActivityIndicator, FlatList, Platform } from "react-native";
import ProductListItem from "@/components/ProductListItem";
import { useQuery } from "@tanstack/react-query";

import { useBreakpointValue } from "@gluestack-ui/utils/hooks";
import { listProducts, Product } from "@/api/products";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { NavBar } from "@/components/NavBar";

export default function Homescreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
  });

  const numColumns = useBreakpointValue({
    default: 2,
    sm: 3,
    xl: 4,
  }) as number;

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Error fetching products</Text>;
  }

  return (
    <Box className="relative flex-1">
      <NavBar />
      <FlatList
        key={numColumns}
        data={data}
        numColumns={numColumns}
        contentContainerClassName={
          Platform.OS === "web"
            ? "gap-2 bg-neutral-300 max-w-[960px] mx-auto w-full pt-6"
            : "gap-2 bg-neutral-300 max-w-[960px] mx-auto w-full pb-16"
        }
        columnWrapperClassName="gap-2"
        renderItem={({ item }) => <ProductListItem product={item} />}
      />
    </Box>
  );
}
