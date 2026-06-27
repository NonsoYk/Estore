import { FlatList, useWindowDimensions } from "react-native";
import ProductListItem from "@/components/ProductListItem";
import products from "../assets/products.json"

import { useBreakpointValue } from '@gluestack-ui/utils/hooks';



export default function Homescreen() {
  // const { width } = useWindowDimensions();
   //const numColumns = width > 700 ? 4 : 2

   const numColumns = useBreakpointValue({
      default:2,
      sm:3,
      xl:4
   });
 
   return (
    <FlatList 
    key={numColumns}
    data={products} 
    numColumns={numColumns}
    contentContainerClassName="gap-2 bg-neutral-300 max-w-[960px] mx-auto w-full"
    columnWrapperClassName="gap-2"
    renderItem={({item}) => <ProductListItem product={item} />}
    /> 
 );
}

