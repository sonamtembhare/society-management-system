export interface Visitor {
  id: number;
  resident_id: number;
  flat_id: number;
  visitor_name: string;
  visitor_phone: string;
  purpose: string | null;
  vehicle_number: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CHECKED_IN" | "CHECKED_OUT";
  check_in_time: string | null;
  check_out_time: string | null;
  approved_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVisitor {
  resident_id: number;
  flat_id: number;
  visitor_name: string;
  visitor_phone: string;
  purpose?: string;
  vehicle_number?: string;
}

export interface UpdateVisitor {
  status?: "PENDING" | "APPROVED" | "REJECTED" | "CHECKED_IN" | "CHECKED_OUT";
  purpose?: string;
  vehicle_number?: string;
}
