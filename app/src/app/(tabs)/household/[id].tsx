import { Text, View, StyleSheet } from "react-native";

import ScreenHeader from "@/components/ScreenHeader";
import { useTheme } from "@/theme";

export default function Household() {
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader />
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Hushåll</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 32,
  },
  title: {
    fontSize: 17,
  },
});
