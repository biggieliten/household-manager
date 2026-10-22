import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SymbolView } from "expo-symbols";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import LoadingView from "@/components/LoadingView";
import MemberMenu from "@/components/MemberMenu";
import NicknameModal from "@/components/NicknameModal";
import {
  pauseMember,
  resumeMember,
  promoteMember,
  leaveHousehold,
} from "@/lib/api/households";
import ScreenHeader from "@/components/ScreenHeader";
import useActiveHouseholdId from "@/hooks/use-active-household-id";
import {
  householdQueryOptions,
  householdsQueryOptions,
  updateMyNicknameMutationOptions,
  switchHouseholdMutationOptions,
} from "@/options/households";
import { useTheme } from "@/theme";
import Avatar from "@/components/Avatar";
import Toast from "@/components/Toast";
import ConfirmBox from "@/components/ConfirmBox";
import * as Clipboard from "expo-clipboard";

type NicknameEdit = {
  householdId: number;
  nickname: string;
};

export default function Household() {
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader />
      <HouseholdContent />
    </View>
  );
}

function HouseholdContent() {
  const { colors } = useTheme();

  const householdId = useActiveHouseholdId();
  const { data, error, isPending, refetch, isRefetching } = useQuery(
    householdQueryOptions(householdId),
  );
  const queryClient = useQueryClient();
  const households = useQuery(householdsQueryOptions);
  const switchMutation = useMutation(switchHouseholdMutationOptions);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [confirmPromoteId, setConfirmPromoteId] = useState<number | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showLastOwnerNotice, setShowLastOwnerNotice] = useState(false);
  const [editingNickname, setEditingNickname] = useState<NicknameEdit | null>(
    null,
  );
  const [hasLeft, setHasLeft] = useState(false);
  const [copied, setCopied] = useState(false);

  const router = useRouter();

  const requireHouseholdId = () => {
    if (!householdId) throw new Error("Inget aktivt hushåll");
    return householdId;
  };

  const invalidateHousehold = () =>
    queryClient.invalidateQueries({
      queryKey: householdQueryOptions(householdId).queryKey,
    });

  const pauseMutation = useMutation({
    mutationFn: (memberId: number) =>
      pauseMember(requireHouseholdId(), memberId),
    onSuccess: invalidateHousehold,
  });

  const resumeMutation = useMutation({
    mutationFn: (memberId: number) =>
      resumeMember(requireHouseholdId(), memberId),
    onSuccess: invalidateHousehold,
  });

  const promoteMutation = useMutation({
    mutationFn: (memberId: number) =>
      promoteMember(requireHouseholdId(), memberId),
    onSuccess: invalidateHousehold,
  });
  const leaveMutation = useMutation({
    mutationFn: () => leaveHousehold(requireHouseholdId()),
    // The list is refetched when the toast is closed, so the toast stays visible
    onSuccess: () => setHasLeft(true),
  });

  // The active household falls back to the next one in the list. With none
  // left, the guard in _layout opens create-household
  const handleCloseToast = async () => {
    await queryClient.invalidateQueries({ queryKey: ["households"] });
    setHasLeft(false);
  };
  // The icon turns into a checkmark for a moment as feedback
  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renameMutation = useMutation(updateMyNicknameMutationOptions);

  if (isPending) {
    return <LoadingView />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.text }}>{error.message}</Text>
      </View>
    );
  }

  const { name, accessCode, members } = data;
  const isAdmin = members.some((member) => member.isMe && member.isAdmin);
  const others = members.filter((member) => !member.isMe);
  const isLastOwner =
    isAdmin && others.length > 0 && !others.some((member) => member.isAdmin);
  const mutationError =
    pauseMutation.error ?? resumeMutation.error ?? promoteMutation.error;

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.grow}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }>
        {/* Tapping anywhere outside an open menu closes it */}
        <Pressable
          accessible={false}
          onPress={() => setOpenMenuId(null)}
          style={[styles.content, styles.grow]}>
          <View
            style={[
              styles.card,
              styles.row,
              { backgroundColor: colors.surface },
            ]}>
            <View
              style={[styles.iconCircle, { backgroundColor: colors.border }]}>
              <SymbolView
                name={{ ios: "house.fill", android: "home", web: "home" }}
                size={22}
                tintColor={colors.primary}
                fallback={<Text>🏠</Text>}
              />
            </View>
            <View style={styles.flex}>
              <View style={styles.nameRow}>
                <Text style={[styles.householdName, { color: colors.text }]}>
                  {name}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copied ? "Kopierad" : "Kopiera kod"}
                  onPress={() => handleCopyCode(accessCode)}
                  hitSlop={8}
                  style={[
                    styles.badge,
                    styles.codeBadge,
                    { backgroundColor: colors.border },
                  ]}>
                  <Text style={[styles.badgeText, { color: colors.text }]}>
                    {accessCode}
                  </Text>
                  <SymbolView
                    name={
                      copied
                        ? { ios: "checkmark", android: "check", web: "check" }
                        : {
                            ios: "doc.on.doc",
                            android: "content_copy",
                            web: "content_copy",
                          }
                    }
                    size={12}
                    tintColor={colors.text}
                    fallback={
                      <Text style={{ color: colors.text }}>
                        {copied ? "✓" : "⧉"}
                      </Text>
                    }
                  />
                </Pressable>
              </View>
              <Text style={{ color: colors.primary }}>
                {members.length} medlemmar
              </Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.row}>
              <Text
                style={[
                  styles.sectionTitle,
                  styles.flex,
                  { color: colors.text },
                ]}>
                Medlemmar i hushållet
              </Text>
              <View style={[styles.badge, { backgroundColor: colors.border }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>
                  {members.length} personer
                </Text>
              </View>
            </View>

            {mutationError && (
              <Text style={{ color: colors.textMuted }}>
                {mutationError.message}
              </Text>
            )}

            {members.map((member) => (
              <View
                key={member.id}
                style={[
                  styles.memberItem,
                  openMenuId === member.id && styles.rowOnTop,
                ]}>
                <View
                  style={[
                    styles.row,
                    styles.memberRow,
                    { backgroundColor: colors.background },
                  ]}>
                  <View
                    style={[
                      styles.row,
                      styles.flex,
                      member.isPaused && styles.paused,
                    ]}>
                    <Avatar avatar={member.avatar} size={36} />
                    <Text style={[styles.memberName, { color: colors.text }]}>
                      {member.nickname}
                      {member.isMe && (
                        <Text style={{ color: colors.textMuted }}> (Du)</Text>
                      )}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: colors.border },
                      ]}>
                      <Text
                        style={[styles.badgeText, { color: colors.textMuted }]}>
                        {member.isPaused
                          ? "Pausad"
                          : member.isAdmin
                            ? "Ägare"
                            : "Medlem"}
                      </Text>
                    </View>
                  </View>

                  {(member.isMe || (isAdmin && !member.isAdmin)) && (
                    <MemberMenu
                      open={openMenuId === member.id}
                      onToggle={() =>
                        setOpenMenuId(
                          openMenuId === member.id ? null : member.id,
                        )
                      }
                      items={
                        member.isMe
                          ? [
                              {
                                label: "Ändra visningsnamn",
                                onPress: () => {
                                  renameMutation.reset();
                                  setEditingNickname({
                                    householdId: requireHouseholdId(),
                                    nickname: member.nickname,
                                  });
                                },
                              },
                            ]
                          : member.isPaused
                            ? [
                                {
                                  label: "Återaktivera medlem",
                                  onPress: () =>
                                    resumeMutation.mutate(member.id),
                                },
                              ]
                            : [
                                {
                                  label: "Pausa medlem",
                                  onPress: () =>
                                    pauseMutation.mutate(member.id),
                                },
                                {
                                  label: "Gör till ägare",
                                  onPress: () => setConfirmPromoteId(member.id),
                                },
                              ]
                      }
                    />
                  )}
                </View>

                {confirmPromoteId === member.id && (
                  <ConfirmBox
                    message={`Göra ${member.nickname} till ägare?`}
                    confirmLabel="Ja, gör till ägare"
                    onCancel={() => setConfirmPromoteId(null)}
                    onConfirm={() => {
                      setConfirmPromoteId(null);
                      promoteMutation.mutate(member.id);
                    }}
                  />
                )}
              </View>
            ))}
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.row}>
              <SymbolView
                name={{
                  ios: "arrow.left.arrow.right",
                  android: "swap_horiz",
                  web: "swap_horiz",
                }}
                size={18}
                tintColor={colors.text}
                fallback={<Text style={{ color: colors.text }}>⇄</Text>}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  styles.flex,
                  { color: colors.text },
                ]}>
                Växla hushåll
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/create-household")}
                hitSlop={8}
                style={styles.addButton}>
                <SymbolView
                  name={{ ios: "plus", android: "add", web: "add" }}
                  size={14}
                  tintColor={colors.primary}
                  fallback={<Text style={{ color: colors.primary }}>+</Text>}
                />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>
                  Nytt hushåll
                </Text>
              </Pressable>
            </View>

            {households.data?.map((household) => (
              <Pressable
                key={household.id}
                onPress={() => switchMutation.mutate(household.id)}
                disabled={household.id === householdId}
                style={[
                  styles.row,
                  styles.memberRow,
                  { backgroundColor: colors.background },
                ]}>
                <Avatar avatar={household.member.avatar} size={36} />
                <Text
                  style={[
                    styles.memberName,
                    styles.flex,
                    { color: colors.text },
                  ]}>
                  {household.name}
                </Text>
                {household.id === householdId && (
                  <SymbolView
                    name={{
                      ios: "checkmark.circle",
                      android: "check_circle",
                      web: "check_circle",
                    }}
                    size={20}
                    tintColor={colors.primary}
                    accessibilityLabel="Aktivt"
                    fallback={<Text style={{ color: colors.primary }}>✓</Text>}
                  />
                )}
              </Pressable>
            ))}
          </View>
          <View style={styles.leaveSection}>
            {confirmLeave ? (
              <ConfirmBox
                message="Vill du lämna hushållet?"
                confirmLabel="Ja, lämna"
                onCancel={() => setConfirmLeave(false)}
                onConfirm={() => {
                  setConfirmLeave(false);
                  leaveMutation.mutate();
                }}
              />
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  isLastOwner
                    ? setShowLastOwnerNotice(true)
                    : setConfirmLeave(true)
                }
                hitSlop={8}
                style={styles.leaveButton}>
                <SymbolView
                  name={{
                    ios: "rectangle.portrait.and.arrow.right",
                    android: "logout",
                    web: "logout",
                  }}
                  size={16}
                  tintColor={colors.primary}
                  fallback={<Text style={{ color: colors.primary }}>⇥</Text>}
                />
                <Text style={[styles.leaveText, { color: colors.primary }]}>
                  Lämna hushållet
                </Text>
              </Pressable>
            )}

            {showLastOwnerNotice && isLastOwner && (
              <Text
                style={[styles.notice, { color: colors.textMuted }]}
                onPress={() => setShowLastOwnerNotice(false)}>
                Du är den enda ägaren. Gör någon annan till ägare innan du
                lämnar hushållet.
              </Text>
            )}
            {leaveMutation.error && (
              <Text style={[styles.notice, { color: colors.textMuted }]}>
                {leaveMutation.error.message}
              </Text>
            )}
          </View>
        </Pressable>
        {editingNickname && editingNickname.householdId === householdId && (
          <NicknameModal
            key={editingNickname.householdId}
            nickname={editingNickname.nickname}
            isPending={renameMutation.isPending}
            error={renameMutation.error?.message}
            onSave={(nickname) =>
              renameMutation.mutate(
                { householdId: editingNickname.householdId, nickname },
                { onSuccess: () => setEditingNickname(null) },
              )
            }
            onCancel={() => setEditingNickname(null)}
          />
        )}
      </ScrollView>
      {hasLeft && (
        <Toast message="Du har lämnat hushållet" onClose={handleCloseToast} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  grow: {
    flexGrow: 1,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  householdName: {
    fontSize: 20,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  memberRow: {
    borderRadius: 12,
    padding: 12,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "500",
  },
  rowOnTop: {
    zIndex: 1,
    elevation: 6,
  },
  paused: {
    opacity: 0.4,
  },
  memberItem: {
    gap: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  leaveSection: {
    gap: 8,
  },
  leaveButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 12,
  },
  leaveText: {
    fontSize: 15,
    fontWeight: "600",
  },
  notice: {
    textAlign: "center",
  },
  codeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
