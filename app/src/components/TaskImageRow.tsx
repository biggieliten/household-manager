import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

type Props = {
  // A local file before saving, or the API URL with auth headers afterwards
  source: { uri: string; headers?: Record<string, string> };
  // Tapping the image opens it full screen (pinch to zoom on iOS)
  openable?: boolean;
};

// Removing the image is done by wrapping the row in SwipeToDelete
export default function TaskImageRow({ source, openable = false }: Props) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const thumbnail = (
    <Image
      source={source}
      contentFit="cover"
      accessibilityLabel="Bifogad bild"
      style={[styles.thumbnail, { backgroundColor: colors.border }]}
    />
  );

  return (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      {openable ? (
        <Pressable
          accessibilityRole="imagebutton"
          accessibilityLabel="Visa bilden i helskärm"
          onPress={() => setIsOpen(true)}>
          {thumbnail}
        </Pressable>
      ) : (
        thumbnail
      )}
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.text }]}>Bild</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Bifogad referensbild
        </Text>
      </View>
      {openable && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Visa bilden i helskärm"
          onPress={() => setIsOpen(true)}
          style={({ pressed }) => [
            styles.openButton,
            {
              backgroundColor: colors.background,
              opacity: pressed ? 0.6 : 1,
            },
          ]}>
          <Feather name="maximize-2" size={18} color={colors.text} />
        </Pressable>
      )}
      {isOpen && (
        <FullScreenImage source={source} onClose={() => setIsOpen(false)} />
      )}
    </View>
  );
}

// ScrollView's built-in zoom gives pinch and pan on iOS; Android shows the
// image fitted to the screen
function FullScreenImage({
  source,
  onClose,
}: {
  source: Props["source"];
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onClose}
        style={{ ...styles.viewer, backgroundColor: colors.imageViewerBackground }}>
        <ScrollView
          minimumZoomScale={1}
          maximumZoomScale={4}
          centerContent
          bouncesZoom
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}>
          <Image
            source={source}
            contentFit="contain"
            accessibilityLabel="Bifogad bild i helskärm"
            style={{ width, height }}
          />
        </ScrollView>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Stäng bilden"
          onPress={onClose}
          style={({ pressed }) => [
            { ...styles.closeButton, backgroundColor: colors.imageViewerControl },
            { top: insets.top + 8, opacity: pressed ? 0.6 : 1 },
          ]}>
          <Feather name="x" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 8,
    borderRadius: 12,
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
  openButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  viewer: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
