export interface Notice {
  id: number;
  society_id: number;
  title: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  notice_type: "MAINTENANCE" | "MEETING" | "GENERAL" | "IMPORTANT";
  created_by: number;
  is_active: boolean;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotice {
  society_id: number;
  title: string;
  content: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  notice_type?: "MAINTENANCE" | "MEETING" | "GENERAL" | "IMPORTANT";
  expiry_date?: string;
}

export interface UpdateNotice {
  title?: string;
  content?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  notice_type?: "MAINTENANCE" | "MEETING" | "GENERAL" | "IMPORTANT";
  is_active?: boolean;
  expiry_date?: string;
}
