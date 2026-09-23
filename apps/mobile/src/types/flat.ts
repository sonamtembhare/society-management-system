export interface Flat {
  id: number;
  society_id: number;
  flat_number: string;
  block: string | null;
  floor: number | null | undefined;
  type: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFlat {
  society_id: number;
  flat_number: string;
  block?: string;
  floor?: number | null;
  type?: string;
}

export interface UpdateFlat {
  society_id?: number;
  flat_number?: string;
  block?: string;
  floor?: number | null;
  type?: string;
}
