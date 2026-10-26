import Feather from "@expo/vector-icons/Feather";
import { useQueries, useQuery } from "@tanstack/react-query";
import { DonutChart } from "expo-skia-charts";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ErrorView from "@/components/ErrorView";
import LoadingView from "@/components/LoadingView";
import ScreenHeader from "@/components/ScreenHeader";
import Avatar from "@/components/Avatar";
import useActiveHouseholdId from "@/hooks/use-active-household-id";
import usePullToRefresh from "@/hooks/use-pull-to-refresh";
import {
  currentWeek,
  formatPeriodRange,
  isoWeekNumber,
  lastMonth,
  lastWeek,
  type StatisticsPeriod,
} from "@/lib/statistics-period";
import { statisticsQueryOptions } from "@/options/statistics";
import { useTheme } from "@/theme";
import type { MemberStatistics } from "@/types/statistics";
import { avatars } from "@/lib/avatars";

function toChartData(members: MemberStatistics[], points: number[]) {
  return members.map((member, index) => ({
    label: member.nickname,
    value: points[index] ?? 0,
  }));
}

const weekSubtitle = (period: StatisticsPeriod) =>
  `v. ${isoWeekNumber(period.from)} • ${formatPeriodRange(period)}`;

// Oldest first; the left arrow goes back in time
const periodOptions = [
  {
    title: "Förra månaden",
    getPeriod: lastMonth,
    getSubtitle: formatPeriodRange,
  },
  { title: "Förra veckan", getPeriod: lastWeek, getSubtitle: weekSubtitle },
  { title: "Denna vecka", getPeriod: currentWeek, getSubtitle: weekSubtitle },
];

export default function Statistics() {
  const { colors } = useTheme();
  const householdId = useActiveHouseholdId();
  // null = the newest period with data
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const options = periodOptions.map((option) => ({
    ...option,
    period: option.getPeriod(),
  }));
  const results = useQueries({
    queries: options.map(({ period }) =>
      statisticsQueryOptions(householdId, period),
    ),
  });

  if (results.some((result) => result.isPending)) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader />
        <LoadingView />
      </View>
    );
  }

  const failed = results.filter((result) => result.error);
  const error = failed[0]?.error;
  if (error) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader />
        <ErrorView
          error={error}
          retry={() => failed.forEach((result) => result.refetch())}
        />
      </View>
    );
  }

  // Periods without completed tasks are not shown at all
  const visibleOptions = options.filter(
    (_, index) => (results[index].data?.totalPoints ?? 0) > 0,
  );

  if (visibleOptions.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader />
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          Inga utförda sysslor än
        </Text>
      </View>
    );
  }

  // Falls back to the newest period if the selected one no longer has data
  const selectedIndex = visibleOptions.findIndex(
    (option) => option.title === selectedTitle,
  );
  const periodIndex =
    selectedIndex === -1 ? visibleOptions.length - 1 : selectedIndex;
  const { title, period, getSubtitle } = visibleOptions[periodIndex];
  const hasPrevious = periodIndex > 0;
  const hasNext = periodIndex < visibleOptions.length - 1;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader />
      <View
        style={[
          styles.periodCard,
          styles.periodRow,
          { backgroundColor: colors.surface },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Föregående period"
          disabled={!hasPrevious}
          onPress={() =>
            setSelectedTitle(visibleOptions[periodIndex - 1].title)
          }
          style={[styles.arrowButton, !hasPrevious && styles.hidden]}>
          <Feather name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <View style={styles.periodText}>
          <Text style={[styles.periodTitle, { color: colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.periodSubtitle, { color: colors.textMuted }]}>
            {getSubtitle(period)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nästa period"
          disabled={!hasNext}
          onPress={() =>
            setSelectedTitle(visibleOptions[periodIndex + 1].title)
          }
          style={[styles.arrowButton, !hasNext && styles.hidden]}>
          <Feather name="chevron-right" size={28} color={colors.text} />
        </Pressable>
      </View>
      <StatisticsContent period={period} />
    </View>
  );
}

function StatisticsContent({ period }: { period: StatisticsPeriod }) {
  const { colors } = useTheme();
  const householdId = useActiveHouseholdId();
  const { data, error, isPending, refetch } = useQuery(
    statisticsQueryOptions(householdId, period),
  );
  const pullToRefresh = usePullToRefresh(refetch);

  if (isPending) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView error={error} retry={() => refetch()} />;
  }

  const { members, tasks, totalPoints } = data;
  const memberColors = members.map((member) => avatars[member.avatar].color);
  const totalChartData = toChartData(
    members,
    members.map((member) => member.points),
  );

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pullToRefresh.refreshing}
            onRefresh={pullToRefresh.onRefresh}
          />
        }>
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
                    <Avatar avatar={member.avatar} size={24} />

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
              style={[styles.choreCard, { backgroundColor: colors.surface }]}>
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
                numberOfLines={1}>
                {task.name}
              </Text>
              <Text style={{ color: colors.textMuted }}>{task.count} ggr</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  periodCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 2,
  },
  periodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  periodText: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  arrowButton: {
    padding: 4,
  },
  hidden: {
    opacity: 0,
  },
  periodTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  periodSubtitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  safeArea: {
    flex: 1,
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
