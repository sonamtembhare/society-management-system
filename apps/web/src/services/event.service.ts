import api from "./api";
import { Event, EventDetail, CreateEvent, UpdateEvent, ApiResponse } from "@/src/types";

export const getEvents = async (): Promise<Event[]> => {
  const response = await api.get<ApiResponse<Event[]>>("/events");
  return response.data.data || [];
};

export const getResidentEvents = async (): Promise<Event[]> => {
  const response = await api.get<ApiResponse<Event[]>>("/events/resident");
  return response.data.data || [];
};

export const getEventById = async (id: number): Promise<Event> => {
  const response = await api.get<ApiResponse<Event>>(`/events/${id}`);
  return response.data.data!;
};

export const createEvent = async (data: CreateEvent): Promise<Event> => {
  const response = await api.post<ApiResponse<Event>>("/events", data);
  return response.data.data!;
};

export const updateEvent = async (id: number, data: UpdateEvent): Promise<Event> => {
  const response = await api.put<ApiResponse<Event>>(`/events/${id}`, data);
  return response.data.data!;
};

export const approveEvent = async (id: number): Promise<Event> => {
  const response = await api.post<ApiResponse<Event>>(`/events/${id}/approve`);
  return response.data.data!;
};

export const rejectEvent = async (id: number, reason?: string): Promise<Event> => {
  const response = await api.post<ApiResponse<Event>>(`/events/${id}/reject`, { reason });
  return response.data.data!;
};

export const cancelEvent = async (id: number): Promise<Event> => {
  const response = await api.post<ApiResponse<Event>>(`/events/${id}/cancel`);
  return response.data.data!;
};

export const deleteEvent = async (id: number): Promise<void> => {
  await api.delete(`/events/${id}`);
};
