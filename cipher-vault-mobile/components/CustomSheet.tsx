import React, { useEffect } from "react";
import { View, Text, Pressable, Modal, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

interface SheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface CustomSheetProps {
  visible: boolean;
  title?: string;
  options: SheetOption[];
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function CustomSheet({
  visible,
  title,
  options,
  onClose,
}: CustomSheetProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(0.5, { duration: 250 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 150 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
    }
  }, [visible]);

  const handleDismiss = () => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(onClose)();
    });
  };

  const animatedBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  const animatedSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <Pressable
            onPress={handleDismiss}
            className="flex-1 bg-black"
            style={animatedBackdropStyle}
          />
        </Animated.View>

        {/* Sheet Content */}
        <Animated.View
          style={animatedSheetStyle}
          className="bg-[#0f0f15] border-t border-[#1e1e2d] rounded-t-3xl pb-8"
        >
          {/* Drag Handle */}
          <View className="items-center py-3">
            <View className="w-12 h-1 rounded-full bg-slate-800" />
          </View>

          {/* Optional Title */}
          {title && (
            <Text className="text-slate-400 text-center text-xs font-semibold uppercase tracking-wider mb-4 px-6">
              {title}
            </Text>
          )}

          {/* Options List */}
          <View className="px-4 gap-2">
            {options.map((option, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  handleDismiss();
                  // Delay execution slightly to let the sheet start closing
                  setTimeout(option.onPress, 150);
                }}
                className={`w-full py-4 items-center justify-center rounded-xl border ${
                  option.destructive
                    ? "border-red-500/20 bg-red-500/5 active:bg-red-500/10"
                    : "border-[#1e1e2d] bg-[#151520]/60 active:bg-[#1a1a27]"
                }`}
              >
                <Text
                  className={`font-semibold text-sm ${
                    option.destructive ? "text-red-500" : "text-white"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}

            {/* Cancel Button */}
            <Pressable
              onPress={handleDismiss}
              className="w-full py-4 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 active:bg-slate-800 mt-2"
            >
              <Text className="text-slate-400 font-semibold text-sm">Cancel</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
