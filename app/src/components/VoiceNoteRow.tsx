import Feather from "@expo/vector-icons/Feather";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

type Props = {
  source: { uri: string; headers?: Record<string, string> };
  // Known right after recording; otherwise read from the player once loaded
  durationMillis?: number;
};

export function formatDuration(millis: number) {
  const totalSeconds = Math.max(0, Math.round(millis / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Removing the voice note is done by wrapping the row in SwipeToDelete
export default function VoiceNoteRow({ source, durationMillis }: Props) {
  const { colors } = useTheme();
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  const total = durationMillis ?? status.duration * 1000;
  const atEnd = status.duration > 0 && status.currentTime >= status.duration;

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    // Start over once the note has played to the end
    if (atEnd) player.seekTo(0);
    player.play();
  };

  return (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          status.playing ? "Pausa röstmemo" : "Spela röstmemo"
        }
        accessibilityState={{ disabled: !status.isLoaded }}
        disabled={!status.isLoaded}
        onPress={togglePlayback}
        style={[styles.playButton, { backgroundColor: colors.background }]}>
        {status.playing ? (
          <Feather name="pause" size={16} color={colors.text} />
        ) : (
          // A triangle looks off-centre when centred by its box
          <Feather
            name="play"
            size={16}
            color={colors.text}
            style={styles.playIcon}
          />
        )}
      </Pressable>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.text }]}>Röstmemo</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {status.playing
            ? `${formatDuration(status.currentTime * 1000)} / ${formatDuration(total)}`
            : formatDuration(total)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    marginLeft: 2,
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
});
