import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../components/auth/AuthContext";
import { useFocusEffect, router } from "expo-router";
import { residentService } from "../../services";
import type { ResidentDetail } from "../../types";
import { Colors, Spacing, FontSize } from "../../constants";
import { OffcanvasDrawer } from "./OffcanvasDrawer";
import { RESIDENT_MENU_SECTIONS } from "../../constants/menu";

export function ResidentHeader() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = React.useState<ResidentDetail | null>(null);
  const [menuVisible, setMenuVisible] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      residentService
        .getOwnProfile()
        .then((res) => {
          if (active && res.success && res.data) setProfile(res.data as ResidentDetail);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [])
  );

  const initials = (user?.name || "?")
    .split(" ")
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const name = user?.name || "Resident";
  const phone = profile?.phone || user?.phone || "Not available";

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <View style={styles.phoneRow}>
            <Ionicons name="call" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.phone} numberOfLines={1}>{phone}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          hitSlop={Spacing.sm}
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="Menu"
        >
          <Ionicons name="menu" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <OffcanvasDrawer
        visible={menuVisible}
        sections={RESIDENT_MENU_SECTIONS}
        onClose={() => setMenuVisible(false)}
        onSelect={(route) => router.navigate(route)}
        title="Menu"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: "bold",
  },
  info: {
    flex: 1,
  },
  name: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: "bold",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 2,
  },
  phone: {
    color: "rgba(255,255,255,0.85)",
    fontSize: FontSize.sm,
  },
  menuButton: {
    padding: Spacing.sm,
    marginRight: -Spacing.sm,
  },
});