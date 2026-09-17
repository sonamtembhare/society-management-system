export interface Notice {
  id: number;
  society_id: number;
  title: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  created_by: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotice {
  society_id: number;
  title: string;
  content: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}

export interface UpdateNotice {
  title?: string;
  content?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  is_active?: boolean;
}
