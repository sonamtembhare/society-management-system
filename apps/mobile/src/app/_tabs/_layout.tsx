import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ColorValue,
} from "react-native";
import { Tabs, router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../components/auth/AuthContext";
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from "../../constants";
import { RESIDENT_MENU } from "../../constants/menu";

type TabItem = {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  roles?: Array<"ADMIN" | "RESIDENT" | "SECURITY">;
};

type DrawerItem = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const TABS: TabItem[] = [
  { name: "index", title: "Dashboard", icon: "home" },
  { name: "maintenance", title: "Maintenance", icon: "receipt", roles: ["ADMIN", "RESIDENT", "SECURITY"] },
  { name: "payments", title: "Payments", icon: "card", roles: ["ADMIN", "RESIDENT", "SECURITY"] },
  { name: "complaints", title: "Complaints", icon: "alert-circle" },
  { name: "profile", title: "Profile", icon: "person", roles: ["ADMIN", "RESIDENT"] },
  { name: "notices", title: "Notices", icon: "megaphone", roles: ["ADMIN", "SECURITY"] },
  { name: "vehicles", title: "Vehicles", icon: "car", roles: ["ADMIN"] },
  { name: "residents", title: "Residents", icon: "people", roles: ["ADMIN"] },
  { name: "flats", title: "Flats", icon: "business", roles: ["ADMIN"] },
  { name: "visitors", title: "Visitors", icon: "walk", roles: ["ADMIN"] },
  { name: "events", title: "Events", icon: "calendar", roles: ["ADMIN"] },
];

const FOOTER_TABS: Record<"ADMIN" | "RESIDENT" | "SECURITY", string[]> = {
  ADMIN: ["index", "maintenance", "payments", "notices", "complaints"],
  RESIDENT: ["index", "maintenance", "payments", "complaints", "profile"],
  SECURITY: ["index", "maintenance", "payments", "notices", "complaints"],
};

const VISIBLE_TABS = ["index", "maintenance", "payments", "notices", "complaints"];

const DRAWER_WIDTH = Math.min(Dimensions.get("window").width * 0.8, 320);

export default function TabsLayout() {
  const { user, logout } = useAuth();
  const role = user?.role as "ADMIN" | "RESIDENT" | "SECURITY" | undefined;
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  const availableTabs = TABS.filter((t) => !t.roles || (role && t.roles.includes(role)));
  const visibleNames = role ? FOOTER_TABS[role] : VISIBLE_TABS;
  const visibleTabs = visibleNames.map(
    (name) => availableTabs.find((t) => t.name === name)
  ).filter((t): t is TabItem => Boolean(t));
  const hiddenTabs = availableTabs.filter((t) => !visibleNames.includes(t.name));

  const drawerItems: DrawerItem[] =
    role === "RESIDENT"
      ? RESIDENT_MENU.map((item) => ({ key: item.name, title: item.title, icon: item.icon, route: item.route }))
      : availableTabs.map((t) => ({
          key: t.name,
          title: t.title,
          icon: t.icon,
          route: t.name === "index" ? "/_tabs" : `/_tabs/${t.name}`,
        }));

  const openDrawer = () => {
    setVisible(true);
    translateX.setValue(DRAWER_WIDTH);
    Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };

  const closeDrawer = () => {
    Animated.timing(translateX, { toValue: DRAWER_WIDTH, duration: 200, useNativeDriver: true }).start(
      () => setVisible(false)
    );
  };

  const goTo = (route: string) => {
    closeDrawer();
    router.navigate(route);
  };

  const isActive = (route: string) => pathname === route;

  const handleLogout = async () => {
    setVisible(false);
    await logout();
    router.replace("/login");
  };

  const renderTabIcon = (icon: keyof typeof Ionicons.glyphMap) =>
    ({ color, size }: { color: ColorValue; size: number }) => (
      <Ionicons name={icon} size={size} color={color} />
    );

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.gray400,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: Colors.white,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            borderTopLeftRadius: BorderRadius.xl,
            borderTopRightRadius: BorderRadius.xl,
            elevation: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            paddingBottom: 6,
          },
          tabBarItemStyle: {
            flex: 1,
            paddingVertical: 6,
            paddingHorizontal: 2,
            alignItems: "center",
            justifyContent: "center",
          },
          tabBarLabel: ({ focused, color, children }) => (
            <Text
              numberOfLines={1}
              style={[
                styles.tabBarLabelText,
                { color },
                focused && styles.tabBarLabelTextFocused,
              ]}
            >
              {children}
            </Text>
          ),
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        {visibleTabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              ...(tab.name === "index" ? { headerTitle: "Dashboard" } : {}),
              tabBarIcon: renderTabIcon(tab.icon),
            }}
          />
        ))}
        {hiddenTabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarButton: () => null,
              tabBarItemStyle: { flex: 0 },
            }}
          />
        ))}
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
            tabBarButton: () => (
              <TouchableOpacity
                style={styles.tabButton}
                onPress={openDrawer}
                accessibilityRole="button"
                accessibilityLabel="Show all links"
              >
                <Ionicons name="settings" size={22} color={visible ? Colors.primary : Colors.gray400} />
                <Text
                  style={[
                    styles.tabBarLabelText,
                    { color: visible ? Colors.primary : Colors.gray400 },
                    visible && styles.tabBarLabelTextFocused,
                  ]}
                >
                  Settings
                </Text>
              </TouchableOpacity>
            ),
          }}
        />
      </Tabs>
      <Modal visible={visible} transparent animationType="none" onRequestClose={closeDrawer}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={closeDrawer} />
          <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
            <SafeAreaView style={styles.drawerSafe}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>All Links</Text>
                <TouchableOpacity onPress={closeDrawer} hitSlop={Spacing.sm}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.drawerList}>
                {drawerItems.map((item) => {
                  const active = isActive(item.route);
                  return (
                    <TouchableOpacity key={item.key} style={styles.drawerItem} onPress={() => goTo(item.route)}>
                      <Ionicons name={item.icon} size={20} color={active ? Colors.primary : Colors.textSecondary} />
                      <Text style={[styles.drawerItemText, active && styles.drawerItemTextActive]}>{item.title}</Text>
                      {active && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out" size={20} color={Colors.white} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabBarLabelText: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2,
    maxWidth: "100%",
  },
  tabBarLabelTextFocused: {
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(17, 24, 39, 0.5)",
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    ...Shadow.lg,
  },
  drawerSafe: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.text,
  },
  drawerList: {
    paddingVertical: Spacing.sm,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  drawerItemText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  drawerItemTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.md,
    margin: Spacing.lg,
    padding: Spacing.md,
  },
  logoutText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: "600",
  },
});