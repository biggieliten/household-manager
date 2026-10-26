import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

type Props = {
  // A local file before saving, or the API URL with auth headers afterwards
  source: { uri: string; headers?: Record<string, string> };
  // When given, a button shows the image at full width below the row
  expanded?: boolean;
  onToggleExpanded?: () => void;
};

// Removing the image is done by wrapping the row in SwipeToDelete
export default function TaskImageRow({
  source,
  expanded = false,
  onToggleExpanded,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.row}>
        <Image
          source={source}
          contentFit="cover"
          accessibilityLabel="Bifogad bild"
          style={[styles.thumbnail, { backgroundColor: colors.border }]}
        />
        <View style={styles.text}>
          <Text style={[styles.title, { color: colors.text }]}>Bild</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Bifogad referensbild
          </Text>
        </View>
        {onToggleExpanded && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              expanded ? "Minimera bilden" : "Visa bilden i full storlek"
            }
            accessibilityState={{ expanded }}
            onPress={onToggleExpanded}
            style={({ pressed }) => [
              styles.expandButton,
              {
                backgroundColor: colors.background,
                opacity: pressed ? 0.6 : 1,
              },
            ]}>
            <Text style={[styles.expandIcon, { color: colors.text }]}>
              {expanded ? "⤡" : "⤢"}
            </Text>
          </Pressable>
        )}
      </View>
      {expanded && (
        <Image
          source={source}
          contentFit="contain"
          accessibilityLabel="Bifogad bild i full storlek"
          style={styles.fullImage}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    padding: 8,
    borderRadius: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  expandButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  expandIcon: {
    fontSize: 22,
  },
  fullImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 8,
  },
});
