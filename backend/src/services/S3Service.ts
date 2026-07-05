import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  NoSuchKey,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { s3Client } from '../config/s3';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { APP_TIMEZONE, isMeetingEnded } from '../utils/timezone';
import { UserRole } from '../models/User';
import {
  Appointment,
  AppointmentFilters,
  CreateAppointmentInput,
  MeetingMinutes,
  UpdateAppointmentInput,
} from '../models/Appointment';

export class S3Service {
  private bucketName: string;
  private appointmentsKey: string;
  private meetingMinutesPrefix: string;

  constructor() {
    this.bucketName = env.aws.bucketName;
    this.appointmentsKey = env.aws.appointmentsKey;
    this.meetingMinutesPrefix = env.aws.meetingMinutesPrefix;
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
      location: input.location.trim(),
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

    if (appointments[index].status === 'Completed') {
      throw new ApiError(
        403,
        'Completed meetings cannot be edited. You can only upload meeting minutes PDF.'
      );
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

  async deleteAppointment(id: string, requesterRole: UserRole): Promise<Appointment> {
    const appointments = await this.getAppointments();
    const index = appointments.findIndex((apt) => apt.id === id);

    if (index === -1) {
      throw new ApiError(404, 'Appointment not found');
    }

    if (appointments[index].status === 'Completed' && requesterRole !== 'Admin') {
      throw new ApiError(
        403,
        'Completed meetings cannot be deleted. Contact an admin if removal is required.'
      );
    }

    const [deleted] = appointments.splice(index, 1);

    if (deleted.meetingMinutes?.s3Key) {
      await this.deleteMeetingMinutesFile(deleted.meetingMinutes.s3Key);
    }

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

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  async deleteMeetingMinutesFile(s3Key: string): Promise<void> {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
        })
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown S3 error';
      throw new ApiError(500, `Failed to delete meeting minutes file: ${message}`);
    }
  }

  async uploadMeetingMinutes(
    appointmentId: string,
    buffer: Buffer,
    originalFileName: string
  ): Promise<Appointment> {
    const appointment = await this.getAppointmentById(appointmentId);

    if (appointment.status !== 'Completed') {
      throw new ApiError(
        400,
        'Meeting minutes can only be uploaded after the meeting is marked as Completed'
      );
    }

    if (appointment.meetingMinutes?.s3Key) {
      await this.deleteMeetingMinutesFile(appointment.meetingMinutes.s3Key);
    }

    const safeName = this.sanitizeFileName(originalFileName);
    const s3Key = `${this.meetingMinutesPrefix}/${appointmentId}/${Date.now()}-${safeName}`;

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
          Body: buffer,
          ContentType: 'application/pdf',
        })
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown S3 error';
      throw new ApiError(500, `Failed to upload meeting minutes: ${message}`);
    }

    const meetingMinutes: MeetingMinutes = {
      fileName: originalFileName,
      s3Key,
      uploadedAt: new Date().toISOString(),
      fileSize: buffer.length,
    };

    return this.setMeetingMinutes(appointmentId, meetingMinutes);
  }

  async getMeetingMinutesBuffer(s3Key: string): Promise<Buffer> {
    try {
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
        })
      );

      const bytes = await response.Body?.transformToByteArray();

      if (!bytes) {
        throw new ApiError(404, 'Meeting minutes file not found');
      }

      return Buffer.from(bytes);
    } catch (error: unknown) {
      if (
        error instanceof NoSuchKey ||
        (error as { name?: string }).name === 'NoSuchKey'
      ) {
        throw new ApiError(404, 'Meeting minutes file not found');
      }

      if (error instanceof ApiError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown S3 error';
      throw new ApiError(500, `Failed to download meeting minutes: ${message}`);
    }
  }

  async removeMeetingMinutes(appointmentId: string): Promise<Appointment> {
    const appointment = await this.getAppointmentById(appointmentId);

    if (!appointment.meetingMinutes?.s3Key) {
      throw new ApiError(404, 'No meeting minutes uploaded for this appointment');
    }

    await this.deleteMeetingMinutesFile(appointment.meetingMinutes.s3Key);
    return this.setMeetingMinutes(appointmentId, undefined);
  }

  async setMeetingMinutes(
    appointmentId: string,
    meetingMinutes: MeetingMinutes | undefined
  ): Promise<Appointment> {
    const appointments = await this.getAppointments();
    const index = appointments.findIndex((apt) => apt.id === appointmentId);

    if (index === -1) {
      throw new ApiError(404, 'Appointment not found');
    }

    const updated: Appointment = {
      ...appointments[index],
      updatedAt: new Date().toISOString(),
    };

    if (meetingMinutes) {
      updated.meetingMinutes = meetingMinutes;
    } else {
      delete updated.meetingMinutes;
    }

    appointments[index] = updated;
    await this.saveAppointments(appointments);

    return updated;
  }

  async completeExpiredAppointments(
    timezone: string = APP_TIMEZONE
  ): Promise<{ completed: Appointment[]; appointments: Appointment[] }> {
    const appointments = await this.getAppointments();
    const completed: Appointment[] = [];
    let changed = false;

    for (let i = 0; i < appointments.length; i++) {
      const apt = appointments[i];

      if (
        apt.status === 'Scheduled' &&
        isMeetingEnded(apt.meetingDate, apt.endTime, timezone)
      ) {
        const updated: Appointment = {
          ...apt,
          status: 'Completed',
          updatedAt: new Date().toISOString(),
        };

        appointments[i] = updated;
        completed.push(updated);
        changed = true;
      }
    }

    if (changed) {
      await this.saveAppointments(appointments);
    }

    return { completed, appointments };
  }
}

export const s3Service = new S3Service();
