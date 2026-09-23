import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../../components/auth/AuthContext";
import { Colors, Spacing, FontSize, BorderRadius } from "../../constants";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      router.replace("/_tabs");
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Could not register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.inner}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up for Society Management</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your name" />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry />

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Creating account..." : "Sign Up"}</Text>
          </TouchableOpacity>

          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.loginText}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, justifyContent: "center", padding: Spacing.xl },
  title: { fontSize: FontSize.xxxl, fontWeight: "bold", color: Colors.primary, textAlign: "center", marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: "center", marginBottom: Spacing.xxl },
  form: { gap: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.text },
  input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.md },
  button: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: "center", marginTop: Spacing.sm },
  buttonText: { color: Colors.white, fontSize: FontSize.md, fontWeight: "600" },
  loginText: { color: Colors.primary, textAlign: "center", marginTop: Spacing.md },
});
