import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatDuration } from "@/components/VoiceNoteRow";
import { useTheme } from "@/theme";

type Props = {
  onRecorded: (uri: string, durationMillis: number) => void;
  onError: (message: string) => void;
  // Nothing usable was recorded, e.g. Stoppa was tapped right away
  onCancel: () => void;
};

// RecordingPresets.HIGH_QUALITY records AAC in an .m4a (MP4) file
export const VOICE_NOTE_MIME_TYPE = "audio/mp4";

const MAX_RECORDING_MILLIS = 2 * 60 * 1000;
const MIN_RECORDING_MILLIS = 500;

// Starts recording as soon as it is shown; the parent unmounts it when done
export default function VoiceNoteRecorder({
  onRecorded,
  onError,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  // HIGH_QUALITY records .m4a, about 2 MB for the full 2 minutes
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const started = useRef(false);
  const stopping = useRef(false);

  useEffect(() => {
    // React runs effects twice in development; only start one recording
    if (started.current) return;
    started.current = true;

    const start = async () => {
      try {
        const permission = await requestRecordingPermissionsAsync();
        if (!permission.granted) {
          onError(
            "Ge appen tillgång till mikrofonen i Inställningar för att spela in.",
          );
          return;
        }
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
        await recorder.prepareToRecordAsync();
        recorder.record();
      } catch (error) {
        onError(`Kunde inte starta inspelningen: ${String(error)}`);
      }
    };
    void start();
  }, [recorder, onError]);

  const stop = useCallback(async () => {
    if (stopping.current) return;
    stopping.current = true;
    const { durationMillis } = recorder.getStatus();

    try {
      await recorder.stop();
      // Without this, iOS plays the recording through the quiet earpiece
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
    } catch (error) {
      onError(`Kunde inte spara inspelningen: ${String(error)}`);
      return;
    }

    if (!recorder.uri || durationMillis < MIN_RECORDING_MILLIS) {
      onCancel();
      return;
    }
    onRecorded(recorder.uri, durationMillis);
  }, [recorder, onError, onCancel, onRecorded]);

  useEffect(() => {
    if (state.isRecording && state.durationMillis >= MAX_RECORDING_MILLIS) {
      void stop();
    }
  }, [state.isRecording, state.durationMillis, stop]);

  return (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <View
        style={[
          styles.dot,
          {
            backgroundColor: colors.primary,
            opacity: state.isRecording ? 1 : 0.4,
          },
        ]}
      />
      <Text
        accessibilityLiveRegion="polite"
        style={[styles.label, { color: colors.text }]}>
        {state.isRecording ? "Spelar in…" : "Förbereder…"}
      </Text>
      <Text style={[styles.time, { color: colors.textMuted }]}>
        {formatDuration(state.durationMillis)} /{" "}
        {formatDuration(MAX_RECORDING_MILLIS)}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Stoppa inspelningen"
        accessibilityState={{ disabled: !state.isRecording }}
        disabled={!state.isRecording}
        onPress={stop}
        style={[styles.stopButton, { backgroundColor: colors.primary }]}>
        <Text style={{ ...styles.stopText, color: colors.onPrimary }}>Stoppa</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  time: {
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  stopButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  stopText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
