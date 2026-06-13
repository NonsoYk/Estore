import { Text } from "react-native";
import products from "../assets/products.json";

export default function ProductListItem({ product }) {
   return <Text>{product.name} </Text>
}