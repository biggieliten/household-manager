import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import MemberMenu from "@/components/MemberMenu";
import NicknameModal from "@/components/NicknameModal";
import DeleteTaskGroupModal from "@/components/DeleteTaskGroupModal";
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
import TaskGroupCard from "@/components/TaskGroupCard";
import {
  deleteTaskGroupMutationOptions,
  taskGroupsQueryOptions,
} from "@/options/task-groups";

import ConfirmBox from "@/components/ConfirmBox";

type NicknameEdit = {
  householdId: number;
  nickname: string;
};

type GroupDeletion = {
  householdId: number;
  groupId: number;
  groupName: string;
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
  const groupsQuery = useQuery(taskGroupsQueryOptions(householdId));
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [openGroupMenuId, setOpenGroupMenuId] = useState<number | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<GroupDeletion | null>(
    null,
  );
  const [confirmPromoteId, setConfirmPromoteId] = useState<number | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showLastOwnerNotice, setShowLastOwnerNotice] = useState(false);
  const [editingNickname, setEditingNickname] = useState<NicknameEdit | null>(
    null,
  );
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
    onSuccess: async () => {
      // The active household is re-picked from the updated list
      await queryClient.invalidateQueries({ queryKey: ["households"] });
      // TODO: decide with the group where to go after leaving (e.g. "Mina hushåll")
      router.replace("/profile");
    },
  });

  const renameMutation = useMutation(updateMyNicknameMutationOptions);
  const deleteGroupMutation = useMutation(deleteTaskGroupMutationOptions);

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
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
    pauseMutation.error ??
    resumeMutation.error ??
    promoteMutation.error ??
    leaveMutation.error;

  return (
    <ScrollView
      contentContainerStyle={styles.grow}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching || groupsQuery.isRefetching}
          onRefresh={() => {
            void refetch();
            void groupsQuery.refetch();
          }}
        />
      }>
      {/* Tapping anywhere outside an open menu closes it */}
      <Pressable
        accessible={false}
        onPress={() => {
          setOpenMenuId(null);
          setOpenGroupMenuId(null);
        }}
        style={[styles.content, styles.grow]}>
        <View
          style={[
            styles.card,
            styles.row,
            { backgroundColor: colors.surface },
          ]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.border }]}>
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
              <View style={[styles.badge, { backgroundColor: colors.border }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>
                  {accessCode}
                </Text>
              </View>
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
                    style={[styles.badge, { backgroundColor: colors.border }]}>
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
                    onToggle={() => {
                      setOpenGroupMenuId(null);
                      setOpenMenuId(openMenuId === member.id ? null : member.id);
                    }}
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
                            {
                              label: "Lämna hushåll",
                              onPress: () =>
                                isLastOwner
                                  ? setShowLastOwnerNotice(true)
                                  : setConfirmLeave(true),
                            },
                          ]
                        : member.isPaused
                          ? [
                              {
                                label: "Återaktivera medlem",
                                onPress: () => resumeMutation.mutate(member.id),
                              },
                            ]
                          : [
                              {
                                label: "Pausa medlem",
                                onPress: () => pauseMutation.mutate(member.id),
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

              {member.isMe && confirmLeave && (
                <ConfirmBox
                  message="Vill du lämna hushållet?"
                  confirmLabel="Ja, lämna"
                  onCancel={() => setConfirmLeave(false)}
                  onConfirm={() => {
                    setConfirmLeave(false);
                    leaveMutation.mutate();
                  }}
                />
              )}

              {member.isMe && showLastOwnerNotice && isLastOwner && (
                <Text
                  style={{ color: colors.textMuted }}
                  onPress={() => setShowLastOwnerNotice(false)}>
                  Du är den enda ägaren. Gör någon annan till ägare innan du
                  lämnar hushållet.
                </Text>
              )}
            </View>
          ))}
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Växla hushåll
          </Text>

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
                <Text style={{ color: colors.primary }}>Aktivt</Text>
              )}
            </Pressable>
          ))}
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Sysslegrupper
          </Text>
          {groupsQuery.isPending && <ActivityIndicator color={colors.textMuted} />}
          {groupsQuery.error && (
            <View style={{ gap: 8 }}>
              <Text accessibilityRole="alert" style={{ color: colors.text }}>
                {groupsQuery.error.message}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => groupsQuery.refetch()}>
                <Text style={{ color: colors.primary }}>Försök igen</Text>
              </Pressable>
            </View>
          )}
          {groupsQuery.data?.length === 0 && (
            <Text style={{ color: colors.textMuted }}>Inga sysslegrupper ännu.</Text>
          )}
          {groupsQuery.data?.map((group) => (
            <View
              key={group.id}
              style={[
                styles.memberItem,
                openGroupMenuId === group.id && styles.rowOnTop,
              ]}>
              <TaskGroupCard
                group={group}
                members={members}
                isOwner={isAdmin}
                menuOpen={openGroupMenuId === group.id}
                onToggleMenu={() => {
                  setOpenMenuId(null);
                  setOpenGroupMenuId(
                    openGroupMenuId === group.id ? null : group.id,
                  );
                }}
                onEdit={() => router.push({
                  pathname: "/create-task-group",
                  params: { id: String(group.id) },
                })}
                onDelete={() => {
                  if (deleteGroupMutation.isPending) return;
                  deleteGroupMutation.reset();
                  setDeletingGroup({
                    householdId: requireHouseholdId(),
                    groupId: group.id,
                    groupName: group.name,
                  });
                }}
              />
            </View>
          ))}
          {isAdmin && (
            <Pressable
              accessibilityRole="button"
              style={{ paddingVertical: 12 }}
              onPress={() => router.push("/create-task-group")}>
              <Text style={{ color: colors.primary }}>Skapa sysslegrupp</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
      {isAdmin && deletingGroup && deletingGroup.householdId === householdId && (
        <DeleteTaskGroupModal
          groupName={deletingGroup.groupName}
          isPending={deleteGroupMutation.isPending}
          error={deleteGroupMutation.error?.message}
          onConfirm={() => {
            if (!deleteGroupMutation.isPending) {
              deleteGroupMutation.mutate(
                {
                  householdId: deletingGroup.householdId,
                  groupId: deletingGroup.groupId,
                },
                { onSuccess: () => setDeletingGroup(null) },
              );
            }
          }}
          onCancel={() => setDeletingGroup(null)}
        />
      )}
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
});
