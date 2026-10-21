import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useActiveHouseholdId from "@/hooks/use-active-household-id";
import { avatars } from "@/lib/avatars";
import { householdQueryOptions } from "@/options/households";
import { useTheme } from "@/theme";

export default function ScreenHeader(): React.JSX.Element {
  const { colors, scheme } = useTheme();
  const avatarBackground = scheme === "light" ? "#ECEBFD" : "#33354A";
  const householdId = useActiveHouseholdId();
  const { data: household } = useQuery(householdQueryOptions(householdId));
  const me = household?.members.find((member) => member.isMe);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.household}>
        <Text
          style={[styles.householdName, { color: colors.text }]}
          numberOfLines={1}>
          {household?.name}
        </Text>
      </View>
      <Link href="/profile" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profil"
          style={StyleSheet.flatten([
            styles.avatar,
            { backgroundColor: avatarBackground },
          ])}>
          <Text style={styles.avatarEmoji}>
            {me ? avatars[me.avatar].emoji : ""}
          </Text>
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
  },
  household: {
    flex: 1,
  },
  householdName: {
    fontSize: 20,
    fontWeight: "700",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 22,
  },
});
