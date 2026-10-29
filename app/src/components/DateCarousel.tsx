import Feather from "@expo/vector-icons/Feather";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
// Visible days in the strip, and how many of them sit left of the fixed highlight
const VISIBLE_DAYS = 7;
const CENTER = 3;
// Monday first, indexed by Date.getDay() (Sunday = 0)
const WEEKDAY_LETTERS = ["S", "M", "T", "O", "T", "F", "L"];
const DAY_MS = 24 * 60 * 60 * 1000;

const weekdayFormat = new Intl.DateTimeFormat("sv-SE", { weekday: "long" });
const monthFormat = new Intl.DateTimeFormat("sv-SE", { month: "short" });

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
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
  const itemWidth = (width - 32) / VISIBLE_DAYS;
  const listRef = useRef<FlatList<Date>>(null);

  // Local midnight
  const today = addDays(new Date(), 0);
  const firstDay = addDays(currentWeek(today).from, -(WEEKS - 1) * 7);
  const todayIndex = daysBetween(firstDay, today);
  // Up to today, plus the upcoming days filling the strip right of the highlight
  const days = Array.from({ length: todayIndex + 1 + CENTER }, (_, index) =>
    addDays(firstDay, index),
  );
  const selectedIndex = daysBetween(firstDay, selectedDate);
  const isToday = isSameDay(selectedDate, today);
  const isFirstDay = isSameDay(selectedDate, firstDay);

  // The day under the highlight; offset index * itemWidth centers day index
  const [initialIndex] = useState(() => Math.max(selectedIndex, CENTER));
  const [centeredIndex, setCenteredIndex] = useState(initialIndex);
  const centered = useRef(initialIndex);

  function indexAt(event: NativeSyntheticEvent<NativeScrollEvent>): number {
    const index = Math.round(event.nativeEvent.contentOffset.x / itemWidth);
    return Math.min(Math.max(index, 0), todayIndex);
  }

  // Bring the selected day under the highlight after a tap or an arrow press
  useEffect(() => {
    if (selectedIndex !== centered.current) {
      centered.current = selectedIndex;
      setCenteredIndex(selectedIndex);
      listRef.current?.scrollToOffset({
        offset: selectedIndex * itemWidth,
        animated: true,
      });
    }
  }, [selectedIndex, itemWidth]);

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
        <View
          pointerEvents="none"
          style={[
            styles.highlight,
            {
              left: CENTER * itemWidth + 2,
              width: itemWidth - 4,
              backgroundColor: colors.primary,
            },
          ]}
        />
        <FlatList
          ref={listRef}
          data={days}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={itemWidth}
          decelerationRate="fast"
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingLeft: CENTER * itemWidth }}
          keyExtractor={(day) => day.toDateString()}
          initialScrollIndex={initialIndex - CENTER}
          getItemLayout={(_, index) => ({
            length: itemWidth,
            offset: (CENTER + index) * itemWidth,
            index,
          })}
          onScroll={(event) => {
            const index = indexAt(event);
            centered.current = index;
            setCenteredIndex(index);
          }}
          onMomentumScrollEnd={(event) => {
            const index = indexAt(event);
            centered.current = index;
            if (index !== selectedIndex) onSelectDate(days[index]);
          }}
          renderItem={({ item: day, index }) => {
            const selected = index === centeredIndex;
            const future = day > today;
            const textColor = selected ? colors.onPrimary : colors.text;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={daySubtitle(day)}
                accessibilityState={{ selected, disabled: future }}
                disabled={future}
                onPress={() => onSelectDate(day)}
                style={[
                  styles.pill,
                  { width: itemWidth },
                  future && styles.disabled,
                ]}>
                <Text
                  style={[
                    styles.pillLetter,
                    { color: selected ? textColor : colors.textMuted },
                  ]}>
                  {WEEKDAY_LETTERS[day.getDay()]}
                </Text>
                <Text style={[styles.pillDate, { color: textColor }]}>
                  {day.getDate()}
                </Text>
              </Pressable>
            );
          }}
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
  highlight: { position: "absolute", top: 8, bottom: 8, borderRadius: 12 },
  pill: { alignItems: "center", paddingVertical: 6, gap: 2 },
  pillLetter: { fontSize: 13, fontWeight: "600" },
  pillDate: { fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.4 },
});
