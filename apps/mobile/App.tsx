import { useEffect } from "react";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/components/auth/AuthContext";
import { LoadingSpinner } from "./src/components/ui/LoadingSpinner";
import { SafeAreaView } from "react-native-safe-area-context";

function RootLayoutNav() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/_tabs" />;
}

export default function RootLayout() {
  return (
    <SafeAreaView>
      <AuthProvider>
        <StatusBar hidden={true} />
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaView>
  );
}
