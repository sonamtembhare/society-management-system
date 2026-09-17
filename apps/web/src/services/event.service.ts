import api from "./api";
import { Event, CreateEvent, UpdateEvent, ApiResponse } from "@/src/types";

export const getEvents = async (): Promise<Event[]> => {
  const response = await api.get<ApiResponse<Event[]>>("/events");
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

export const deleteEvent = async (id: number): Promise<void> => {
  await api.delete(`/events/${id}`);
};
