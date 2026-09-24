import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { router, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../components/auth/AuthContext";
import { OffcanvasDrawer } from "../../components/layout/OffcanvasDrawer";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants";
import { RESIDENT_MENU, RESIDENT_MENU_SECTIONS, SECURITY_MENU } from "../../constants/menu";

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const isResident = user?.role === "RESIDENT";
  const isSecurity = user?.role === "SECURITY";

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const openMenu = () => setMenuVisible(true);

  const gotoRoute = (route: string) => {
    router.navigate(route);
  };

  return (
    <>
      <Tabs.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={openMenu} hitSlop={Spacing.sm} style={styles.headerButton} accessibilityRole="button">
              <Ionicons name="menu" size={26} color={Colors.white} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Text style={styles.label}>Name: {user?.name}</Text>
          <Text style={styles.label}>Email: {user?.email}</Text>
          <Text style={styles.label}>Role: {user?.role}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Change Password</Text>
          </TouchableOpacity>
          {user?.role === "ADMIN" && (
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/society/1")}>
              <Text style={styles.menuText}>Society Settings</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <OffcanvasDrawer
        visible={menuVisible}
        sections={isResident ? RESIDENT_MENU_SECTIONS : undefined}
        items={isResident ? undefined : isSecurity ? SECURITY_MENU : RESIDENT_MENU}
        onClose={() => setMenuVisible(false)}
        onSelect={gotoRoute}
        title="Menu"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  headerButton: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  card: { backgroundColor: Colors.white, padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.md },
  label: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.sm },
  menuItem: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuText: { fontSize: FontSize.md, color: Colors.primary },
  logoutButton: { backgroundColor: Colors.danger, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: "center", marginTop: Spacing.md },
  logoutText: { color: Colors.white, fontSize: FontSize.md, fontWeight: "600" },
});