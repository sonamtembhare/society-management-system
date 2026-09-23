import { api } from "./api";
import type { ApiResponse, Event, EventDetail, CreateEvent, UpdateEvent } from "../types";

export const eventService = {
  async getEvents(): Promise<ApiResponse<Event[]>> {
    return api.get("/events");
  },

  async getResidentEvents(): Promise<ApiResponse<Event[]>> {
    return api.get("/events/resident");
  },

  async getEventById(id: number): Promise<ApiResponse<EventDetail>> {
    return api.get(`/events/${id}`);
  },

  async createEvent(data: CreateEvent): Promise<ApiResponse<Event>> {
    return api.post("/events", data);
  },

  async updateEvent(id: number, data: UpdateEvent): Promise<ApiResponse<Event>> {
    return api.put(`/events/${id}`, data);
  },

  async approveEvent(id: number): Promise<ApiResponse<Event>> {
    return api.post(`/events/${id}/approve`);
  },

  async rejectEvent(id: number, reason?: string): Promise<ApiResponse<Event>> {
    return api.post(`/events/${id}/reject`, { reason });
  },

  async cancelEvent(id: number): Promise<ApiResponse<Event>> {
    return api.post(`/events/${id}/cancel`);
  },

  async deleteEvent(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/events/${id}`);
  },
};
