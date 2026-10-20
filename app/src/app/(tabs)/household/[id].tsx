import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useState } from "react";
import MemberMenu from "@/components/MemberMenu";
import {
  fetchHousehold,
  pauseMember,
  resumeMember,
} from "@/lib/api/households";
import ScreenHeader from "@/components/ScreenHeader";
import { useTheme } from "@/theme";
import type { Avatar } from "@shared/schemas/member-schema";

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
  const queryClient = useQueryClient();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const invalidateHousehold = () =>
    queryClient.invalidateQueries({ queryKey: ["household", householdId] });

  const pauseMutation = useMutation({
    mutationFn: (memberId: number) => pauseMember(householdId, memberId),
    onSuccess: invalidateHousehold,
  });

  const resumeMutation = useMutation({
    mutationFn: (memberId: number) => resumeMember(householdId, memberId),
    onSuccess: invalidateHousehold,
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
  const isAdmin = members.some((member) => member.isMe && member.isAdmin);
  const mutationError = pauseMutation.error ?? resumeMutation.error;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }>
      <View
        style={[styles.card, styles.row, { backgroundColor: colors.surface }]}>
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
            style={[styles.sectionTitle, styles.flex, { color: colors.text }]}>
            Medlemmar i hushållet
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.border }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {members.length} personer
            </Text>
          </View>
        </View>

        {mutationError && (
          <Text style={{ color: colors.textMuted }}>
            {mutationError.message}
          </Text>
        )}

        {members.map((member) => (
          <View
            key={member.id}
            style={[
              styles.row,
              styles.memberRow,
              { backgroundColor: colors.background },
              openMenuId === member.id && styles.rowOnTop,
            ]}>
            <View
              style={[
                styles.row,
                styles.flex,
                member.isPaused && styles.paused,
              ]}>
              <Text style={styles.avatar}>{avatarEmoji[member.avatar]}</Text>
              <Text style={[styles.memberName, { color: colors.text }]}>
                {member.nickname}
                {member.isMe && (
                  <Text style={{ color: colors.textMuted }}> (Du)</Text>
                )}
              </Text>
              <View style={[styles.badge, { backgroundColor: colors.border }]}>
                <Text style={[styles.badgeText, { color: colors.textMuted }]}>
                  {member.isPaused
                    ? "Pausad"
                    : member.isAdmin
                      ? "Ägare"
                      : "Medlem"}
                </Text>
              </View>
            </View>

            {isAdmin && !member.isAdmin && (
              <MemberMenu
                open={openMenuId === member.id}
                onToggle={() =>
                  setOpenMenuId(openMenuId === member.id ? null : member.id)
                }
                items={
                  member.isPaused
                    ? [
                        {
                          label: "Återaktivera medlem",
                          onPress: () => resumeMutation.mutate(member.id),
                        },
                      ]
                    : [
                        {
                          label: "Pausa medlem",
                          onPress: () => pauseMutation.mutate(member.id),
                        },
                      ]
                }
              />
            )}
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
  rowOnTop: {
    zIndex: 1,
    elevation: 6,
  },
  paused: {
    opacity: 0.4,
  },
});
