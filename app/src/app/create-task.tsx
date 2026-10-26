import Feather from "@expo/vector-icons/Feather";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import ImageSourceChoice from "@/components/ImageSourceChoice";
import SwipeToDelete from "@/components/SwipeToDelete";
import TaskImageRow from "@/components/TaskImageRow";
// The shared TypeScript configuration does not enable JSX, although this imported component is TSX.
import TaskMemberPicker from "@/components/TaskMemberPicker";
import VoiceNoteRecorder, {
  VOICE_NOTE_MIME_TYPE,
} from "@/components/VoiceNoteRecorder";
import VoiceNoteRow from "@/components/VoiceNoteRow";
import useActiveHouseholdId from "@/hooks/use-active-household-id";
import { assignTask } from "@/lib/api/task-assignments";
import {
  createTask,
  deleteTaskMedia,
  taskMediaUrl,
  updateTask,
  uploadTaskMedia,
} from "@/lib/api/tasks";
import { type ImageSource, pickTaskImage } from "@/lib/pick-task-image";
import { authHeadersQueryOptions } from "@/options/auth";
import { householdQueryOptions } from "@/options/households";
import {
  taskAssignmentsQueryOptions,
  taskQueryOptions,
  tasksQueryOptions,
} from "@/options/tasks";
import { useTheme } from "@/theme";
import type { TaskMediaKind } from "@shared/schemas/task-media-schema";
import type { CreateTaskBody } from "@shared/schemas/task-schema";
import { createTaskBodySchema } from "@shared/schemas/task-schema";

const frequencyOptions = Array.from({ length: 31 }, (_, i) => i);
const difficultyOptions = [
  { value: 1, label: "Lätt" },
  { value: 2, label: "Normal" },
  { value: 4, label: "Tung" },
  { value: 6, label: "Krävande" },
  { value: 8, label: "Mycket tung" },
];

const initialTask: CreateTaskBody = {
  name: "",
  description: "",
  frequency: 7,
  difficultyLevel: 2,
};

// Picked or recorded on the phone; uploaded when the task is saved
type PendingMedia = {
  image?: { uri: string; mimeType: string };
  audio?: { uri: string; mimeType: string; durationMillis: number };
};

const mediaKinds: readonly TaskMediaKind[] = ["image", "audio"];

function close() {
  if (router.canGoBack()) router.back();
}

