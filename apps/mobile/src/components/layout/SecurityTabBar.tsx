import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, BorderRadius } from "../../constants";

type TabKey = "index" | "visitors" | "vehicles" | "events" | "settings";

const ITEMS: { name: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: "index", label: "Dashboard", icon: "home" },
  { name: "visitors", label: "Visitors", icon: "walk" },
  { name: "vehicles", label: "Vehicles", icon: "car" },
  { name: "events", label: "Events", icon: "calendar" },
  { name: "settings", label: "Settings", icon: "settings" },
];

type SecurityTabBarProps = {
  active: string;
  navigation: { navigate: (name: string) => void };
};

export function SecurityTabBar({ active, navigation }: SecurityTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {ITEMS.map((item) => {
        const focused = active === item.name;
        return (
          <TouchableOpacity
            key={item.name}
            style={[styles.item, { width: width / ITEMS.length }]}
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: focused }}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={focused ? Colors.primary : Colors.gray400}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { color: focused ? Colors.primary : Colors.gray500 },
                focused && styles.labelFocused,
              ]}
            >
              {item.label}
            </Text>
            {focused && <View style={styles.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    paddingTop: 8,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 3,
    maxWidth: "100%",
  },
  labelFocused: {
    fontWeight: "700",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 3,
  },
});