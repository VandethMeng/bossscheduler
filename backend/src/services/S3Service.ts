import {
  GetObjectCommand,
  PutObjectCommand,
  NoSuchKey,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { s3Client } from '../config/s3';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import {
  Appointment,
  AppointmentFilters,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../models/Appointment';

export class S3Service {
  private bucketName: string;
  private appointmentsKey: string;

  constructor() {
    this.bucketName = env.aws.bucketName;
    this.appointmentsKey = env.aws.appointmentsKey;
  }

  async getAppointments(): Promise<Appointment[]> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: this.appointmentsKey,
      });

      const response = await s3Client.send(command);
      const body = await response.Body?.transformToString();

      if (!body) {
        return [];
      }

      const parsed = JSON.parse(body);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error: unknown) {
      if (
        error instanceof NoSuchKey ||
        (error as { name?: string }).name === 'NoSuchKey'
      ) {
        return [];
      }

      const message = error instanceof Error ? error.message : 'Unknown S3 error';
      throw new ApiError(500, `Failed to fetch appointments from S3: ${message}`);
    }
  }

  async saveAppointments(appointments: Appointment[]): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: this.appointmentsKey,
        Body: JSON.stringify(appointments, null, 2),
        ContentType: 'application/json',
      });

      await s3Client.send(command);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown S3 error';
      throw new ApiError(500, `Failed to save appointments to S3: ${message}`);
    }
  }

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    const appointments = await this.getAppointments();
    const now = new Date().toISOString();

    const newAppointment: Appointment = {
      id: uuidv4(),
      title: input.title,
      description: input.description || '',
      meetingDate: input.meetingDate,
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location || '',
      organizer: input.organizer || '',
      attendees: input.attendees || [],
      status: input.status || 'Scheduled',
      createdAt: now,
      updatedAt: now,
    };

    appointments.push(newAppointment);
    await this.saveAppointments(appointments);

    return newAppointment;
  }

  async updateAppointment(
    id: string,
    input: UpdateAppointmentInput
  ): Promise<Appointment> {
    const appointments = await this.getAppointments();
    const index = appointments.findIndex((apt) => apt.id === id);

    if (index === -1) {
      throw new ApiError(404, 'Appointment not found');
    }

    const updated: Appointment = {
      ...appointments[index],
      ...input,
      id: appointments[index].id,
      createdAt: appointments[index].createdAt,
      updatedAt: new Date().toISOString(),
    };

    appointments[index] = updated;
    await this.saveAppointments(appointments);

    return updated;
  }

  async deleteAppointment(id: string): Promise<Appointment> {
    const appointments = await this.getAppointments();
    const index = appointments.findIndex((apt) => apt.id === id);

    if (index === -1) {
      throw new ApiError(404, 'Appointment not found');
    }

    const [deleted] = appointments.splice(index, 1);
    await this.saveAppointments(appointments);

    return deleted;
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    const appointments = await this.getAppointments();
    const appointment = appointments.find((apt) => apt.id === id);

    if (!appointment) {
      throw new ApiError(404, 'Appointment not found');
    }

    return appointment;
  }

  filterAppointments(
    appointments: Appointment[],
    filters: AppointmentFilters
  ): Appointment[] {
    let result = [...appointments];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (apt) =>
          apt.title.toLowerCase().includes(searchLower) ||
          apt.description.toLowerCase().includes(searchLower) ||
          apt.location.toLowerCase().includes(searchLower) ||
          apt.organizer.toLowerCase().includes(searchLower) ||
          apt.attendees.some((a) => a.toLowerCase().includes(searchLower))
      );
    }

    if (filters.date) {
      result = result.filter((apt) => apt.meetingDate === filters.date);
    }

    if (filters.month) {
      result = result.filter((apt) => apt.meetingDate.startsWith(filters.month!));
    }

    if (filters.status) {
      result = result.filter((apt) => apt.status === filters.status);
    }

    return result.sort(
      (a, b) =>
        new Date(`${a.meetingDate}T${a.startTime}`).getTime() -
        new Date(`${b.meetingDate}T${b.startTime}`).getTime()
    );
  }
}

export const s3Service = new S3Service();
