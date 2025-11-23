
import { FloorPlan, Room, User, UserRole, Booking } from '../types';
import { INITIAL_FLOOR_PLAN, INITIAL_USERS } from '../constants';

// --- DATABASE CONNECTION SIMULATION (LocalStorage) ---
const DB_KEYS = {
  FLOOR_PLAN: 'ifpm_live_db_floorplan_v2', // Using v2 to ensure clean state with new rooms
  USERS: 'ifpm_live_db_users_v2'
};

const loadFromDB = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      // console.log(`[Database] Loaded ${key} from local storage.`); // Optional: debug log
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn(`[Database] Failed to load ${key}`, e);
  }
  return JSON.parse(JSON.stringify(fallback));
};

const commitToDB = () => {
  try {
    localStorage.setItem(DB_KEYS.FLOOR_PLAN, JSON.stringify(serverFloorPlan));
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(usersDB));
    console.log(`[Database] Transaction committed. Data persisted.`);
  } catch (e) {
    console.error(`[Database] Commit failed`, e);
  }
};

// --- SHARED SERVER STATE ---
// Initialize state from "Database" (LocalStorage)
let serverFloorPlan: FloorPlan = loadFromDB(DB_KEYS.FLOOR_PLAN, INITIAL_FLOOR_PLAN);
let usersDB: User[] = loadFromDB(DB_KEYS.USERS, INITIAL_USERS);

console.log("[Server] Connection established. Database ready.");

// --- HELPERS ---
const checkForOverlap = (schedule: Booking[], start: number, end: number) => {
  return schedule.some(b => 
    (start < b.endTime && end > b.startTime)
  );
};

const simulateEmailService = async (email: string, name: string) => {
  console.log(`[MailServer] Connecting to SMTP server...`);
  await new Promise(r => setTimeout(r, 500));
  console.log(`[MailServer] Sending Welcome Email to <${email}>...`);
  console.log(`[MailServer] Subject: Welcome to Intelligent Workspace!`);
  console.log(`[MailServer] Body: Hello ${name}, you have been successfully registered in the portal.`);
  return true;
};

// --- AUTH SERVICE ---
export const authService = {
  login: async (nameOrEmail: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Reload DB in case updated in another tab
        usersDB = loadFromDB(DB_KEYS.USERS, INITIAL_USERS);

        const user = usersDB.find(u => 
          (u.name.toLowerCase() === nameOrEmail.toLowerCase() || u.email === nameOrEmail) && 
          u.password === password
        );
        
        if (user) {
          resolve({ success: true, user: { name: user.name, role: user.role, email: user.email } });
        } else {
          resolve({ success: false, error: 'Invalid credentials' });
        }
      }, 600); 
    });
  },

  register: async (name: string, password: string, email: string, role: UserRole = 'EMPLOYEE'): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        // Reload DB
        usersDB = loadFromDB(DB_KEYS.USERS, INITIAL_USERS);

        const exists = usersDB.some(u => u.email === email);
        if (exists) {
            resolve(false);
        } else {
            // 1. Save to DB
            usersDB.push({ name, role, password, email });
            commitToDB();

            // 2. Send Email
            await simulateEmailService(email, name);

            resolve(true);
        }
      }, 1000); // Slightly longer to simulate email sending
    });
  },

  forgotPassword: async (email: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        usersDB = loadFromDB(DB_KEYS.USERS, INITIAL_USERS);
        const exists = usersDB.some(u => u.email === email);
        if (exists) {
            console.log(`[MailServer] Sending password reset link to ${email}`);
        }
        resolve(exists);
      }, 800);
    });
  }
};

// --- FLOOR PLAN & ROOM SERVICE ---

export const fetchFloorPlan = async (): Promise<FloorPlan> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Always fetch fresh data from "DB"
      serverFloorPlan = loadFromDB(DB_KEYS.FLOOR_PLAN, INITIAL_FLOOR_PLAN);
      resolve(JSON.parse(JSON.stringify(serverFloorPlan)));
    }, 300);
  });
};

export const fetchUsers = async (): Promise<User[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      usersDB = loadFromDB(DB_KEYS.USERS, INITIAL_USERS);
      resolve(usersDB);
    }, 300);
  });
};

export const updateFloorPlan = async (newPlan: FloorPlan): Promise<{ success: boolean; serverPlan?: FloorPlan }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Fetch latest state before comparing
      const latestServerPlan: FloorPlan = loadFromDB(DB_KEYS.FLOOR_PLAN, INITIAL_FLOOR_PLAN);

      if (latestServerPlan.version >= newPlan.version) {
        resolve({ success: false, serverPlan: latestServerPlan });
      } else {
        serverFloorPlan = newPlan;
        commitToDB();
        resolve({ success: true, serverPlan: serverFloorPlan });
      }
    }, 600);
  });
};

