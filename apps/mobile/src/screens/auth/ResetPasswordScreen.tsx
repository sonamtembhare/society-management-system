import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, FontSize } from "../../constants";

export function ResetPasswordScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.message}>Please contact your society administrator to reset your password.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: Spacing.xl, backgroundColor: Colors.background },
  title: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.md },
  message: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },
});
