import { StyleSheet, Text, View } from "react-native";

import { avatars } from "@/lib/avatars";

import type { Avatar as AvatarType } from "@shared/schemas/member-schema";

// Shows a member's avatar as an emoji in a circle with the avatar's color
export default function Avatar({
  avatar,
  size = 34,
}: {
  avatar: AvatarType;
  size?: number;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatars[avatar].color,
        },
      ]}>
      <Text style={{ fontSize: size * 0.6 }}>{avatars[avatar].emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
});
