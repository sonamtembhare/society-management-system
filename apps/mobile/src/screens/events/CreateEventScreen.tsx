import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { eventService } from "../../services";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Colors, Spacing } from "../../constants";
import { FACILITY_OPTIONS } from "../../constants/facility";

export function CreateEventScreen() {
  const [title, setTitle] = useState("");
  const [facility, setFacility] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [attendees, setAttendees] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title || title.length < 5) e.title = "Title must be at least 5 characters";
    if (!facility) e.facility = "Facility is required";
    if (!eventDate) e.eventDate = "Event date is required";
    if (!startTime) e.startTime = "Start time is required";
    if (!endTime) e.endTime = "End time is required";
    if (startTime && endTime && endTime <= startTime) e.endTime = "End time must be after start time";
    if (!attendees || Number(attendees) <= 0) e.attendees = "Attendees must be a positive number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await eventService.createEvent({
        title,
        facility,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        attendees: Number(attendees),
        description: description || undefined,
        notes: notes || undefined,
      });
      Alert.alert("Success", "Event created successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const facilityOptions = FACILITY_OPTIONS.map((f: { label: string; value: string }) => ({ label: f.label, value: f.value }));

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content}>
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Event title" error={errors.title} />
        <Select label="Facility" options={facilityOptions} value={facility} onValueChange={setFacility} placeholder="Select facility" error={errors.facility} />
        <Input label="Date" value={eventDate} onChangeText={setEventDate} placeholder="YYYY-MM-DD" error={errors.eventDate} />
        <Input label="Start Time" value={startTime} onChangeText={setStartTime} placeholder="HH:MM" error={errors.startTime} />
        <Input label="End Time" value={endTime} onChangeText={setEndTime} placeholder="HH:MM" error={errors.endTime} />
        <Input label="Expected Attendees" value={attendees} onChangeText={setAttendees} placeholder="Number of attendees" keyboardType="numeric" error={errors.attendees} />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="Event description (optional)" multiline numberOfLines={3} />
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Additional notes (optional)" multiline numberOfLines={2} />
        <Button title="Create Event" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, gap: Spacing.sm },
});
