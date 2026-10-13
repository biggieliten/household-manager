import { Text, View, StyleSheet } from "react-native";

export default function Statistics() {
  return (
    <View style={styles.container}>
      <Text>Statistik</Text>
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
