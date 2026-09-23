import { Stack } from "expo-router";
import { AuthProvider } from "../components/auth/AuthContext";
import { Colors } from "../constants";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ title: "Forgot Password" }} />
        <Stack.Screen name="reset-password" options={{ title: "Reset Password" }} />
        <Stack.Screen name="_tabs" options={{ headerShown: false }} />
        <Stack.Screen name="resident/[id]" options={{ title: "Resident Details" }} />
        <Stack.Screen name="flat/[id]" options={{ title: "Flat Details" }} />
        <Stack.Screen name="maintenance/[id]" options={{ title: "Maintenance Details" }} />
        <Stack.Screen name="maintenance/create" options={{ title: "Create Maintenance" }} />
        <Stack.Screen name="payment/[id]" options={{ title: "Payment Details" }} />
        <Stack.Screen name="payment/create" options={{ title: "Record Payment" }} />
        <Stack.Screen name="complaint/[id]" options={{ title: "Complaint Details" }} />
        <Stack.Screen name="complaint/create" options={{ title: "Create Complaint" }} />
        <Stack.Screen name="notice/[id]" options={{ title: "Notice Details" }} />
        <Stack.Screen name="notice/create" options={{ title: "Create Notice" }} />
        <Stack.Screen name="visitor/[id]" options={{ title: "Visitor Details" }} />
        <Stack.Screen name="visitor/create" options={{ title: "Add Visitor" }} />
        <Stack.Screen name="vehicle/[id]" options={{ title: "Vehicle Details" }} />
        <Stack.Screen name="vehicle/create" options={{ title: "Register Vehicle" }} />
        <Stack.Screen name="event/[id]" options={{ title: "Event Details" }} />
        <Stack.Screen name="event/create" options={{ title: "Create Event" }} />
        <Stack.Screen name="society/[id]" options={{ title: "Society Details" }} />
      </Stack>
    </AuthProvider>
  );
}