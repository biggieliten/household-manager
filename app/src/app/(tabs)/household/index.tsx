import { useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { activeHouseholdIdQueryOptions } from "@/options/households";
import { useTheme } from "@/theme";

export default function HouseholdIndex() {
  const { colors } = useTheme();
  const { data: householdId, error, isPending } = useQuery(
    activeHouseholdIdQueryOptions,
  );

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.text }}>{error.message}</Text>
      </View>
    );
  }

  if (householdId === null) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.textMuted }}>
          Du är inte med i något hushåll än
        </Text>
      </View>
    );
  }

  return (
    <Redirect
      href={{ pathname: "/household/[id]", params: { id: householdId } }}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
