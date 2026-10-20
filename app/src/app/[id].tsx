import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import useActiveHouseholdId from "@/hooks/use-active-household-id";
import { tasksQueryOptions } from "@/options/tasks";
import { useTheme } from "@/theme";
import type { Avatar } from "@shared/schemas/member-schema";

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

type HistoryEntry = {
  avatar: Avatar;
  nickname: string;
  daysAgo: number;
  count: number;
};

// Placeholder history until completions are fetched from the backend.
const exampleHistory: HistoryEntry[] = [
  { avatar: "PIG", nickname: "Maja", daysAgo: 24, count: 6 },
  { avatar: "FOX", nickname: "Sara", daysAgo: 38, count: 7 },
  { avatar: "CHICKEN", nickname: "David", daysAgo: 49, count: 5 },
];

const accents = {
  light: {
    tile: "#EEEDFC",
    chip: "#E2E4FB",
    categoryBg: "#D9F5E6",
    categoryText: "#1E7A4C",
    danger: "#A63A3A",
    dangerText: "#C0504D",
  },
  dark: {
    tile: "#26273A",
    chip: "#33354A",
    categoryBg: "#1E3B2E",
    categoryText: "#7FD8A8",
    danger: "#B04646",
    dangerText: "#F08A85",
  },
} as const;

function difficultyLabel(level: number): string {
  if (level <= 1) return "Lätt";
  if (level <= 3) return "Normal";
  if (level <= 5) return "Medeltung";
  if (level <= 7) return "Tung";
  return "Mycket tung";
}

function frequencyLabel(frequency: number): string {
  if (frequency === 0) return "Återkommer inte";
  if (frequency === 1) return "Varje dag";
  return `Var ${frequency}:e dag`;
}

