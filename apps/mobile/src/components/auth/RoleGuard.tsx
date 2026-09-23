import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, FontSize } from "../../constants";

interface RoleGuardProps {
  allowedRoles: string[];
  userRole: string;
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, userRole, children }: RoleGuardProps) {
  if (!allowedRoles.includes(userRole)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Access Denied</Text>
        <Text style={styles.message}>You don't have permission to view this page.</Text>
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.danger,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
