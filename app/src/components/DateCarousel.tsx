import Feather from "@expo/vector-icons/Feather";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useTheme } from "@/theme";

// How many days back the strip can be swiped
const PAST_DAYS = 364;
// Days on each side of the centered day
const SIDE_DAYS = 3;
const VISIBLE_DAYS = SIDE_DAYS * 2 + 1;
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
  const dayWidth = (width - 32) / VISIBLE_DAYS;
  const listRef = useRef<FlatList<Date>>(null);

  // Local midnight
  const today = addDays(new Date(), 0);
  // Dimmed days pad both ends so the oldest and newest selectable days can be centered
  const days = Array.from(
    { length: PAST_DAYS + 1 + SIDE_DAYS * 2 },
    (_, index) => addDays(today, index - SIDE_DAYS - PAST_DAYS),
  );
  const firstDay = days[SIDE_DAYS];
  const isToday = isSameDay(selectedDate, today);
  const isFirstDay = isSameDay(selectedDate, firstDay);
  const selectedIndex = days.findIndex((day) => isSameDay(day, selectedDate));
  const centeredIndex = useRef(selectedIndex);
  // The day under the fixed square; follows the scroll, while selection waits for the strip to stop
  const [highlightIndex, setHighlightIndex] = useState(selectedIndex);

  // Slide the strip when a tap or the arrows change the selected day
  useEffect(() => {
    if (selectedIndex !== -1 && selectedIndex !== centeredIndex.current) {
      centeredIndex.current = selectedIndex;
      listRef.current?.scrollToOffset({
        offset: (selectedIndex - SIDE_DAYS) * dayWidth,
        animated: true,
      });
    }
  }, [selectedIndex, dayWidth]);

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
          style={[
            styles.centerSquare,
            {
              left: SIDE_DAYS * dayWidth + 2,
              width: dayWidth - 4,
              backgroundColor: colors.primary,
            },
          ]}
        />
        <FlatList
          ref={listRef}
          data={days}
          horizontal
          snapToInterval={dayWidth}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          keyExtractor={(day) => day.toDateString()}
          initialScrollIndex={Math.max(selectedIndex - SIDE_DAYS, 0)}
          getItemLayout={(_, index) => ({
            length: dayWidth,
            offset: dayWidth * index,
            index,
          })}
          scrollEventThrottle={16}
          onScroll={(event) =>
            setHighlightIndex(
              Math.round(event.nativeEvent.contentOffset.x / dayWidth) +
                SIDE_DAYS,
            )
          }
          onMomentumScrollEnd={(event) => {
            const index =
              Math.round(event.nativeEvent.contentOffset.x / dayWidth) +
              SIDE_DAYS;
            // Snap back from the dimmed days past either end
            const clamped = Math.min(
              Math.max(index, SIDE_DAYS),
              SIDE_DAYS + PAST_DAYS,
            );
            centeredIndex.current = clamped;
            if (clamped !== index) {
              listRef.current?.scrollToOffset({
                offset: (clamped - SIDE_DAYS) * dayWidth,
                animated: true,
              });
            }
            if (!isSameDay(days[clamped], selectedDate)) {
              onSelectDate(days[clamped]);
            }
          }}
          renderItem={({ item: day, index }) => {
            const selected = isSameDay(day, selectedDate);
            const highlighted = index === highlightIndex;
            const outOfRange = day > today || day < firstDay;
            const textColor = highlighted ? colors.onPrimary : colors.text;
            return (
              <View style={[styles.day, { width: dayWidth }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={daySubtitle(day)}
                  accessibilityState={{ selected, disabled: outOfRange }}
                  disabled={outOfRange}
                  onPress={() => onSelectDate(day)}
                  style={[
                    styles.pill,
                    outOfRange && styles.disabled,
                  ]}>
                  <Text
                    style={[
                      styles.pillLetter,
                      { color: highlighted ? textColor : colors.textMuted },
                    ]}>
                    {/* getDay() starts on Sunday; the letters start on Monday */}
                    {WEEKDAY_LETTERS[(day.getDay() + 6) % 7]}
                  </Text>
                  <Text style={[styles.pillDate, { color: textColor }]}>
                    {day.getDate()}
                  </Text>
                </Pressable>
              </View>
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
  // Matches the pill: the strip's vertical padding, the pill margins and corners
  centerSquare: { position: "absolute", top: 8, bottom: 8, borderRadius: 12 },
  day: { flexDirection: "row" },
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
