import { SymbolView } from "expo-symbols";
import HeaderLogo from "@/components/HeaderLogo";
import useActiveHouseholdId from "@/hooks/use-active-household-id";
import { useTheme } from "@/theme";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import {
  householdQueryOptions,
  householdsQueryOptions,
  switchHouseholdMutationOptions,
} from "@/options/households";

export default function ScreenHeader(): React.JSX.Element {
  const { colors } = useTheme();
  const householdId = useActiveHouseholdId();
  const { data: household } = useQuery(householdQueryOptions(householdId));
  const households = useQuery(householdsQueryOptions);
  const [open, setOpen] = useState(false);
  const switchMutation = useMutation(switchHouseholdMutationOptions);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <HeaderLogo />
      <View style={styles.household}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setOpen(!open)}
          style={styles.nameRow}>
          <Text
            style={[styles.householdName, { color: colors.text }]}
            numberOfLines={1}>
            {household?.name}
          </Text>
          <Text style={{ color: colors.textMuted }}>{open ? "▲" : "▼"}</Text>
        </Pressable>
        {open && (
          <View
            style={[
              styles.menu,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}>
            {households.data?.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="menuitem"
                onPress={() => {
                  setOpen(false);
                  switchMutation.mutate(item.id);
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: colors.surface },
                ]}>
                <Text
                  style={{
                    color:
                      item.id === householdId ? colors.primary : colors.text,
                  }}>
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      <Link href="/profile" asChild>
        <Pressable accessibilityRole="button" accessibilityLabel="Profil">
          <SymbolView
            name={{
              ios: "person.circle",
              android: "account_circle",
              web: "account_circle",
            }}
            size={32}
            tintColor={colors.text}
          />
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 1,
  },
  household: {
    flex: 1,
  },
  householdName: {
    fontSize: 20,
    fontWeight: "700",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  menu: {
    position: "absolute",
    top: 36,
    left: 0,
    minWidth: 200,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
