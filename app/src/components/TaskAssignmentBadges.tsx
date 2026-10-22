import Feather from "@expo/vector-icons/Feather";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

type Props = {
  isManual: boolean;
  hasGroups: boolean;
};

export default function TaskAssignmentBadges({ isManual, hasGroups }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.badges, { backgroundColor: colors.surface }]}>
      {isManual && <Feather name="user" size={12} color={colors.text} />}
      {hasGroups && <Feather name="repeat" size={12} color={colors.text} />}
    </View>
  );
}

const styles = StyleSheet.create({
  badges: {
    position: "absolute",
    bottom: 0,
    right: 0,
    flexDirection: "row",
    gap: 2,
    borderRadius: 8,
    padding: 2,
  },
});
