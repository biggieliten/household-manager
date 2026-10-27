import Feather from "@expo/vector-icons/Feather";
import { useEffect, useRef } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { currentWeek } from "@/lib/statistics-period";
import { useTheme } from "@/theme";

// How many weeks back the strip can be swiped, including the current one
const WEEKS = 52;
const WEEKDAY_LETTERS = ["M", "T", "O", "T", "F", "L", "S"];

const weekdayFormat = new Intl.DateTimeFormat("sv-SE", { weekday: "long" });
const monthFormat = new Intl.DateTimeFormat("sv-SE", { month: "short" });

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function dayTitle(date: Date, today: Date): string {
  if (isSameDay(date, today)) return "Idag";
  if (isSameDay(date, addDays(today, -1))) return "Igår";
  return capitalize(weekdayFormat.format(date));
}

// "Torsdag, 24 okt" (some engines format short months with a trailing dot)
function daySubtitle(date: Date): string {
  const month = monthFormat.format(date).replace(/\.$/, "");
  return `${capitalize(weekdayFormat.format(date))}, ${date.getDate()} ${month}`;
}

interface Props {
  // Local midnight
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export default function DateCarousel({
  selectedDate,
  onSelectDate,
}: Props): React.JSX.Element {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const pageWidth = width - 32;
  const listRef = useRef<FlatList<Date>>(null);
  const visibleWeek = useRef(WEEKS - 1);

  // Local midnight
  const today = addDays(new Date(), 0);
  const thisMonday = currentWeek(today).from;
  const weeks = Array.from({ length: WEEKS }, (_, index) =>
    addDays(thisMonday, (index - (WEEKS - 1)) * 7),
  );
  const firstDay = weeks[0];
  const isToday = isSameDay(selectedDate, today);
  const isFirstDay = isSameDay(selectedDate, firstDay);

  // Keep the strip on the selected week when the arrows cross a week boundary
  useEffect(() => {
    const selectedMonday = currentWeek(selectedDate).from;
    const index = weeks.findIndex((monday) => isSameDay(monday, selectedMonday));
    if (index !== -1 && index !== visibleWeek.current) {
      visibleWeek.current = index;
      listRef.current?.scrollToIndex({ index, animated: true });
    }
  }, [selectedDate, weeks]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Föregående dag"
          disabled={isFirstDay}
          onPress={() => onSelectDate(addDays(selectedDate, -1))}
          hitSlop={8}
          style={isFirstDay && styles.disabled}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>
              {dayTitle(selectedDate, today)}
            </Text>
            {isToday && (
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
            )}
          </View>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {daySubtitle(selectedDate)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nästa dag"
          disabled={isToday}
          onPress={() => onSelectDate(addDays(selectedDate, 1))}
          hitSlop={8}
          style={isToday && styles.disabled}>
          <Feather name="chevron-right" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.strip, { backgroundColor: colors.card }]}>
        <FlatList
          ref={listRef}
          data={weeks}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(monday) => monday.toDateString()}
          initialScrollIndex={WEEKS - 1}
          getItemLayout={(_, index) => ({
            length: pageWidth,
            offset: pageWidth * index,
            index,
          })}
          onMomentumScrollEnd={(event) => {
            visibleWeek.current = Math.round(
              event.nativeEvent.contentOffset.x / pageWidth,
            );
          }}
          renderItem={({ item: monday }) => (
            <View style={[styles.week, { width: pageWidth }]}>
              {WEEKDAY_LETTERS.map((letter, offset) => {
                const day = addDays(monday, offset);
                const selected = isSameDay(day, selectedDate);
                const future = day > today;
                const textColor = selected ? "#FFFFFF" : colors.text;
                return (
                  <Pressable
                    key={offset}
                    accessibilityRole="button"
                    accessibilityLabel={daySubtitle(day)}
                    accessibilityState={{ selected, disabled: future }}
                    disabled={future}
                    onPress={() => onSelectDate(day)}
                    style={[
                      styles.pill,
                      selected && { backgroundColor: colors.primary },
                      future && styles.disabled,
                    ]}>
                    <Text
                      style={[
                        styles.pillLetter,
                        { color: selected ? textColor : colors.textMuted },
                      ]}>
                      {letter}
                    </Text>
                    <Text style={[styles.pillDate, { color: textColor }]}>
                      {day.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  titleBlock: { alignItems: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 20, fontWeight: "700" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  subtitle: { fontSize: 13, fontWeight: "600" },
  strip: { borderRadius: 20, paddingVertical: 8, overflow: "hidden" },
  week: { flexDirection: "row", paddingHorizontal: 8 },
  pill: {
    flex: 1,
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 6,
    marginHorizontal: 2,
    gap: 2,
  },
  pillLetter: { fontSize: 13, fontWeight: "600" },
  pillDate: { fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.4 },
});
