export const MEETING_LOCATIONS = [
  'Banteay Srey',
  'Angkorwat',
  'Romduol',
  'Samaki Pheap',
] as const;

export type MeetingLocation = (typeof MEETING_LOCATIONS)[number];
