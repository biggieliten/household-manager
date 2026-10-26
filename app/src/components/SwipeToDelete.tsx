import { type ReactNode, useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { useTheme } from "@/theme";

type Props = {
  // e.g. "Ta bort bilden", read by screen readers
  label: string;
  disabled?: boolean;
  onDelete: () => void;
  children: ReactNode;
};

function useScreenReaderEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isScreenReaderEnabled().then((value) => {
      if (active) setEnabled(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      setEnabled,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}

// Swipe left to reveal a red "Ta bort", like a queue in Spotify. Screen readers
// can't swipe, so they get a visible button instead.
export default function SwipeToDelete({
  label,
  disabled = false,
  onDelete,
  children,
}: Props) {
  const { colors } = useTheme();
  const screenReaderEnabled = useScreenReaderEnabled();

  if (screenReaderEnabled) {
    return (
      <View style={styles.row}>
        <View style={styles.content}>{children}</View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onDelete}
          style={[
            styles.action,
            styles.fallbackAction,
            { backgroundColor: colors.danger, opacity: disabled ? 0.5 : 1 },
          ]}>
          <Text style={styles.actionText}>Ta bort</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ReanimatedSwipeable
      enabled={!disabled}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      containerStyle={styles.container}
      renderRightActions={(_progress, _translation, swipeable) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={() => {
            swipeable.close();
            onDelete();
          }}
          style={[styles.action, { backgroundColor: colors.danger }]}>
          <Text style={styles.actionText}>Ta bort</Text>
        </Pressable>
      )}>
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },
  content: {
    flex: 1,
  },
  action: {
    width: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackAction: {
    borderRadius: 12,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
