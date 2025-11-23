
export interface Booking {
  id: string;
  userId: string;
  userName: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
  title?: string;
  type: 'desk' | 'meeting';
}

export interface Room {
  id: string;
  floorId: string; // 'ground', 'first'
  name: string;
  capacity: number;
  type: 'meeting' | 'desk' | 'common' | 'cafeteria' | 'recreation';
  features: string[]; // e.g., 'pc', 'whiteboard', 'projector', 'tt_table'
  occupancyThreshold?: number; // Percentage (0-100+) at which to trigger alert
  x: number; // Grid coordinate X
  y: number; // Grid coordinate Y
  width: number;
  height: number;
  bookings: number; // Weightage for popularity
  occupants: string[]; // List of names of people currently in the room
  schedule: Booking[]; // Future bookings
}

export interface Floor {
  id: string;
  name: string;
  level: number;
}

export interface FloorPlan {
  id: string;
  version: number;
  lastModified: number; // Timestamp
  rooms: Room[];
}

export interface PendingChange {
  id: string;
  type: 'UPDATE' | 'DELETE' | 'CREATE';
  data: Room;
  timestamp: number;
}

export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface User {
  name: string;
  role: UserRole;
  password?: string; // Optional in frontend object, used in DB
  email?: string;
}

export interface ConflictData {
  serverVersion: FloorPlan;
  localVersion: FloorPlan;
}