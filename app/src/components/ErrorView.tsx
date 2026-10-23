import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

interface Props {
  error: string;
}

// Fills the available space with a centered error message
export default function LoadinErrorView({ error }: Props) {
  const { colors } = useTheme();

  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Laddar"></View>
  );
}

const styles = StyleSheet.create({});
