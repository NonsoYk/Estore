import { ActivityIndicator, FlatList } from "react-native";
import ProductListItem from "@/components/ProductListItem";
import { useQuery } from "@tanstack/react-query";

import { useBreakpointValue } from "@gluestack-ui/utils/hooks";
import { listProducts, Product } from "@/api/products";
import { Text } from "@/components/ui/text/index.web";

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
    <FlatList
      key={numColumns}
      data={data}
      numColumns={numColumns}
      contentContainerClassName="gap-2 bg-neutral-300 max-w-[960px] mx-auto w-full"
      columnWrapperClassName="gap-2"
      renderItem={({ item }) => <ProductListItem product={item} />}
    />
  );
}
