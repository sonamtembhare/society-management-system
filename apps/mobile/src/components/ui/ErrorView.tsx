import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, FontSize } from "../../constants";

interface ErrorViewProps {
  message?: string;
}

export function ErrorView({ message = "Something went wrong" }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  text: { fontSize: FontSize.md, color: Colors.danger, textAlign: "center" },
});
