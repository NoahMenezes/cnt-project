import React, { useEffect } from "react";
import { Pressable, GestureResponderEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  onPress?: (event: GestureResponderEvent) => void;
}

export default function AnimatedCard({
  children,
  delay = 0,
  className = "",
  onPress,
}: AnimatedCardProps) {
  const scale = useSharedValue(0.96);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(delay, withSpring(1, { damping: 15 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 15 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 15 }));
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.97, { damping: 10, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={!onPress}
        className={`border border-[#1e1e2d] bg-[#111118]/80 rounded-2xl overflow-hidden ${className}`}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
