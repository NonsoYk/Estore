import { Text, View, StyleSheet, FlatList } from "react-native";
import products from "../assets/products.json";
import ProductListItem from "@/components/ProductListItem";



export default function Homescreen() {
  return (
  <FlatList 
        data={products}
        renderItem={({item}) => <ProductListItem product={item}/>}
  />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center", 
  },
  header: {
    fontSize: 30,
  }
});
