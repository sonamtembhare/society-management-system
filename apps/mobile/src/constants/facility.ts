export const FACILITY_OPTIONS = [
  { value: "GYM", label: "Gym" },
  { value: "SWIMMING_POOL", label: "Swimming Pool" },
  { value: "YOGA", label: "Yoga" },
  { value: "SOCIETY_HALL", label: "Society Hall" },
  { value: "OTHER", label: "Other" },
] as const;

export const FACILITY_VALUES = ["GYM", "SWIMMING_POOL", "YOGA", "SOCIETY_HALL", "OTHER"] as const;

export type Facility = (typeof FACILITY_VALUES)[number];
