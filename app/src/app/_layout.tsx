import { StatusBar } from "expo-status-bar";
import { NativeTabs } from "expo-router/unstable-native-tabs";

import { ThemeProvider } from "@/theme";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Sysslor</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="checklist" md="checklist" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="statistics">
          <NativeTabs.Trigger.Label>Statistik</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="household">
          <NativeTabs.Trigger.Label>Hushåll</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}
