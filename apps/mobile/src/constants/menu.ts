import type { Ionicons } from "@expo/vector-icons";

export type MenuItem = {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

export const RESIDENT_MENU: MenuItem[] = [
  { name: "flats", title: "Flat", icon: "business", route: "/_tabs/flats" },
  { name: "residents", title: "Resident", icon: "people", route: "/_tabs/residents" },
  { name: "notices", title: "Notice", icon: "megaphone", route: "/_tabs/notices" },
  { name: "complaints", title: "Complaint", icon: "alert-circle", route: "/_tabs/complaints" },
  { name: "visitors", title: "Visitors", icon: "walk", route: "/_tabs/visitors" },
  { name: "events", title: "Event", icon: "calendar", route: "/_tabs/events" },
  { name: "profile", title: "Profile", icon: "person", route: "/_tabs/profile" },
  { name: "maintenance", title: "Maintenance", icon: "receipt", route: "/_tabs/maintenance" },
  { name: "payments", title: "Payment", icon: "card", route: "/_tabs/payments" },
  { name: "vehicles", title: "Vehicles", icon: "car", route: "/_tabs/vehicles" },
];