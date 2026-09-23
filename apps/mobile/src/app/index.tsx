import { useEffect } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../components/auth/AuthContext";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/_tabs" />;
}
