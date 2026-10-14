import { useTheme } from "@/theme";
import { DonutChart } from "expo-skia-charts";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const members = [
  { name: "Alex", color: "#F0866A" },
  { name: "Sam", color: "#EDC45E" },
  { name: "Kim", color: "#C9546F" },
];

const memberColors = members.map((member) => member.color);

// Poäng i samma ordning som `members`
const totalPoints = [18, 16, 12];

const chores = [
  { name: "Laga mat", count: 8, points: [4, 2, 2] },
  { name: "Damma", count: 3, points: [2, 0, 1] },
  { name: "Diska", count: 12, points: [5, 4, 3] },
  { name: "Ta hand om My", count: 14, points: [7, 0, 7] },
  { name: "Torka golvet", count: 2, points: [0, 1, 1] },
  { name: "Vattna blommor", count: 4, points: [1, 2, 1] },
];

function toChartData(points: number[]) {
  return members.map((member, index) => ({
    label: member.name,
    value: points[index] ?? 0,
  }));
}

const totalChartData = toChartData(totalPoints);
const totalSum = totalPoints.reduce((sum, value) => sum + value, 0);
const choreCharts = chores.map((chore) => ({
  ...chore,
  data: toChartData(chore.points),
}));

export default function Statistics() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Totalt</Text>
          <View style={[styles.badge, { backgroundColor: colors.border }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {totalSum} p
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
          {members.map((member, index) => {
            const points = totalPoints[index] ?? 0;
            const percent = Math.round((points / totalSum) * 100);
            return (
              <View key={member.name} style={styles.memberStat}>
                <View style={styles.memberName}>
                  <View style={[styles.dot, { backgroundColor: member.color }]} />
                  <Text style={{ color: colors.text }}>{member.name}</Text>
                </View>
                <Text style={[styles.percent, { color: colors.text }]}>
                  {percent}%
                </Text>
                <Text style={{ color: colors.textMuted }}>{points} poäng</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Fördelning per syssla
        </Text>
        <Text style={{ color: colors.textMuted }}>{chores.length} sysslor</Text>
      </View>

      <View style={styles.grid}>
        {choreCharts.map((chore) => (
          <View
            key={chore.name}
            style={[styles.choreCard, { backgroundColor: colors.surface }]}
          >
            <View style={styles.choreChart}>
              <DonutChart
                config={{
                  data: chore.data,
                  colors: memberColors,
                  strokeWidth: 14,
                }}
              />
            </View>
            <Text
              style={[styles.choreName, { color: colors.text }]}
              numberOfLines={1}
            >
              {chore.name}
            </Text>
            <Text style={{ color: colors.textMuted }}>{chore.count} ggr</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
