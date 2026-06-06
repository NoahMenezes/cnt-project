import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";

export default function AnimatedBackground() {
  const { width, height } = Dimensions.get("window");
  
  // Animation values for bubble 1
  const bubble1X = useRef(new Animated.Value(0)).current;
  const bubble1Y = useRef(new Animated.Value(0)).current;

  // Animation values for bubble 2
  const bubble2X = useRef(new Animated.Value(0)).current;
  const bubble2Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bubble1X, { toValue: width - 180, duration: 12000, useNativeDriver: true }),
          Animated.timing(bubble1Y, { toValue: height - 250, duration: 15000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(bubble1X, { toValue: 10, duration: 14000, useNativeDriver: true }),
          Animated.timing(bubble1Y, { toValue: 10, duration: 11000, useNativeDriver: true }),
        ]),
      ])
    );

    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bubble2X, { toValue: -width + 200, duration: 16000, useNativeDriver: true }),
          Animated.timing(bubble2Y, { toValue: height / 2 - 100, duration: 13000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(bubble2X, { toValue: 10, duration: 12000, useNativeDriver: true }),
          Animated.timing(bubble2Y, { toValue: height - 300, duration: 18000, useNativeDriver: true }),
        ]),
      ])
    );

    anim1.start();
    anim2.start();

    return () => {
      anim1.stop();
      anim2.stop();
    };
  }, [width, height]);

  return (
    <View style={StyleSheet.absoluteFillObject} className="bg-[#050814]">
      {/* Soft Blue Glow Patch */}
      <View
        className="absolute w-80 h-80 rounded-full opacity-20"
        style={{
          top: height / 4,
          left: width / 6,
          backgroundColor: "#3b82f6",
          shadowColor: "#3b82f6",
          shadowRadius: 100,
          shadowOpacity: 1,
          elevation: 20,
        }}
      />

      {/* Floating Bubble 1 */}
      <Animated.View
        className="absolute w-44 h-44 rounded-full bg-blue-500/5 border border-blue-500/10"
        style={{
          top: 100,
          left: 20,
          transform: [{ translateX: bubble1X }, { translateY: bubble1Y }],
        }}
      />

      {/* Floating Bubble 2 */}
      <Animated.View
        className="absolute w-52 h-52 rounded-full bg-indigo-500/5 border border-indigo-500/10"
        style={{
          bottom: 120,
          right: 20,
          transform: [{ translateX: bubble2X }, { translateY: bubble2Y }],
        }}
      />
    </View>
  );
}
