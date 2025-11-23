
import React, { useState, useMemo, useEffect } from 'react';
import { Room, User } from '../types';
import { Button } from './Button';
import { fetchFloorPlan, checkInToRoom, exitRoom, scheduleMeeting } from '../services/mockBackend';
import { FLOORS } from '../constants';
import { Users, CheckCircle, Search, Star, LogOut, Coffee, MapPin, RefreshCw, Monitor, Laptop, Clock, Calendar, Gamepad2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BookingSystemProps {
  user: User;
}

export const BookingSystem: React.FC<BookingSystemProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'desk' | 'meeting'>('desk');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Desk Mode State
  const [needsPC, setNeedsPC] = useState(false);
  const [workDuration, setWorkDuration] = useState(4); // Hours
  
  // Meeting Mode State
  const [meetingDate, setMeetingDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [meetingTime, setMeetingTime] = useState<string>("10:00");
  const [meetingDuration, setMeetingDuration] = useState<number>(60);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [attendees, setAttendees] = useState<number>(2);
  const [meetingResult, setMeetingResult] = useState<{success?: boolean, msg?: string, suggestions?: Room[]} | null>(null);

  const currentRoom = useMemo(() => {
    return rooms.find(r => r.occupants.includes(user.name));
  }, [rooms, user.name]);

  const loadData = async () => {
    const plan = await fetchFloorPlan();
    setRooms(plan.rooms);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- LOGIC: FIND DESK ---
  const deskRecommendations = useMemo(() => {
    // Base allowed types for working
    let allowedTypes = ['desk', 'common'];
    
    // If NOT needing a PC (Laptop user), they can work in Cafeteria too
    if (!needsPC) {
        allowedTypes.push('cafeteria');
    }
    
    let filtered = rooms.filter(r => allowedTypes.includes(r.type));
    
    if (selectedFloor !== 'all') {
      filtered = filtered.filter(r => r.floorId === selectedFloor);
    }

    if (needsPC) {
      // Must have PC. Priority to PC rooms.
      filtered = filtered.filter(r => r.features.includes('pc'));
    } else {
      // Laptop user. Priority to NON-PC rooms to save resources.
      filtered = filtered.sort((a, b) => {
        const aHasPC = a.features.includes('pc') ? 1 : 0;
        const bHasPC = b.features.includes('pc') ? 1 : 0;
        // Secondary sort: Cafeterias are good for laptops but maybe desks are better?
        // Let's keep it simple: Avoid PCs first.
        return aHasPC - bHasPC;
      });
    }

    return filtered.map(r => {
        const occupancy = r.occupants.length;
        const isFull = occupancy >= r.capacity;
        
        // Check schedule for "Next Available" if full
        let nextAvailableStr = "";
        if (isFull && r.schedule.length > 0) {
           const currentBookings = r.schedule.filter(b => b.endTime > Date.now());
           if (currentBookings.length > 0) {
             const nextFree = Math.min(...currentBookings.map(b => b.endTime));
             const date = new Date(nextFree);
             nextAvailableStr = `Free at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
           }
        }

        return { ...r, isFull, nextAvailableStr };
      });
  }, [rooms, selectedFloor, needsPC]);

  // --- ACTIONS ---

  const handleCheckIn = async (roomId: string) => {
    const duration = needsPC ? workDuration * 60 : 240; // minutes
    setProcessing(true);
    try {
      await checkInToRoom(roomId, user.name, duration);
      loadData();
    } catch (e) {
      alert("Error checking in");
    } finally {
      setProcessing(false);
    }
  };

  const handleExit = async () => {
    if (!currentRoom) return;
    setProcessing(true);
    try {
      await exitRoom(user.name);
      loadData();
    } catch (e) {
      alert("Error exiting room");
    } finally {
      setProcessing(false);
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setMeetingResult(null);

    const startDateTime = new Date(`${meetingDate}T${meetingTime}`).getTime();
    if (startDateTime < Date.now()) {
        setMeetingResult({ success: false, msg: "Cannot schedule in the past."});
        setProcessing(false);
        return;
    }

    // Find Best Fit Room
    let potentialRooms = rooms.filter(r => r.type === 'meeting');
    
    if (selectedFloor !== 'all') {
        potentialRooms = potentialRooms.filter(r => r.floorId === selectedFloor);
    }

    // 1. Filter by Capacity (Must fit attendees)
    potentialRooms = potentialRooms.filter(r => r.capacity >= attendees);

    // 2. Sort by "Best Fit" (Capacity - Attendees). Closest to 0 is best.
    potentialRooms.sort((a, b) => (a.capacity - attendees) - (b.capacity - attendees));

    if (potentialRooms.length === 0) {
        setMeetingResult({ success: false, msg: "No rooms available with sufficient capacity." });
        setProcessing(false);
        return;
    }

    // Try to book the first available one in the sorted list
    let booked = false;
    for (const room of potentialRooms) {
        const result = await scheduleMeeting(room.id, user, startDateTime, meetingDuration, meetingTitle);
        if (result.success) {
            setMeetingResult({ success: true, msg: `Booked ${room.name} successfully! (Best fit for ${attendees} people)` });
            loadData();
            booked = true;
            break;
        }
    }

    if (!booked) {
        setMeetingResult({ 
            success: false, 
            msg: "Matching rooms are booked at this time. Suggestions:", 
            suggestions: potentialRooms.slice(0, 3) 
        });
    }
    setProcessing(false);
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Workspace Data...</div>;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 p-2">
      {/* Left Panel: Controls */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* CURRENT STATUS */}
        <div className={`p-6 rounded-xl shadow-md border transition-all ${currentRoom ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-1">Current Status</h2>
              {currentRoom ? (
                 <div className="flex items-center gap-3">
                    <MapPin className="text-indigo-600" size={24} />
                    <div>
                      <h3 className="text-xl font-bold text-indigo-900">Checked in: {currentRoom.name}</h3>
                      <p className="text-xs text-indigo-600">
                        {currentRoom.features.includes('pc') ? 'System PC Allocated' : 'Standard Work Zone'}
                      </p>
                    </div>
                 </div>
              ) : (
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                     <Users size={16} />
                   </div>
                   <h3 className="text-xl font-bold text-gray-400">Not checked in</h3>
                </div>
              )}
            </div>
            {currentRoom && (
              <Button variant="danger" onClick={handleExit} isLoading={processing}>
                <LogOut size={16} /> Check Out
              </Button>
            )}
          </div>
        </div>

        {/* MAIN BOOKING UI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
          
          {/* TABS */}
          <div className="flex border-b border-gray-100">
             <button 
               onClick={() => setActiveTab('desk')}
               className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 ${activeTab === 'desk' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
             >
               <Monitor size={18} /> Find a Desk
             </button>
             <button 
               onClick={() => setActiveTab('meeting')}
               className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 ${activeTab === 'meeting' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
             >
               <Calendar size={18} /> Schedule Meeting
             </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
             
             {/* FLOORS FILTER */}
             <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase mr-2">Floor:</span>
                <button 
                  onClick={() => setSelectedFloor('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedFloor === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                  ALL
                </button>
                {FLOORS.map(f => (
                   <button 
                     key={f.id}
                     onClick={() => setSelectedFloor(f.id)}
                     className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${selectedFloor === f.id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}
                   >
                     {f.name}
                   </button>
                ))}
             </div>

             {/* DESK FINDER VIEW */}
             {activeTab === 'desk' && (
               <div className="animate-fadeIn">
                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                    <h3 className="text-sm font-bold text-blue-900 mb-3">Work Preferences</h3>
                    <div className="flex flex-col sm:flex-row gap-6">
                       <label className="flex items-center gap-3 cursor-pointer">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${!needsPC ? 'border-blue-600 bg-blue-600' : 'border-gray-400 bg-white'}`}>
                             {!needsPC && <CheckCircle size={12} className="text-white" />}
                          </div>
                          <input type="radio" name="wtype" className="hidden" checked={!needsPC} onChange={() => setNeedsPC(false)} />
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Laptop size={16} /> My Laptop</span>
                       </label>

                       <label className="flex items-center gap-3 cursor-pointer">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${needsPC ? 'border-blue-600 bg-blue-600' : 'border-gray-400 bg-white'}`}>
                             {needsPC && <CheckCircle size={12} className="text-white" />}
                          </div>
                          <input type="radio" name="wtype" className="hidden" checked={needsPC} onChange={() => setNeedsPC(true)} />
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Monitor size={16} /> Need System PC</span>
                       </label>
                    </div>

                    {needsPC ? (
                       <div className="mt-4 pt-4 border-t border-blue-200 animate-fadeIn">
                          <label className="block text-xs font-bold text-blue-800 mb-2">Tentative Duration (required for PC)</label>
                          <div className="flex items-center gap-4">
                             <input 
                               type="range" 
                               min="1" max="8" 
                               value={workDuration} 
                               onChange={(e) => setWorkDuration(parseInt(e.target.value))}
                               className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                             />
                             <span className="font-bold text-blue-900 w-20 text-right">{workDuration} hrs</span>
                          </div>
                          <p className="text-[10px] text-blue-600 mt-1">Helps schedule next person.</p>
                       </div>
                    ) : (
                        <div className="mt-2 pt-2 text-[10px] text-blue-600 animate-fadeIn">
                            * Includes Desks, Common Areas, and Cafeterias.
                        </div>
                    )}
                 </div>

                 <div className="space-y-3">
                    {deskRecommendations.map(room => (
                      <div key={room.id} className={`border rounded-lg p-3 flex justify-between items-center ${room.isFull ? 'bg-gray-50 border-gray-200 opacity-80' : 'bg-white hover:border-blue-400 border-gray-200'}`}>
                         <div>
                            <div className="flex items-center gap-2">
                               <h4 className="font-bold text-gray-800">{room.name}</h4>
                               {room.features.includes('pc') && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded border border-indigo-200 font-bold">PC</span>}
                               {room.type === 'cafeteria' && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 rounded border border-orange-200 font-bold">Cafe</span>}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                               {room.occupants.length}/{room.capacity} occupied
                               {room.nextAvailableStr && <span className="ml-2 text-orange-600 font-bold">• {room.nextAvailableStr}</span>}
                            </div>
                         </div>
                         <Button 
                            size="sm" 
                            disabled={room.isFull || !!currentRoom}
                            onClick={() => handleCheckIn(room.id)}
                            variant={room.isFull ? "secondary" : "primary"}
                         >
                            {room.isFull ? "Full" : "Check In"}
                         </Button>
                      </div>
                    ))}
                    {deskRecommendations.length === 0 && <div className="text-center text-gray-400 py-8">No suitable zones found.</div>}
                 </div>
               </div>
             )}

             {/* MEETING SCHEDULER VIEW */}
             {activeTab === 'meeting' && (
               <div className="animate-fadeIn">
                  <form onSubmit={handleScheduleMeeting} className="space-y-4 mb-6">
                      <div>
                         <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Meeting Title</label>
                         <input 
                            required
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded text-sm" 
                            placeholder="Team Sync..."
                            value={meetingTitle}
                            onChange={e => setMeetingTitle(e.target.value)}
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date</label>
                            <input 
                                required
                                type="date" 
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                value={meetingDate}
                                onChange={e => setMeetingDate(e.target.value)}
                            />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Start Time</label>
                            <input 
                                required
                                type="time" 
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                value={meetingTime}
                                onChange={e => setMeetingTime(e.target.value)}
                            />
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Attendees</label>
                             <div className="relative">
                                <Users size={16} className="absolute left-2 top-2.5 text-gray-400" />
                                <input 
                                    type="number" min="1" max="50"
                                    className="w-full pl-8 p-2 border border-gray-300 rounded text-sm"
                                    value={attendees}
                                    onChange={e => setAttendees(parseInt(e.target.value) || 1)}
                                />
                             </div>
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Duration ({meetingDuration}m)</label>
                             <input 
                                type="range" min="15" max="120" step="15"
                                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer mt-2"
                                value={meetingDuration}
                                onChange={e => setMeetingDuration(parseInt(e.target.value))}
                             />
                          </div>
                      </div>

                      <div className="bg-purple-50 p-3 rounded text-xs text-purple-800">
                         System will prioritize rooms that best fit {attendees} people to save larger rooms for larger groups.
                      </div>

                      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" isLoading={processing}>
                         Find Best Room
                      </Button>
                  </form>

                  {/* MEETING RESULTS */}
                  {meetingResult && (
                      <div className={`p-4 rounded-lg border text-sm ${meetingResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                         <p className="font-bold flex items-center gap-2">
                            {meetingResult.success ? <CheckCircle size={16}/> : <LogOut size={16} className="rotate-45"/>}
                            {meetingResult.msg}
                         </p>
                         
                         {!meetingResult.success && meetingResult.suggestions && (
                            <div className="mt-3">
                               <p className="text-xs uppercase font-bold text-red-600 mb-2">Alternatives:</p>
                               <div className="space-y-2">
                                  {meetingResult.suggestions.length > 0 ? meetingResult.suggestions.map(room => (
                                     <div key={room.id} className="bg-white p-2 rounded border border-red-100 flex justify-between items-center shadow-sm">
                                        <span>{room.name} ({room.floorId} floor)</span>
                                        <span className="text-xs text-gray-500 font-medium">Cap: {room.capacity}</span>
                                     </div>
                                  )) : <p className="text-xs italic">No alternative rooms found for this slot. Try changing time.</p>}
                               </div>
                            </div>
                         )}
                      </div>
                  )}
               </div>
             )}

          </div>
        </div>
      </div>

      {/* Right Panel: Analytics */}
      <div className="w-full lg:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col hidden lg:flex">
        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Star className="text-yellow-500" /> Zone Popularity
        </h3>
        <p className="text-sm text-gray-500 mb-6">
           Cumulative bookings over time.
        </p>

        <div className="flex-1 w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rooms.filter(r => r.type === 'meeting' || r.features.includes('pc') || r.type === 'recreation')} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100} 
                tick={{fontSize: 10}} 
                interval={0}
              />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="bookings" radius={[0, 4, 4, 0]} barSize={20}>
                {rooms.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.type === 'recreation' ? '#10b981' : (entry.features.includes('pc') ? '#8b5cf6' : '#3b82f6')} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};