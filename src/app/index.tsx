import { Text, View, StyleSheet, FlatList } from "react-native";
import ProductListItem from "@/components/ProductListItem";
import { Button, ButtonText } from "@/components/ui/button"; 
import products from "../assets/products.json"



export default function Homescreen() {
 return (
  
    <FlatList 
    data={products} 
    renderItem={({item}) => <ProductListItem product={item} />}
    />
      
  
 )
 
 
  // return (
  //<FlatList 
    //    data={products}
      //  renderItem={({item}) => <ProductListItem product={item}/>}
  ///>
  //);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center", 
  },
  header: {
    fontSize: 30,
  },
  button: {
    backgroundColor: "blue-600"
  }
});