function daysSince(date: Date, today: Date): number {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function daysAgoLabel(days: number): string {
  if (days === 0) return "Idag";
  if (days === 1) return "Igår";
  return `${days} dagar sedan`;
}

export default function TaskById() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const accent = accents[scheme];
  const householdId = useActiveHouseholdId();
  const {
    data: tasks,
    error,
    isPending,
    refetch,
  } = useQuery(tasksQueryOptions(householdId));
  const task = tasks?.find((task) => task.id === Number(id));

  const screenBackground =
    scheme === "light" ? colors.surface : colors.background;
  const cardStyle = [styles.card, { backgroundColor: colors.background }];
  const cardStyleDark = scheme === "dark" && {
    backgroundColor: colors.surface,
  };

  if (isPending) {
    return (
      <View style={[styles.notFound, { backgroundColor: screenBackground }]}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.notFound, { backgroundColor: screenBackground }]}>
        <Text style={[styles.notFoundText, { color: colors.textMuted }]}>
          {error.message}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => refetch()}>
          <Text style={{ color: colors.primary }}>Försök igen</Text>
        </Pressable>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.notFound, { backgroundColor: screenBackground }]}>
        <Text style={[styles.notFoundText, { color: colors.textMuted }]}>
          Sysslan hittades inte
        </Text>
      </View>
    );
  }

  const latestCompletion = task.completedTasks[0];
  const lastDone = latestCompletion
    ? daysAgoLabel(daysSince(latestCompletion.completedAt, new Date()))
    : "Aldrig gjord";
  const totalThisYear = exampleHistory.reduce((sum, e) => sum + e.count, 0);

  return (
    <ScrollView
      style={{ backgroundColor: screenBackground }}
      contentContainerStyle={styles.content}>
      <View style={[cardStyle, cardStyleDark]}>
        <Text style={[styles.title, { color: colors.text }]}>{task.name}</Text>

        <View style={styles.statsRow}>
          <Text style={[styles.stat, { color: colors.textMuted }]}>
            <Text style={{ color: accent.danger }}>⚡</Text>{" "}
            {task.difficultyLevel} p ({difficultyLabel(task.difficultyLevel)})
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Markera som klar, ${task.difficultyLevel} poäng`}
          // TODO: register a completion once the API supports it
          onPress={() => {}}
          style={({ pressed }) => [
            styles.doneButton,
            { backgroundColor: accent.danger, opacity: pressed ? 0.8 : 1 },
          ]}>
          <Text style={styles.doneButtonText}>✓ Markera som klar</Text>
          <View style={styles.doneBadge}>
            <Text style={styles.doneBadgeText}>+{task.difficultyLevel}p</Text>
          </View>
        </Pressable>
      </View>

      <View style={[cardStyle, cardStyleDark]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Instruktioner
          </Text>
        </View>

        <View style={[styles.tile, { backgroundColor: accent.tile }]}>
          <View
            style={[styles.playButton, { backgroundColor: colors.background }]}>
            <Text style={[styles.playIcon, { color: colors.text }]}>▶</Text>
          </View>
          <View style={styles.tileContent}>
            <Text style={[styles.tileTitle, { color: colors.text }]}>
              Röstmemo: Tröskeln
            </Text>
            <Text style={[styles.tileTitle, { color: colors.text }]}>0:24</Text>
          </View>
        </View>

        <View style={[styles.tile, { backgroundColor: accent.tile }]}>
          <View style={[styles.thumbnail, { backgroundColor: accent.chip }]}>
            <Text style={styles.thumbnailEmoji}>🛋️</Text>
          </View>
          <View style={styles.tileContent}>
            <Text style={[styles.tileTitle, { color: colors.text }]}>
              Beskrivning
            </Text>
            <Text style={[styles.tileBody, { color: colors.text }]}>
              {task.description}
            </Text>
          </View>
          <Text style={[styles.iconText, { color: colors.text }]}>⤢</Text>
        </View>
      </View>

      <View style={[cardStyle, cardStyleDark]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Historik
          </Text>
          <Text style={[styles.historyTotal, { color: colors.text }]}>
            {totalThisYear} ggr i år
          </Text>
        </View>

        {exampleHistory.map((entry, index) => (
          <View key={entry.nickname} style={styles.historyRow}>
            <View style={[styles.avatar, { backgroundColor: accent.chip }]}>
              <Text style={styles.avatarEmoji}>
                {avatarEmoji[entry.avatar]}
              </Text>
            </View>
            <View style={styles.tileContent}>
              <Text style={[styles.historyName, { color: colors.text }]}>
                {entry.nickname}
                {index === 0 && (
                  <Text style={{ color: colors.textMuted, fontWeight: "400" }}>
                    {" "}
                    · Senast
                  </Text>
                )}
              </Text>
              <Text style={[styles.tileBody, { color: colors.text }]}>
                {daysAgoLabel(entry.daysAgo)}
              </Text>
            </View>
            <Text style={[styles.historyCount, { color: colors.text }]}>
              {index === 0
                ? `+${task.difficultyLevel} p`
                : `${entry.count} ggr`}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Markera som klar, ${task.difficultyLevel} poäng`}
        // TODO: register a completion once the API supports it
        onPress={() => {}}
        style={({ pressed }) => [
          styles.doneButton,
          { backgroundColor: accent.danger, opacity: pressed ? 0.8 : 1 },
        ]}>
        <Text style={styles.doneButtonText}>✓ Markera som klar</Text>
        <View style={styles.doneBadge}>
          <Text style={styles.doneBadgeText}>+{task.difficultyLevel}p</Text>
        </View>
      </Pressable>
      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Redigera inställningar"
          onPress={() =>
            router.push({
              pathname: "/create-task",
              params: { id: String(task.id) },
            })
          }
          style={({ pressed }) => [
            styles.editButton,
            { backgroundColor: accent.chip, opacity: pressed ? 0.8 : 1 },
          ]}>
          <Text style={[styles.editButtonText, { color: colors.text }]}>
            ☰ Redigera inställningar
          </Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        // TODO: archive task
        onPress={() => {}}
        style={styles.textButton}>
        <Text style={[styles.archiveText, { color: colors.text }]}>
          Arkivera syssla
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 16 },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  metaChip: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  metaChipText: { fontSize: 13, fontWeight: "600" },
  card: { borderRadius: 20, padding: 20, gap: 14 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryChip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  categoryText: { fontSize: 13, fontWeight: "700" },
  categoryIcon: { fontSize: 26 },
  title: { fontSize: 28, fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: 20 },
  stat: { fontSize: 15 },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 4,
  },
  doneButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "600" },
  doneBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  doneBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  sectionTitle: { fontSize: 18, fontWeight: "600" },
  iconRow: { flexDirection: "row", gap: 16 },
  iconText: { fontSize: 18 },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    padding: 12,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: { fontSize: 14 },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailEmoji: { fontSize: 26 },
  tileContent: { flex: 1, gap: 2 },
  tileTitle: { fontSize: 15, fontWeight: "600" },
  tileBody: { fontSize: 15 },
  historyTotal: { fontSize: 13, fontWeight: "600" },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 22 },
  historyName: { fontSize: 14, fontWeight: "600" },
  historyCount: { fontSize: 14, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 12 },
  editButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
  },
  editButtonText: { fontSize: 17, fontWeight: "500" },
  shareButton: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  textButton: { alignItems: "center", paddingVertical: 6 },
  archiveText: { fontSize: 15, fontWeight: "500" },
  deleteText: { fontSize: 13, fontWeight: "500" },
});
