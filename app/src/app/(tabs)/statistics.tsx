import { useQuery } from "@tanstack/react-query";
import { DonutChart } from "expo-skia-charts";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchHouseholdStatistics, HOUSEHOLD_ID } from "@/lib/api";
import { useTheme } from "@/theme";
import type { Avatar, MemberStatistics } from "@/types/statistics";

const avatarColors: Record<Avatar, string> = {
  FOX: "#F0866A",
  PIG: "#F2A7C3",
  FROG: "#7BC47F",
  CHICKEN: "#EDC45E",
  OCTOPUS: "#C9546F",
  DOLPHIN: "#5FA8D3",
  OWL: "#A47551",
  UNICORN: "#A68BE0",
};

function toChartData(members: MemberStatistics[], points: number[]) {
  return members.map((member, index) => ({
    label: member.nickname,
    value: points[index] ?? 0,
  }));
}

export default function Statistics() {
  const { colors } = useTheme();
  const { data, error, isPending, refetch, isRefetching } = useQuery({
    queryKey: ["statistics", HOUSEHOLD_ID],
    queryFn: () => fetchHouseholdStatistics(HOUSEHOLD_ID),
  });

  if (isPending) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{error.message}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => refetch()}
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.retryButtonText}>Försök igen</Text>
        </Pressable>
      </View>
    );
  }

  const { members, tasks, totalPoints } = data;
  const memberColors = members.map((member) => avatarColors[member.avatar]);
  const totalChartData = toChartData(
    members,
    members.map((member) => member.points),
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {totalPoints === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            Inga utförda sysslor än
          </Text>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Totalt
                </Text>
                <View style={[styles.badge, { backgroundColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.text }]}>
                    {totalPoints} p
                  </Text>
                </View>
              </View>

              <View style={styles.totalChart}>
                <DonutChart
                  config={{
                    data: totalChartData,
                    colors: memberColors,
                    strokeWidth: 25,
                  }}
                />
              </View>

              <View style={styles.memberRow}>
                {members.map((member) => {
                  const percent = Math.round((member.points / totalPoints) * 100);
                  return (
                    <View key={member.id} style={styles.memberStat}>
                      <View style={styles.memberName}>
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: avatarColors[member.avatar] },
                          ]}
                        />
                        <Text style={{ color: colors.text }}>
                          {member.nickname}
                        </Text>
                      </View>
                      <Text style={[styles.percent, { color: colors.text }]}>
                        {percent}%
                      </Text>
                      <Text style={{ color: colors.textMuted }}>
                        {member.points} poäng
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Fördelning per syssla
              </Text>
              <Text style={{ color: colors.textMuted }}>
                {tasks.length} sysslor
              </Text>
            </View>

            <View style={styles.grid}>
              {tasks.map((task) => (
                <View
                  key={task.id}
                  style={[styles.choreCard, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.choreChart}>
                    <DonutChart
                      config={{
                        data: toChartData(members, task.pointsByMember),
                        colors: memberColors,
                        strokeWidth: 14,
                      }}
                    />
                  </View>
                  <Text
                    style={[styles.choreName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {task.name}
                  </Text>
                  <Text style={{ color: colors.textMuted }}>{task.count} ggr</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 12,
  },
  retryButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    marginTop: 32,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "600",
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  totalChart: {
    width: "100%",
    height: 240,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  memberStat: {
    alignItems: "center",
  },
  memberName: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  percent: {
    fontSize: 24,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choreCard: {
    width: "31.5%",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
  },
  choreChart: {
    width: "100%",
    height: 90,
  },
  choreName: {
    marginTop: 4,
    fontWeight: "500",
  },
});
