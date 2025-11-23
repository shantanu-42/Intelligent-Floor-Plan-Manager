# 🏢 Intelligent Floor Plan Manager

A robust, full-stack capable *frontend application* designed to optimize workplace space usage.  
It provides a *dual-interface system* for:

- 👨‍💼 *Administrators* – to manage floor layouts  
- 👩‍💻 *Employees* – to book desks or meeting rooms using intelligent recommendations  

---

## 🚀 Key Features

### 👨‍💻 For Administrators (Control Center)

- *Live Floor Plan Editor*  
  Visual grid-based editor to modify:  
  - Room names  
  - Capacities  
  - Room types  
  - Features  

- *Real-time Occupancy Monitoring*  
  - Visual heatmaps of occupied rooms  
  - Percentage-based alerts for overcrowding  

- *Concurrent Editing Protection*  
  - Simulates optimistic locking & version control  
  - Prevents admins from overwriting each other’s changes  
  - Includes *"Simulate Conflict"* developer tool  

- *Offline Mode*  
  - Changes made offline are queued  
  - Automatically synced when connection is restored  

- *User Database Viewer*  
  - Built-in modal to view registered users & roles  
  - Simulated backend behavior  

---

### 🏢 For Employees (Booking Portal)

- *Smart Booking Engine*  
  - Suggests optimal rooms based on:
    - Number of attendees  
    - Equipment needs (PC/Mac)  
    - Selected time slot  
  - Focuses on space efficiency  

- *Desk Finder*  
  - Filters workspaces by:
    - Laptop-friendly zones  
    - PC-required zones  

- *Visual Status Board*  
  - Interactive floor map showing real-time availability  

- *Automated Notifications*  
  - Simulated email notifications after booking  

---

## 🛠 Tech Stack

| Layer | Technology |
|------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Lucide React |
| Charts | Recharts |
| Visualization | Custom Grid Engine |
| State Management | LocalStorage (Mock Backend) |

---

## 📸 Highlights

- *Conflict Resolution*  
  Handles stale data scenarios where server version is newer than client version  

- *Data Persistence*  
  Bookings, users, and floor plans persist across reloads using LocalStorage  
  (Acts like a mock backend database system)

---

## 💻 Run Locally

### Prerequisites
- Node.js installed

### Steps

1. Install dependencies:
   ```bash
   npm install
2. Run the code
   ```bash
   npm run dev

---
### Demo video Link
https://drive.google.com/drive/folders/1dvChUovQjZaa0W65xJnGLn5aJpoePLeo?usp=sharing
