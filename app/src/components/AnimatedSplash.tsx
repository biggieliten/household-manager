import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Path } from "react-native-svg";

import { useTheme } from "@/theme";

// The Husallet logo redrawn as vectors on a 1212x918 canvas
// so the two orange dots can travel along the infinity loop.

export const LOOP_DURATION_MS = 2400;

const CENTER_X = 605;
const CENTER_Y = 608;
const HALF_WIDTH = 535;
const HEIGHT_SCALE = 650;
const STROKE_WIDTH = 110;
// The ring stroke is centred on the circle edge, so half of it covers the orange:
// orange radius 52, white ring out to 80, as in husallet_logo.png
const DOT_RADIUS = 66;
const DOT_RING = 28;

// How far (in curve parameter) the red lobe continues past the crossing,
// so the crossing is drawn in one colour instead of two half-strokes
const RED_OVERLAP = 0.3;

// Where the dots sit in the static logo: one in the crossing, one on the right lobe
const DOT_START = [Math.PI / 2, -0.28];

const colors = {
  red: "#9E3A2F",
  teal: "#96C1B9",
  orange: "#F49A3A",
  // The ring stays white in dark mode too, like in the logo
  ring: "#FFFFFF",
};

// Lemniscate of Bernoulli, stretched to the logo's proportions
function loopPoint(t: number): { x: number; y: number } {
  "worklet";
  const sin = Math.sin(t);
  const cos = Math.cos(t);
  const denominator = 1 + sin * sin;
  return {
    x: CENTER_X + (HALF_WIDTH * cos) / denominator,
    y: CENTER_Y + (HEIGHT_SCALE * sin * cos) / denominator,
  };
}

function loopPath(from: number, to: number, steps = 120): string {
  const commands: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const { x, y } = loopPoint(from + ((to - from) * i) / steps);
    commands.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return commands.join(" ");
}

const redLobe = loopPath(
  Math.PI / 2 - RED_OVERLAP,
  (3 * Math.PI) / 2 + RED_OVERLAP,
);
const tealLobe = loopPath(-Math.PI / 2, Math.PI / 2);
const tealRoof = "M275 720 L275 450 Q275 380 325 328 L572 80";
const redRoof = "M605 62 L885 345 Q935 398 935 470 L935 720";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function OrbitingDot({
  progress,
  start,
}: {
  progress: SharedValue<number>;
  start: number;
}): React.JSX.Element {
  const animatedProps = useAnimatedProps(() => {
    const { x, y } = loopPoint(start + progress.get() * 2 * Math.PI);
    return { cx: x, cy: y };
  });

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      r={DOT_RADIUS}
      fill={colors.orange}
      stroke={colors.ring}
      strokeWidth={DOT_RING}
    />
  );
}

interface Props {
  onLayout?: () => void;
}

export default function AnimatedSplash({ onLayout }: Props): React.JSX.Element {
  const { colors: theme } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    // set()/get() instead of .value: the React Compiler is enabled in app.json
    progress.set(
      withRepeat(
        withTiming(1, { duration: LOOP_DURATION_MS, easing: Easing.linear }),
        -1,
      ),
    );
  }, [progress]);

  return (
    <View
      onLayout={onLayout}
      accessibilityRole="progressbar"
      accessibilityLabel="Laddar"
      style={[styles.container, { backgroundColor: theme.background }]}>
      <Svg viewBox="0 0 1212 918" style={styles.logo}>
        <G fill="none" strokeWidth={STROKE_WIDTH} strokeLinejoin="round">
          <Path d={tealLobe} stroke={colors.teal} />
          <Path d={redLobe} stroke={colors.red} />
          <Path d={tealRoof} stroke={colors.teal} strokeLinecap="round" />
          <Path d={redRoof} stroke={colors.red} strokeLinecap="round" />
        </G>
        {DOT_START.map((start) => (
          <OrbitingDot
            key={start}
            progress={progress}
            start={start}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  // Matches the logo's 1212x918 aspect ratio
  logo: { width: 200, height: 152 },
});
