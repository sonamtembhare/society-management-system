export interface Complaint {
  id: number;
  resident_id: number;
  title: string;
  description: string;
  category: string | null;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateComplaint {
  title: string;
  description: string;
  category?: string;
}

export interface UpdateComplaint {
  title?: string;
  description?: string;
  category?: string;
  status?: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
}
