export interface Event {
  id: number;
  society_id: number;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEvent {
  society_id: number;
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  location?: string;
}

export interface UpdateEvent {
  title?: string;
  description?: string;
  event_date?: string;
  end_date?: string;
  location?: string;
}
