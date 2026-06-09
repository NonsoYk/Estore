import { Text, View, StyleSheet } from "react-native";

export default function Cardscreen() {
  return (
    <View style={styles.container} >
      <Text>Card World.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
