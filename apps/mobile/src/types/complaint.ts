export interface Complaint {
  id: number;
  resident_id: number;
  title: string;
  description: string;
  category: string | null;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  images: string[];
  video_url: string | null;
  video_type: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  resident_name?: string;
  resident_email?: string;
  flat_number?: string;
  block?: string | null;
  phone?: string | null;
}

export interface CreateComplaint {
  title: string;
  description: string;
  category?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  images?: string[];
  video_url?: string | null;
  video_type?: string | null;
}

export interface UpdateComplaint {
  title?: string;
  description?: string;
  category?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status?: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  images?: string[];
  video_url?: string | null;
  video_type?: string | null;
}
