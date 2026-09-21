export interface Visitor {
  id: number;
  resident_id: number;
  flat_id: number;
  visitor_name: string;
  visitor_phone: string;
  purpose: string | null;
  vehicle_number: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPECTED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  visitor_type: "GUEST" | "DELIVERY" | "SERVICE" | "CAB" | "OTHER";
  expected_date: string | null;
  expected_time: string | null;
  notes: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  approved_by: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVisitor {
  visitor_name: string;
  visitor_phone: string;
  purpose?: string;
  vehicle_number?: string;
  visitor_type?: "GUEST" | "DELIVERY" | "SERVICE" | "CAB" | "OTHER";
  expected_date?: string;
  expected_time?: string;
  notes?: string;
  resident_id?: number;
  flat_id?: number;
}

export interface UpdateVisitor {
  status?: "PENDING" | "APPROVED" | "REJECTED" | "EXPECTED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  purpose?: string;
  vehicle_number?: string;
}

export interface VisitorStats {
  EXPECTED: number;
  CHECKED_IN: number;
  CHECKED_OUT: number;
  CANCELLED: number;
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
}
