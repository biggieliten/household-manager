import { Image } from "expo-image";
import { StyleSheet } from "react-native";

const logo = require("@/assets/images/husallet_logo.webp");

// App logo shown in every header: ScreenHeader on the tabs and the Stack headers
export default function HeaderLogo(): React.JSX.Element {
  return (
    <Image
      source={logo}
      contentFit="contain"
      accessibilityLabel="Husallet"
      style={styles.logo}
    />
  );
}

const styles = StyleSheet.create({
  // Matches the logo's 1212x918 aspect ratio
  logo: { width: 37, height: 28 },
});
