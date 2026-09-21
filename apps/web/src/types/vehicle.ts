export interface Vehicle {
  id: number;
  resident_id: number;
  flat_id?: number | null;
  vehicle_number: string;
  vehicle_type: "CAR" | "BIKE" | "SCOOTER" | "EV" | "OTHER";
  brand: string | null;
  model: string | null;
  color: string | null;
  status: string;
  resident_name?: string;
  resident_mobile?: string | null;
  flat_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicle {
  vehicle_number: string;
  vehicle_type: "CAR" | "BIKE" | "SCOOTER" | "EV" | "OTHER";
  brand?: string;
  model?: string;
  color?: string;
}

export interface UpdateVehicle {
  vehicle_number?: string;
  vehicle_type?: "CAR" | "BIKE" | "SCOOTER" | "EV" | "OTHER";
  brand?: string;
  model?: string;
  color?: string;
}
