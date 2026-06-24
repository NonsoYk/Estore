import { Text } from "react-native";
import products from "../assets/products.json";

export default function ProductListItem({ product }) {
   return <Text style={{fontSize: 30}}>
        {product.name}
      </Text>
}