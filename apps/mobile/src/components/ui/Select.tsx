import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal as RNModal, ViewStyle } from "react-native";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
}

export function Select({ label, options, value, onValueChange, placeholder = "Select...", error }: SelectProps) {
  const [visible, setVisible] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={[styles.trigger, error ? styles.triggerError : null]} onPress={() => setVisible(true)}>
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <RNModal visible={visible} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.option, option.value === value && styles.optionSelected]}
                onPress={() => { onValueChange(option.value); setVisible(false); }}
              >
                <Text style={[styles.optionText, option.value === value && styles.optionTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </RNModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.text, marginBottom: Spacing.xs },
  trigger: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 48,
  },
  triggerError: { borderColor: Colors.danger },
  triggerText: { fontSize: FontSize.md, color: Colors.text },
  placeholder: { color: Colors.textMuted },
  arrow: { fontSize: FontSize.xs, color: Colors.textMuted },
  error: { fontSize: FontSize.xs, color: Colors.danger, marginTop: Spacing.xs },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl, maxHeight: "60%" },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.lg, textAlign: "center" },
  option: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.xs },
  optionSelected: { backgroundColor: Colors.primaryLight },
  optionText: { fontSize: FontSize.md, color: Colors.text },
  optionTextSelected: { color: Colors.primary, fontWeight: "600" },
});
