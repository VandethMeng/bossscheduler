import { Appointment } from '../models/Appointment';

export interface OverlapSlotInfo {
  slotIndex: number;
  slotTotal: number;
  timeSlot: string;
  overlapType: 'exact' | 'partial';
  conflictingTitles: string[];
}

export interface OverlapGroupSummary {
  groupIndex: number;
  count: number;
  overlapType: 'exact' | 'partial';
  meetings: Array<{ title: string; timeSlot: string; location: string }>;
}

export function toMinutesFromTime(time: string): number {
  const [hours, minutes] = time.split(':').map((part) => parseInt(part, 10));
  return hours * 60 + (minutes || 0);
}

export function formatTimeSlot(startTime: string, endTime: string): string {
  return `${startTime.slice(0, 5)} – ${endTime.slice(0, 5)}`;
}

export function appointmentsOverlap(a: Appointment, b: Appointment): boolean {
  const startA = toMinutesFromTime(a.startTime);
  const endA = toMinutesFromTime(a.endTime);
  const startB = toMinutesFromTime(b.startTime);
  const endB = toMinutesFromTime(b.endTime);

  return startA < endB && startB < endA;
}

function isExactSameSlot(a: Appointment, b: Appointment): boolean {
  return (
    a.startTime.slice(0, 5) === b.startTime.slice(0, 5) &&
    a.endTime.slice(0, 5) === b.endTime.slice(0, 5)
  );
}

function getOverlapType(group: Appointment[]): 'exact' | 'partial' {
  const allExact = group.every((apt) =>
    isExactSameSlot(apt, group[0])
  );
  return allExact ? 'exact' : 'partial';
}

export interface AppointmentConflictReport {
  timeOverlaps: Array<{
    title: string;
    timeSlot: string;
    location: string;
    overlapType: 'exact' | 'partial';
  }>;
  locationConflicts: Array<{
    title: string;
    timeSlot: string;
    location: string;
  }>;
}

function normalizeLocation(location: string): string {
  return location.trim().toLowerCase();
}

function isActiveForConflictCheck(appointment: Appointment): boolean {
  return appointment.status === 'Scheduled' || appointment.status === 'Postponed';
}

export function getAppointmentConflicts(
  appointment: Appointment,
  allAppointments: Appointment[]
): AppointmentConflictReport {
  const timeOverlaps: AppointmentConflictReport['timeOverlaps'] = [];
  const locationConflicts: AppointmentConflictReport['locationConflicts'] = [];
  const appointmentLocation = normalizeLocation(appointment.location);

  if (!isActiveForConflictCheck(appointment)) {
    return { timeOverlaps, locationConflicts };
  }

  for (const other of allAppointments) {
    if (other.id === appointment.id) {
      continue;
    }

    if (other.meetingDate !== appointment.meetingDate) {
      continue;
    }

    if (other.status !== 'Scheduled') {
      continue;
    }

    if (!appointmentsOverlap(appointment, other)) {
      continue;
    }

    const overlapType: 'exact' | 'partial' = isExactSameSlot(appointment, other)
      ? 'exact'
      : 'partial';

    timeOverlaps.push({
      title: other.title,
      timeSlot: formatTimeSlot(other.startTime, other.endTime),
      location: other.location,
      overlapType,
    });

    if (
      appointmentLocation &&
      normalizeLocation(other.location) === appointmentLocation
    ) {
      locationConflicts.push({
        title: other.title,
        timeSlot: formatTimeSlot(other.startTime, other.endTime),
        location: other.location,
      });
    }
  }

  return { timeOverlaps, locationConflicts };
}

export function getOverlapGroups(appointments: Appointment[]): Appointment[][] {
  const groups: Appointment[][] = [];
  const assigned = new Set<string>();

  for (const apt of appointments) {
    if (assigned.has(apt.id)) {
      continue;
    }

    const group = [apt];
    assigned.add(apt.id);
    let expanded = true;

    while (expanded) {
      expanded = false;

      for (const other of appointments) {
        if (assigned.has(other.id)) {
          continue;
        }

        if (group.some((member) => appointmentsOverlap(member, other))) {
          group.push(other);
          assigned.add(other.id);
          expanded = true;
        }
      }
    }

    if (group.length > 1) {
      groups.push(
        group.sort(
          (a, b) => toMinutesFromTime(a.startTime) - toMinutesFromTime(b.startTime)
        )
      );
    }
  }

  return groups;
}

export function getOverlapSummaries(
  appointments: Appointment[]
): OverlapGroupSummary[] {
  return getOverlapGroups(appointments).map((group, index) => ({
    groupIndex: index + 1,
    count: group.length,
    overlapType: getOverlapType(group),
    meetings: group.map((apt) => ({
      title: apt.title,
      timeSlot: formatTimeSlot(apt.startTime, apt.endTime),
      location: apt.location,
    })),
  }));
}

export function getOverlapSlotInfo(
  appointments: Appointment[]
): Map<string, OverlapSlotInfo> {
  const info = new Map<string, OverlapSlotInfo>();
  const groups = getOverlapGroups(appointments);

  for (const group of groups) {
    const overlapType = getOverlapType(group);

    group.forEach((apt, index) => {
      info.set(apt.id, {
        slotIndex: index + 1,
        slotTotal: group.length,
        timeSlot: formatTimeSlot(apt.startTime, apt.endTime),
        overlapType,
        conflictingTitles: group
          .filter((other) => other.id !== apt.id)
          .map((other) => other.title),
      });
    });
  }

  return info;
}

/** @deprecated Use getOverlapSlotInfo */
export function getDuplicateSlotInfo(
  appointments: Appointment[]
): Map<string, OverlapSlotInfo> {
  return getOverlapSlotInfo(appointments);
}

export type DuplicateSlotInfo = OverlapSlotInfo;
