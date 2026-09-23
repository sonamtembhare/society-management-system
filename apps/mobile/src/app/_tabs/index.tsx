import { Redirect } from "expo-router";
import { useAuth } from "../../components/auth/AuthContext";
import { AdminDashboard } from "../../screens/dashboard/AdminDashboard";
import { ResidentDashboard } from "../../screens/dashboard/ResidentDashboard";
import { SecurityDashboard } from "../../screens/dashboard/SecurityDashboard";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

export default function DashboardTab() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Redirect href="/login" />;

  if (user.role === "ADMIN") return <AdminDashboard />;
  if (user.role === "RESIDENT") return <ResidentDashboard />;
  return <SecurityDashboard />;
}
