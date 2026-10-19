import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ScreenHeader from "@/components/ScreenHeader";
import { fetchHousehold } from "@/lib/api/households";
import { useTheme } from "@/theme";
import type { Avatar } from "@/types/task";

// TODO: share with TaskCard
const avatarEmoji: Record<Avatar, string> = {
  FOX: "🦊",
  PIG: "🐷",
  FROG: "🐸",
  CHICKEN: "🐥",
  OCTOPUS: "🐙",
  DOLPHIN: "🐬",
  OWL: "🦉",
  UNICORN: "🦄",
};

export default function Household() {
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader />
      <HouseholdContent />
    </View>
  );
}

function HouseholdContent() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const householdId = Number(id);

  const { data, error, isPending, refetch, isRefetching } = useQuery({
    queryKey: ["household", householdId],
    queryFn: () => fetchHousehold(householdId),
  });

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

  const { name, accessCode, members } = data;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      <View
        style={[styles.card, styles.row, { backgroundColor: colors.surface }]}
      >
        <View style={[styles.iconCircle, { backgroundColor: colors.border }]}>
          <SymbolView
            name={{ ios: "house.fill", android: "home", web: "home" }}
            size={22}
            tintColor={colors.primary}
            fallback={<Text>🏠</Text>}
          />
        </View>
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <Text style={[styles.householdName, { color: colors.text }]}>
              {name}
            </Text>
            <View style={[styles.badge, { backgroundColor: colors.border }]}>
              <Text style={[styles.badgeText, { color: colors.text }]}>
                {accessCode}
              </Text>
            </View>
          </View>
          <Text style={{ color: colors.primary }}>
            {members.length} medlemmar
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.row}>
          <Text
            style={[styles.sectionTitle, styles.flex, { color: colors.text }]}
          >
            Medlemmar i hushållet
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.border }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {members.length} personer
            </Text>
          </View>
        </View>

        {members.map((member) => (
          <View
            key={member.id}
            style={[
              styles.row,
              styles.memberRow,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={styles.avatar}>{avatarEmoji[member.avatar]}</Text>
            <Text style={[styles.memberName, { color: colors.text }]}>
              {member.nickname}
            </Text>
            <View style={[styles.badge, { backgroundColor: colors.border }]}>
              <Text style={[styles.badgeText, { color: colors.textMuted }]}>
                {member.isAdmin ? "Ägare" : "Medlem"}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  householdName: {
    fontSize: 20,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  memberRow: {
    borderRadius: 12,
    padding: 12,
  },
  avatar: {
    fontSize: 24,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "500",
  },
});