export default function CreateTask() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [task, setTask] = useState<CreateTaskBody>(initialTask);

  const householdId = useActiveHouseholdId();
  const { data: taskById } = useQuery(
    taskQueryOptions(householdId, id ? Number(id) : undefined),
  );

  const [prefilledId, setPrefilledId] = useState<number | null>(null);

  if (taskById && prefilledId !== taskById.id) {
    setPrefilledId(taskById.id);
    setTask({
      name: taskById.name,
      description: taskById.description,
      frequency: taskById.frequency,
      difficultyLevel: taskById.difficultyLevel,
    });
  }

  const update = <K extends keyof CreateTaskBody>(
    key: K,
    value: CreateTaskBody[K],
  ) => setTask((prev) => ({ ...prev, [key]: value }));

  const isEditing = !!id;

  // Only admins may assign members (the API rejects others)
  const { data: household } = useQuery(householdQueryOptions(householdId));
  const isAdmin =
    household?.members.some((member) => member.isMe && member.isAdmin) ?? false;
  const [selectedMemberIds, setSelectedMemberIds] = useState<
    ReadonlySet<number>
  >(new Set());
  // Set when the task was saved but some members could not be assigned or
  // some media changes failed, so saving again retries only those instead of
  // creating a duplicate task
  const [partialSave, setPartialSave] = useState<{
    taskId: number;
    assignedMemberIds: ReadonlySet<number>;
    savedMedia: ReadonlySet<TaskMediaKind>;
    error: string;
  } | null>(null);
  const isLocked = partialSave !== null;

  const [media, setMedia] = useState<PendingMedia>({});
  // When editing: existing media the user swiped away, deleted on save
  const [removedMedia, setRemovedMedia] = useState<ReadonlySet<TaskMediaKind>>(
    new Set(),
  );
  const [isChoosingImage, setIsChoosingImage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const { data: authHeaders } = useQuery({
    ...authHeadersQueryOptions,
    enabled: isEditing,
  });

  // The task's saved file, unless it has been swiped away in this form
  const existingMedia = (kind: TaskMediaKind) =>
    isEditing && !removedMedia.has(kind)
      ? taskById?.media.find((item) => item.kind === kind)
      : undefined;
  const existingImage = existingMedia("image");
  const existingAudio = existingMedia("audio");

  const keepMedia = (kind: TaskMediaKind) =>
    setRemovedMedia((prev) => {
      const next = new Set(prev);
      next.delete(kind);
      return next;
    });

  const pickImage = async (source: ImageSource) => {
    setIsChoosingImage(false);
    setMediaError(null);
    const result = await pickTaskImage(source);
    if (result.status === "picked") {
      setMedia((prev) => ({
        ...prev,
        image: { uri: result.uri, mimeType: result.mimeType },
      }));
      keepMedia("image");
    } else if (result.status === "error") {
      setMediaError(result.message);
    }
  };

  const startRecording = () => {
    setIsChoosingImage(false);
    setMediaError(null);
    setIsRecording(true);
  };

  // Removes the new file and, when editing, marks the saved one for deletion
  const removeMedia = (kind: TaskMediaKind) => {
    setMedia((prev) => ({ ...prev, [kind]: undefined }));
    if (isEditing) setRemovedMedia((prev) => new Set(prev).add(kind));
  };

  const toggleMember = (memberId: number) =>
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });

  const saveTaskMutation = useMutation({
    mutationFn: async (body: CreateTaskBody) => {
      if (!householdId) throw new Error("Inget aktivt hushåll");

      let taskId: number;
      const assignedMemberIds = new Set(partialSave?.assignedMemberIds);
      let assignments: PromiseSettledResult<unknown>[] = [];
      if (isEditing) {
        taskId = Number(id);
        // A retry only redoes the media changes that failed
        if (!partialSave) await updateTask(householdId, taskId, body);
      } else {
        taskId =
          partialSave?.taskId ?? (await createTask(householdId, body)).id;
        const memberIds = [...selectedMemberIds].filter(
          (memberId) => !assignedMemberIds.has(memberId),
        );
        assignments = await Promise.allSettled(
          memberIds.map((memberId) =>
            assignTask(householdId, { taskId, memberId }),
          ),
        );
        assignments.forEach((result, index) => {
          if (result.status === "fulfilled")
            assignedMemberIds.add(memberIds[index]);
        });
      }

      // New files are uploaded (replacing a saved one); swiped-away saved
      // files are deleted
      const savedMedia = new Set(partialSave?.savedMedia);
      const mediaChanges = mediaKinds.flatMap<{
        kind: TaskMediaKind;
        run: () => Promise<unknown>;
      }>((kind) => {
        if (savedMedia.has(kind)) return [];
        const file = media[kind];
        if (file) {
          return [
            {
              kind,
              run: () =>
                uploadTaskMedia(
                  householdId,
                  taskId,
                  kind,
                  file.uri,
                  file.mimeType,
                ),
            },
          ];
        }
        const hasSavedFile = taskById?.media.some((item) => item.kind === kind);
        return removedMedia.has(kind) && hasSavedFile
          ? [{ kind, run: () => deleteTaskMedia(householdId, taskId, kind) }]
          : [];
      });
      const mediaResults = await Promise.allSettled(
        mediaChanges.map((change) => change.run()),
      );
      mediaResults.forEach((result, index) => {
        if (result.status === "fulfilled")
          savedMedia.add(mediaChanges[index].kind);
      });

      const failure = [...assignments, ...mediaResults].find(
        (result) => result.status === "rejected",
      );

      return {
        taskId,
        assignedMemberIds,
        savedMedia,
        error: failure
          ? failure.reason instanceof Error
            ? failure.reason.message
            : String(failure.reason)
          : undefined,
      };
    },
    onSuccess: async (
      { taskId, assignedMemberIds, savedMedia, error },
      body,
    ) => {
      // Also covers the single task, whose key starts with the list's key
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: tasksQueryOptions(householdId).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: taskAssignmentsQueryOptions(householdId).queryKey,
        }),
      ]);
      if (error) {
        setPartialSave({ taskId, assignedMemberIds, savedMedia, error });
        return;
      }

      setTask(initialTask);
      setSelectedMemberIds(new Set());
      setMedia({});
      setRemovedMedia(new Set());
      setIsChoosingImage(false);
      setMediaError(null);
      setPartialSave(null);
      if (router.canGoBack()) {
        router.push("/");
      } else {
        Alert.alert(
          isEditing ? "Syssla uppdaterad" : "Syssla skapad",
          body.name,
        );
      }
    },
    onError: (error) => {
      Alert.alert("Något gick fel", String(error));
    },
  });

  const canSave =
    !!householdId &&
    createTaskBodySchema.safeParse(task).success &&
    !saveTaskMutation.isPending &&
    !isRecording;

  const handleSave = () => {
    const result = createTaskBodySchema.safeParse(task);
    if (!result.success) return;

    saveTaskMutation.mutate(result.data);
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.text,
    },
  ];
  const labelStyle = [styles.label, { color: colors.textMuted }];
  const panelStyle = [styles.panel, { backgroundColor: colors.surface }];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled">
      {/*
       */}

      <View style={styles.section}>
        <Text style={labelStyle}>Titel</Text>
        <TextInput
          value={task.name}
          onChangeText={(value) => update("name", value)}
          placeholder={
            taskById?.name ? taskById.name : "T.ex. Dammsuga vardagsrummet"
          }
          placeholderTextColor={colors.textMuted}
          editable={!isLocked}
          style={inputStyle}
        />
      </View>

      <View style={styles.section}>
        <Text style={labelStyle}>Beskrivning</Text>
        <TextInput
          value={task.description}
          onChangeText={(value) => update("description", value)}
          placeholder="Beskriv vad som ska göras eller speciella önskemål…"
          placeholderTextColor={colors.textMuted}
          multiline
          editable={!isLocked}
          style={[inputStyle, styles.multiline]}
        />
      </View>

      {/* Changes here are saved together with the rest of the form */}
      <View style={styles.section}>
        <Text style={[labelStyle, styles.caps]}>
          Hjälpmedel & instruktioner
        </Text>
        <View style={styles.row}>
          {[
            {
              icon: "camera" as const,
              label:
                media.image || existingImage ? "Byt bild" : "Lägg till bild",
              expanded: isChoosingImage,
              onPress: () => setIsChoosingImage((prev) => !prev),
            },
            {
              icon: "mic" as const,
              label:
                media.audio || existingAudio
                  ? "Spela in igen"
                  : "Spela in röst",
              expanded: undefined,
              onPress: startRecording,
            },
          ].map(({ icon, label, expanded, onPress }) => {
            const disabled = isLocked || isRecording;
            return (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityState={{ disabled, expanded }}
                disabled={disabled}
                onPress={onPress}
                style={[
                  styles.aidButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: disabled ? 0.5 : 1,
                  },
                ]}>
                <Feather name={icon} size={16} color={colors.text} />
                <Text style={[styles.aidText, { color: colors.text }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isChoosingImage && (
          <ImageSourceChoice disabled={isLocked} onPick={pickImage} />
        )}

        {isRecording && (
          <VoiceNoteRecorder
            onRecorded={(uri, durationMillis) => {
              setIsRecording(false);
              setMedia((prev) => ({
                ...prev,
                audio: {
                  uri,
                  mimeType: VOICE_NOTE_MIME_TYPE,
                  durationMillis,
                },
              }));
              keepMedia("audio");
            }}
            onError={(message) => {
              setIsRecording(false);
              setMediaError(message);
            }}
            onCancel={() => setIsRecording(false)}
          />
        )}

        {/* A new file is shown instead of the task's saved one */}
        {media.image ? (
          <SwipeToDelete
            label="Ta bort bilden"
            disabled={isLocked}
            onDelete={() => removeMedia("image")}>
            <TaskImageRow source={media.image} />
          </SwipeToDelete>
        ) : (
          existingImage &&
          householdId &&
          authHeaders && (
            <SwipeToDelete
              label="Ta bort bilden"
              disabled={isLocked}
              onDelete={() => removeMedia("image")}>
              <TaskImageRow
                source={{
                  uri: taskMediaUrl(householdId, Number(id), existingImage),
                  headers: authHeaders,
                }}
              />
            </SwipeToDelete>
          )
        )}

        {!isRecording &&
          (media.audio ? (
            <SwipeToDelete
              label="Ta bort röstmemot"
              disabled={isLocked}
              onDelete={() => removeMedia("audio")}>
              <VoiceNoteRow
                source={{ uri: media.audio.uri }}
                durationMillis={media.audio.durationMillis}
              />
            </SwipeToDelete>
          ) : (
            existingAudio &&
            householdId &&
            authHeaders && (
              <SwipeToDelete
                label="Ta bort röstmemot"
                disabled={isLocked}
                onDelete={() => removeMedia("audio")}>
                <VoiceNoteRow
                  source={{
                    uri: taskMediaUrl(householdId, Number(id), existingAudio),
                    headers: authHeaders,
                  }}
                />
              </SwipeToDelete>
            )
          ))}

        {mediaError && (
          <Text accessibilityRole="alert" style={{ color: colors.text }}>
            {mediaError}
          </Text>
        )}
      </View>

      <View style={panelStyle}>
        <View style={styles.panelHeader}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            Återkommer
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.background }]}>
            {task.frequency === 0 ? (
              <Text style={[styles.badgeText, { color: colors.text }]}>
                Endast en gång
              </Text>
            ) : (
              <>
                <Text style={[styles.badgeText, { color: colors.text }]}>
                  var
                </Text>
                <View
                  style={[
                    styles.badgeValue,
                    { backgroundColor: colors.primary },
                  ]}>
                  <Text style={styles.selectedText}>{task.frequency}</Text>
                </View>
                <Text style={[styles.badgeText, { color: colors.text }]}>
                  dag{task.frequency === 1 ? "" : "ar"}
                </Text>
              </>
            )}
          </View>
        </View>
        <FrequencyPicker
          selected={task.frequency}
          disabled={isLocked}
          onSelect={(value) => update("frequency", value)}
        />
      </View>

      <View style={panelStyle}>
        <View style={styles.panelHeader}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            Värde (Energi)
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.background }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {task.difficultyLevel}
            </Text>
          </View>
        </View>
        <DifficultyPicker
          selected={task.difficultyLevel}
          disabled={isLocked}
          onSelect={(value) => update("difficultyLevel", value)}
        />
      </View>

      {!isEditing && isAdmin && household && (
        <View style={panelStyle}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            Vill du tilldela sysslan?
          </Text>
          <TaskMemberPicker
            members={household.members}
            selectedMemberIds={selectedMemberIds}
            isPending={isLocked || saveTaskMutation.isPending}
            onToggle={toggleMember}
          />
        </View>
      )}

      {partialSave && (
        <Text accessibilityRole="alert" style={{ color: colors.text }}>
          {isEditing ? "Sysslan sparades" : "Sysslan skapades"}, men något
          misslyckades: {partialSave.error}. Tryck på Försök igen.
        </Text>
      )}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          onPress={handleSave}
          style={[
            styles.button,
            { backgroundColor: colors.primary, opacity: canSave ? 1 : 0.5 },
          ]}>
          <Text style={styles.buttonText}>
            {isLocked ? "Försök igen" : "Spara syssla"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={close}
          style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: colors.text }]}>
            Avbryt
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function FrequencyPicker({
  selected,
  disabled,
  onSelect,
}: {
  selected: number;
  disabled: boolean;
  onSelect: (value: number) => void;
}) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      contentContainerStyle={styles.frequencyRow}>
      {frequencyOptions.map((value) => {
        const isSelected = value === selected;
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected, disabled }}
            disabled={disabled}
            onPress={() => onSelect(value)}
            style={[
              styles.circle,
              {
                backgroundColor: isSelected
                  ? colors.primary
                  : colors.background,
              },
            ]}>
            <Text
              style={[
                styles.circleText,
                isSelected ? styles.selectedText : { color: colors.text },
              ]}>
              {value}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function DifficultyPicker({
  selected,
  disabled,
  onSelect,
}: {
  selected: number;
  disabled: boolean;
  onSelect: (value: number) => void;
}) {
  const { colors } = useTheme();

  return (
    <View accessibilityRole="radiogroup" style={styles.row}>
      {difficultyOptions.map(({ value, label }) => {
        const isSelected = value === selected;
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityLabel={`${value}, ${label}`}
            accessibilityState={{ checked: isSelected, disabled }}
            disabled={disabled}
            onPress={() => onSelect(value)}
            style={[
              styles.tile,
              {
                backgroundColor: isSelected
                  ? colors.primary
                  : colors.background,
              },
            ]}>
            <Text
              style={[
                styles.tileValue,
                isSelected ? styles.selectedText : { color: colors.text },
              ]}>
              {value}
            </Text>
            <Text
              style={[
                styles.tileLabel,
                isSelected ? styles.selectedText : { color: colors.textMuted },
              ]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heading: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  caps: {
    textTransform: "uppercase",
  },
  input: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  aidButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  aidText: {
    fontSize: 14,
    fontWeight: "500",
  },
  panel: {
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 28,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  badgeValue: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  frequencyRow: {
    gap: 8,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  circleText: {
    fontSize: 15,
    fontWeight: "600",
  },
  selectedText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  tile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 10,
    gap: 2,
  },
  tileValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  tileLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  actions: {
    gap: 4,
  },
  button: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
