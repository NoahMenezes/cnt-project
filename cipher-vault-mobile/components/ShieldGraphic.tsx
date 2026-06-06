import React, { useEffect } from "react";
import { View } from "react-native";
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ShieldGraphic() {
  const pulse = useSharedValue(0.6);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.6, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      r: 12 * pulse.value,
      opacity: 1.6 - pulse.value,
    };
  });

  return (
    <View className="items-center justify-center py-6">
      <Svg width={120} height={120} viewBox="0 0 100 100" fill="none">
        <Defs>
          <LinearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#818cf8" />
            <Stop offset="100%" stopColor="#4f46e5" />
          </LinearGradient>
          <LinearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#312e81" stopOpacity={0.6} />
            <Stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Glow Ring */}
        <Circle cx="50" cy="50" r="45" fill="url(#glowGrad)" />

        {/* Outer Shield Outline */}
        <Path
          d="M50 15 L80 25 V50 C80 68 67 81 50 87 C33 81 20 68 20 50 V25 L50 15 Z"
          stroke="url(#shieldGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner Shield */}
        <Path
          d="M50 22 L72 30 V50 C72 64 62 74 50 79 C38 74 28 64 28 50 V30 L50 22 Z"
          fill="#4f46e5"
          opacity="0.15"
        />

        {/* Lock Shackle */}
        <Path
          d="M40 50 V43 C40 37 44.5 33 50 33 C55.5 33 60 37 60 43 V50"
          stroke="url(#shieldGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Lock Body */}
        <Rect
          x="34"
          y="50"
          width="32"
          height="16"
          rx="4"
          fill="url(#shieldGrad)"
        />

        {/* Pulsing Lock Cylinder / Core */}
        <AnimatedCircle
          cx="50"
          cy="58"
          fill="#a5b4fc"
          animatedProps={animatedCircleProps}
        />
      </Svg>
    </View>
  );
}
