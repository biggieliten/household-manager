import { Text } from "react-native";

import { useTheme } from "@/theme";
import type { JoinRequest } from "@shared/schemas/household-schema";

type Props = {
  request: JoinRequest | null;
};

export default function JoinRequests({ request }: Props) {
  const { colors } = useTheme();

  if (request?.status !== "PENDING") return null;

  return (
    <Text accessibilityLiveRegion="polite" style={{ color: colors.textMuted }}>
      Väntar på godkännande
    </Text>
  );
}

// TODO: Använd samma datamodell som #20 (View join requests) och #21 (Handle join requests).
