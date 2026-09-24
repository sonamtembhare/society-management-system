import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, type ColorValue } from "react-native";
import { useAuth } from "../../components/auth/AuthContext";
import { Colors, BorderRadius } from "../../constants";
import { ResidentHeader } from "../../components/layout/ResidentHeader";
import { ResidentTabBar } from "../../components/layout/ResidentTabBar";
import { SecurityTabBar } from "../../components/layout/SecurityTabBar";

type TabItem = {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  roles?: Array<"ADMIN" | "RESIDENT" | "SECURITY">;
};

const TABS: TabItem[] = [
  { name: "index", title: "Dashboard", icon: "home" },
  { name: "maintenance", title: "Maintenance", icon: "receipt", roles: ["ADMIN", "RESIDENT", "SECURITY"] },
  { name: "payments", title: "Payments", icon: "card", roles: ["ADMIN", "RESIDENT", "SECURITY"] },
  { name: "complaints", title: "Complaints", icon: "alert-circle" },
  { name: "profile", title: "Profile", icon: "person", roles: ["ADMIN", "RESIDENT", "SECURITY"] },
  { name: "settings", title: "Settings", icon: "settings", roles: ["ADMIN", "RESIDENT", "SECURITY"] },
  { name: "notices", title: "Notices", icon: "megaphone", roles: ["ADMIN", "SECURITY"] },
  { name: "visitors", title: "Visitors", icon: "walk", roles: ["ADMIN", "RESIDENT", "SECURITY"] },
  { name: "vehicles", title: "Vehicles", icon: "car", roles: ["ADMIN", "SECURITY"] },
  { name: "residents", title: "Residents", icon: "people", roles: ["ADMIN"] },
  { name: "flats", title: "Flats", icon: "business", roles: ["ADMIN"] },
  { name: "events", title: "Events", icon: "calendar", roles: ["ADMIN", "SECURITY"] },
];

const FOOTER_TABS: Record<"ADMIN" | "RESIDENT" | "SECURITY", string[]> = {
  ADMIN: ["index", "maintenance", "payments", "notices", "complaints", "settings"],
  RESIDENT: ["index", "maintenance", "payments", "complaints", "settings"],
  SECURITY: ["index", "visitors", "vehicles", "events", "settings"],
};

const VISIBLE_TABS = ["index", "maintenance", "payments", "notices", "complaints", "settings"];

export default function TabsLayout() {
  const { user } = useAuth();
  const role = user?.role as "ADMIN" | "RESIDENT" | "SECURITY" | undefined;
  const isResident = role === "RESIDENT";
  const isSecurity = role === "SECURITY";

  const availableTabs = TABS.filter((t) => !t.roles || (role && t.roles.includes(role)));
  const visibleNames = role ? FOOTER_TABS[role] : VISIBLE_TABS;
  const visibleTabs = visibleNames
    .map((name) => availableTabs.find((t) => t.name === name))
    .filter((t): t is TabItem => Boolean(t));
  const hiddenTabs = availableTabs.filter((t) => !visibleNames.includes(t.name));

  const renderTabIcon = (icon: keyof typeof Ionicons.glyphMap) =>
    ({ color, size }: { color: ColorValue; size: number }) => (
      <Ionicons name={icon} size={22} color={color} />
    );

  return (
    <Tabs
      {...(isResident || isSecurity
        ? {
            tabBar: (props) => {
              const name = props.state.routes[props.state.index]?.name ?? "index";
              if (isResident) {
                return <ResidentTabBar active={name} navigation={props.navigation} />;
              }
              return <SecurityTabBar active={name} navigation={props.navigation} />;
            },
          }
        : {})}
      screenOptions={
        isResident
          ? {
              header: () => <ResidentHeader />,
              tabBarHideOnKeyboard: true,
            }
          : {
              tabBarActiveTintColor: Colors.primary,
              tabBarInactiveTintColor: Colors.gray400,
              tabBarHideOnKeyboard: true,
              tabBarStyle: {
                backgroundColor: Colors.white,
                borderTopWidth: 0,
                borderTopLeftRadius: BorderRadius.xl,
                borderTopRightRadius: BorderRadius.xl,
                elevation: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                paddingTop: 6,
                paddingBottom: 8,
              },
              tabBarItemStyle: {
                flex: 1,
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
            }
      }
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
});