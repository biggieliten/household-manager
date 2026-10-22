import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

// Fills the available space with a centered spinner while a fetch is pending
export default function LoadingView(): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Laddar"
      style={styles.centered}>
      <ActivityIndicator color={colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
});
