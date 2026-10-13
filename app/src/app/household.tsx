import { Text, View, StyleSheet } from "react-native";

export default function Household() {
  return (
    <View style={styles.container}>
      <Text>Hushåll</Text>
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
