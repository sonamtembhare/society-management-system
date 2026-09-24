import { useEffect, useRef } from "react";
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
} from "react-native";
import { usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from "../../constants";
import type { MenuItem, ResidentMenuSection } from "../../constants/menu";

const DRAWER_WIDTH = Math.min(Dimensions.get("window").width * 0.8, 320);

type OffcanvasDrawerProps = {
  visible: boolean;
  items?: MenuItem[];
  sections?: ResidentMenuSection[];
  onClose: () => void;
  onSelect: (route: string) => void;
  title?: string;
};

export function OffcanvasDrawer({ visible, items, sections, onClose, onSelect, title = "Menu" }: OffcanvasDrawerProps) {
  const pathname = usePathname();
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      translateX.setValue(DRAWER_WIDTH);
      Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible, translateX]);

  const close = () => {
    Animated.timing(translateX, { toValue: DRAWER_WIDTH, duration: 200, useNativeDriver: true }).start(
      () => onClose()
    );
  };

  const select = (route: string) => {
    close();
    onSelect(route);
  };

  const renderItem = (item: MenuItem) => {
    const active = pathname === item.route;
    return (
      <TouchableOpacity key={item.name} style={styles.drawerItem} onPress={() => select(item.route)}>
        <Ionicons name={item.icon} size={20} color={active ? Colors.primary : Colors.textSecondary} />
        <Text style={[styles.drawerItemText, active && styles.drawerItemTextActive]}>{item.title}</Text>
        {active && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />}
      </TouchableOpacity>
    );
  };

  const renderList = () => {
    if (sections) {
      return (
        <ScrollView contentContainerStyle={styles.drawerList}>
          {sections.map((section) =>
            section.kind === "group" ? (
              <View key={section.title}>
                <View style={styles.sectionHeader}>
                  <Ionicons name={section.icon} size={18} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                {section.items.map((item) => {
                  const active = pathname === item.route;
                  return (
                    <TouchableOpacity key={item.name} style={[styles.drawerItem, styles.sectionItem]} onPress={() => select(item.route)}>
                      <Ionicons name={item.icon} size={20} color={active ? Colors.primary : Colors.textSecondary} />
                      <Text style={[styles.drawerItemText, active && styles.drawerItemTextActive]}>{item.title}</Text>
                      {active && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              renderItem({ name: section.name, title: section.title, icon: section.icon, route: section.route })
            )
          )}
        </ScrollView>
      );
    }
    return (
      <ScrollView contentContainerStyle={styles.drawerList}>
        {(items ?? []).map(renderItem)}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={close} />
        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          <SafeAreaView style={styles.drawerSafe}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{title}</Text>
              <TouchableOpacity onPress={close} hitSlop={Spacing.sm}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {renderList()}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: Colors.primary,
  },
  sectionItem: {
    paddingLeft: Spacing.xxl,
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
});