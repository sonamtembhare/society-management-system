import React from "react";
import { TextInput, Text, View, StyleSheet, TextInputProps } from "react-native";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants";

interface InputProps extends TextInputProps {
  label: string;
  error?: string | null;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholderTextColor={Colors.textMuted}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.text, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 48,
  },
  inputError: { borderColor: Colors.danger },
  error: { fontSize: FontSize.xs, color: Colors.danger, marginTop: Spacing.xs },
});
