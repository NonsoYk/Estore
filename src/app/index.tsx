import { FlatList } from "react-native";
import ProductListItem from "@/components/ProductListItem";
import products from "../assets/products.json"



export default function Homescreen() {
 return (
  
    <FlatList 
    data={products} 
    numColumns={3}
    contentContainerClassName="gap-2"
    columnWrapperClassName="gap-2"
    renderItem={({item}) => <ProductListItem product={item} />}
    /> 
 );
}