/**
 * Check In to a room.
 */
export const checkInToRoom = async (roomId: string, userName: string, durationMinutes: number = 60): Promise<FloorPlan> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Sync from DB first
      serverFloorPlan = loadFromDB(DB_KEYS.FLOOR_PLAN, INITIAL_FLOOR_PLAN);
      
      const now = Date.now();
      const endTime = now + (durationMinutes * 60 * 1000);

      // 1. Remove user from ANY other room first
      serverFloorPlan.rooms.forEach(r => {
        r.occupants = r.occupants.filter(name => name !== userName);
      });

      // 2. Add to new room
      const roomIndex = serverFloorPlan.rooms.findIndex(r => r.id === roomId);
      if (roomIndex !== -1) {
        const room = serverFloorPlan.rooms[roomIndex];
        room.occupants.push(userName);
        room.bookings += 1;

        // Add a "Live" booking
        room.schedule.push({
          id: `live_${now}`,
          userId: userName,
          userName: userName,
          startTime: now,
          endTime: endTime,
          type: 'desk',
          title: 'Live Check-in'
        });
      }
      
      serverFloorPlan.version += 0.01; 
      serverFloorPlan.lastModified = Date.now();
      
      commitToDB(); // Persist changes

      resolve(JSON.parse(JSON.stringify(serverFloorPlan)));
    }, 400);
  });
};

export const exitRoom = async (userName: string): Promise<FloorPlan> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      serverFloorPlan = loadFromDB(DB_KEYS.FLOOR_PLAN, INITIAL_FLOOR_PLAN);

      serverFloorPlan.rooms.forEach(r => {
        r.occupants = r.occupants.filter(name => name !== userName);
      });
      
      serverFloorPlan.version += 0.01;
      serverFloorPlan.lastModified = Date.now();
      
      commitToDB();

      resolve(JSON.parse(JSON.stringify(serverFloorPlan)));
    }, 400);
  });
};

/**
 * Schedule a meeting
 */
export const scheduleMeeting = async (
    roomId: string, 
    user: User, 
    startTime: number, 
    durationMinutes: number,
    title: string
  ): Promise<{ success: boolean; plan?: FloorPlan; suggestions?: Room[] }> => {
  
  return new Promise((resolve) => {
    setTimeout(() => {
      serverFloorPlan = loadFromDB(DB_KEYS.FLOOR_PLAN, INITIAL_FLOOR_PLAN);

      const endTime = startTime + (durationMinutes * 60 * 1000);
      const roomIndex = serverFloorPlan.rooms.findIndex(r => r.id === roomId);
      
      if (roomIndex === -1) {
        resolve({ success: false }); 
        return;
      }

      const room = serverFloorPlan.rooms[roomIndex];
      const isBlocked = checkForOverlap(room.schedule, startTime, endTime);

      if (!isBlocked) {
        // SUCCESS: Book it
        room.schedule.push({
          id: `meet_${Date.now()}`,
          userId: user.email || user.name,
          userName: user.name,
          startTime,
          endTime,
          type: 'meeting',
          title
        });
        room.bookings += 2; // Higher weight for meetings
        serverFloorPlan.version += 0.01;
        serverFloorPlan.lastModified = Date.now();
        
        commitToDB();

        resolve({ success: true, plan: JSON.parse(JSON.stringify(serverFloorPlan)) });
      } else {
        // CONFLICT: Find suggestions
        const suggestions = serverFloorPlan.rooms.filter(r => 
          r.id !== roomId &&
          r.type === room.type &&
          r.capacity >= room.capacity * 0.5 && 
          !checkForOverlap(r.schedule, startTime, endTime)
        );
        resolve({ success: false, suggestions });
      }
    }, 600);
  });
};

export const simulateExternalUpdate = () => {
  serverFloorPlan = loadFromDB(DB_KEYS.FLOOR_PLAN, INITIAL_FLOOR_PLAN);

  const newVersion = Math.floor(serverFloorPlan.version) + 1;
  const newRooms = serverFloorPlan.rooms.map(r => {
    if (r.id === 'r1') {
      return { ...r, name: `Boardroom Alpha (Ext v${newVersion})` };
    }
    return r;
  });
  
  serverFloorPlan = {
    ...serverFloorPlan,
    version: newVersion,
    lastModified: Date.now(),
    rooms: newRooms
  };
  
  commitToDB();

  return serverFloorPlan;
};
