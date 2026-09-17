export interface Resident {
  id: number;
  user_id: number;
  flat_id: number;
  phone: string | null;
  emergency_contact: string | null;
  moving_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResidentDetail extends Resident {
  user_name: string;
  user_email: string;
  flat_number: string;
  block: string | null;
  society_name: string;
}

export interface CreateResident {
  user_id: number;
  flat_id: number;
  phone?: string;
  emergency_contact?: string;
  moving_date?: string;
}

export interface UpdateResident {
  flat_id?: number;
  phone?: string;
  emergency_contact?: string;
  moving_date?: string;
}
