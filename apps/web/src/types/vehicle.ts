export interface Vehicle {
  id: number;
  resident_id: number;
  vehicle_number: string;
  vehicle_type: "CAR" | "BIKE" | "SCOOTER" | "OTHER";
  brand: string | null;
  model: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicle {
  vehicle_number: string;
  vehicle_type: "CAR" | "BIKE" | "SCOOTER" | "OTHER";
  brand?: string;
  model?: string;
  color?: string;
}

export interface UpdateVehicle {
  vehicle_number?: string;
  vehicle_type?: "CAR" | "BIKE" | "SCOOTER" | "OTHER";
  brand?: string;
  model?: string;
  color?: string;
}
