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
  facility: string;
  start_time: string | null;
  end_time: string | null;
  attendees: number;
  status: string;
  resident_id: number | null;
  notes: string | null;
  rejection_reason: string | null;
  approved_by: number | null;
  approved_at: string | null;
}

export interface EventDetail extends Event {
  resident_name: string;
  flat_number: string;
  user_email: string;
  user_phone: string | null;
}

export interface CreateEvent {
  title: string;
  facility: string;
  event_date: string;
  start_time: string;
  end_time: string;
  attendees: number;
  description?: string;
  notes?: string;
}

export interface UpdateEvent {
  title?: string;
  facility?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  attendees?: number;
  description?: string;
  notes?: string;
}
