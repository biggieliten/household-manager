import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

export default function Index() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text }}>Sysslor</Text>
      <Link href='/create-task' asChild>
        <Pressable
          accessibilityRole='button'
          accessibilityLabel='Skapa syssla'
          style={StyleSheet.flatten([
            styles.addButton,
            { backgroundColor: colors.primary },
          ])}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    position: "absolute",
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 34,
  },
});
