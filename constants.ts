
import { FloorPlan, Room, User, Floor } from './types';

export const GRID_SIZE = 12; // Expanded grid
export const CELL_SIZE = 60; // px

export const FLOORS: Floor[] = [
  { id: 'ground', name: 'Ground Floor', level: 0 },
  { id: 'first', name: '1st Floor (Tech Hub)', level: 1 }
];

// Initial Mock Database for Users
export const INITIAL_USERS: User[] = [
  { name: 'Shantanu', role: 'ADMIN', password: '12345678', email: 'shantanu@company.com' }, // Main Admin
  { name: 'admin', role: 'ADMIN', password: 'admin', email: 'admin@company.com' },
  { name: 'John Doe', role: 'EMPLOYEE', password: '123', email: 'john@company.com' },
  { name: 'Sarah Connor', role: 'EMPLOYEE', password: '123', email: 'sarah@company.com' }
];

export const INITIAL_ROOMS: Room[] = [
  // --- GROUND FLOOR ---
  {
    id: 'r1',
    floorId: 'ground',
    name: 'Boardroom Alpha',
    capacity: 20,
    type: 'meeting',
    features: ['projector', 'whiteboard'],
    occupancyThreshold: 100,
    x: 0,
    y: 0,
    width: 4,
    height: 3,
    bookings: 45,
    occupants: [],
    schedule: []
  },
  {
    id: 'r2',
    floorId: 'ground',
    name: 'Huddle A',
    capacity: 4,
    type: 'meeting',
    features: ['whiteboard'],
    occupancyThreshold: 100,
    x: 5,
    y: 0,
    width: 2,
    height: 2,
    bookings: 12,
    occupants: [],
    schedule: []
  },
  {
    id: 'r3',
    floorId: 'ground',
    name: 'Open Workspace',
    capacity: 10,
    type: 'desk',
    features: [], // Laptop friendly, no fixed PCs
    occupancyThreshold: 80, // Alert at 80%
    x: 0,
    y: 4,
    width: 6,
    height: 4,
    bookings: 0,
    occupants: [],
    schedule: []
  },
  {
    id: 'r4',
    floorId: 'ground',
    name: 'Phone Booth',
    capacity: 1,
    type: 'meeting',
    features: [],
    x: 8,
    y: 0,
    width: 1,
    height: 1,
    bookings: 5,
    occupants: [],
    schedule: []
  },
  {
    id: 'r5',
    floorId: 'ground',
    name: 'The Beanery',
    capacity: 15,
    type: 'cafeteria',
    features: ['coffee'],
    x: 7,
    y: 3,
    width: 4,
    height: 3,
    bookings: 50,
    occupants: [],
    schedule: []
  },
  {
    id: 'r_g_new1',
    floorId: 'ground',
    name: 'Strategy Room',
    capacity: 8,
    type: 'meeting',
    features: ['screen'],
    occupancyThreshold: 100,
    x: 9,
    y: 0,
    width: 3,
    height: 3,
    bookings: 10,
    occupants: [],
    schedule: []
  },
  {
    id: 'r_g_new2',
    floorId: 'ground',
    name: 'Chill Zone',
    capacity: 6,
    type: 'common',
    features: ['sofa'],
    x: 6,
    y: 6,
    width: 3,
    height: 3,
    bookings: 5,
    occupants: [],
    schedule: []
  },

  // --- 1ST FLOOR (Tech Focused) ---
  {
    id: 'r6',
    floorId: 'first',
    name: 'Dev Hub (PC)',
    capacity: 8,
    type: 'desk',
    features: ['pc'], // Has System PCs
    occupancyThreshold: 90,
    x: 0,
    y: 0,
    width: 5,
    height: 4,
    bookings: 80,
    occupants: [],
    schedule: []
  },
  {
    id: 'r7',
    floorId: 'first',
    name: 'Design Lab (PC)',
    capacity: 4,
    type: 'desk',
    features: ['pc', 'mac'], // High-end machines
    occupancyThreshold: 100,
    x: 6,
    y: 0,
    width: 3,
    height: 3,
    bookings: 65,
    occupants: [],
    schedule: []
  },
  {
    id: 'r8',
    floorId: 'first',
    name: 'War Room',
    capacity: 6,
    type: 'meeting',
    features: ['projector', 'pc'],
    occupancyThreshold: 100,
    x: 0,
    y: 5,
    width: 4,
    height: 3,
    bookings: 20,
    occupants: [],
    schedule: []
  },
  {
    id: 'r_f_new1',
    floorId: 'first',
    name: 'Game Room',
    capacity: 4,
    type: 'recreation',
    features: ['tt_table'],
    x: 5,
    y: 5,
    width: 4,
    height: 3,
    bookings: 15,
    occupants: [],
    schedule: []
  },
  {
    id: 'r_f_new2',
    floorId: 'first',
    name: 'Sky Cafe',
    capacity: 12,
    type: 'cafeteria',
    features: [],
    x: 9,
    y: 0,
    width: 3,
    height: 4,
    bookings: 30,
    occupants: [],
    schedule: []
  },
  {
    id: 'r_f_new3',
    floorId: 'first',
    name: 'Executive Suite',
    capacity: 10,
    type: 'meeting',
    features: ['vc_system', 'whiteboard'],
    occupancyThreshold: 100,
    x: 0,
    y: 8,
    width: 4,
    height: 3,
    bookings: 5,
    occupants: [],
    schedule: []
  }
];

export const INITIAL_FLOOR_PLAN: FloorPlan = {
  id: 'fp_main',
  version: 1,
  lastModified: Date.now(),
  rooms: INITIAL_ROOMS,
};