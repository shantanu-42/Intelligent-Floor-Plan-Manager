
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Room, FloorPlan, ConflictData, User } from '../types';
import { GRID_SIZE, CELL_SIZE, FLOORS } from '../constants';
import { fetchFloorPlan, updateFloorPlan, simulateExternalUpdate, fetchUsers } from '../services/mockBackend';
import { Button } from './Button';
import { Wifi, WifiOff, Save, AlertTriangle, RefreshCw, LayoutGrid, Users, Zap, Coffee, Monitor, Layers, Gamepad2, Bell, Database, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export const FloorPlanEditor: React.FC = () => {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [activeFloorId, setActiveFloorId] = useState<string>('ground');
  const [isOnline, setIsOnline] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<boolean>(false);
  const [conflict, setConflict] = useState<ConflictData | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // User DB Modal State
  const [showUsers, setShowUsers] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  
  const isEditingRef = useRef(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
       if (isOnline && !pendingChanges && !conflict) {
          silentRefresh();
       }
    }, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, pendingChanges, conflict]);

  const loadData = async () => {
    try {
      const plan = await fetchFloorPlan();
      setFloorPlan(plan);
      setConflict(null);
      setPendingChanges(false);
      isEditingRef.current = false;
    } catch (err) {
      setError("Failed to load floor plan.");
    }
  };

  const silentRefresh = async () => {
     try {
        const plan = await fetchFloorPlan();
        setFloorPlan(prev => {
           if (isEditingRef.current) return prev;
           if (prev && plan.version > prev.version) {
              return plan;
           }
           return prev;
        });
     } catch(e) { console.log("Silent refresh fail"); }
  };

  const handleOpenUsers = async () => {
    const users = await fetchUsers();
    setUsersList(users);
    setShowUsers(true);
  };

  const filteredRooms = useMemo(() => {
    return floorPlan?.rooms.filter(r => r.floorId === activeFloorId) || [];
  }, [floorPlan, activeFloorId]);

  const floorStats = useMemo(() => {
    if (!floorPlan) return { totalCapacity: 0, totalOccupants: 0, occupancyRate: 0, roomCount: 0 };
    
    const floorRooms = floorPlan.rooms.filter(r => r.floorId === activeFloorId);
    
    const totalCapacity = floorRooms.reduce((acc, r) => acc + r.capacity, 0);
    const totalOccupants = floorRooms.reduce((acc, r) => acc + (r.occupants?.length || 0), 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupants / totalCapacity) * 100) : 0;

    return { totalCapacity, totalOccupants, occupancyRate, roomCount: floorRooms.length };
  }, [floorPlan, activeFloorId]);

  const activeAlerts = useMemo(() => {
      if (!floorPlan) return [];
      return floorPlan.rooms.filter(r => {
          if (!r.occupancyThreshold) return false;
          const pct = r.capacity > 0 ? (r.occupants.length / r.capacity) * 100 : 0;
          return pct >= r.occupancyThreshold;
      });
  }, [floorPlan]);

  const pieData = useMemo(() => {
     if (!floorPlan) return [];
     return [
       { name: 'Occupied', value: floorStats.totalOccupants },
       { name: 'Available', value: floorStats.totalCapacity - floorStats.totalOccupants }
     ];
  }, [floorStats]);

  const COLORS = ['#ef4444', '#10b981'];

  const resolveConflict = (strategy: 'accept_remote' | 'force_local') => {
    if (!conflict) return;

    if (strategy === 'accept_remote') {
      setFloorPlan(conflict.serverVersion);
      setPendingChanges(false);
      setConflict(null);
      isEditingRef.current = false;
      setSuccessMsg("Synced with server version.");
    } else {
      const forcedPlan = {
        ...floorPlan!,
        version: conflict.serverVersion.version + 1,
        lastModified: Date.now()
      };
      setFloorPlan(forcedPlan);
      setConflict(null);
      handleSave(forcedPlan);
    }
  };

  const handleSave = async (planToSave = floorPlan) => {
    if (!planToSave) return;
    
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    if (!isOnline) {
      setPendingChanges(true);
      isEditingRef.current = true;
      setIsSaving(false);
      setSuccessMsg("Offline mode: Changes saved locally. Will sync when online.");
      return;
    }

    try {
      const nextVersion = planToSave.version + 1;
      const payload = { ...planToSave, version: nextVersion, lastModified: Date.now() };
      const result = await updateFloorPlan(payload);

      if (result.success) {
        setFloorPlan(result.serverPlan!);
        setPendingChanges(false);
        isEditingRef.current = false;
        setSuccessMsg("Successfully saved to server.");
      } else {
        setConflict({
          localVersion: planToSave,
          serverVersion: result.serverPlan!
        });
      }
    } catch (err) {
      setError("Network error while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateRoom = (updatedRoom: Room) => {
    if (!floorPlan) return;
    const newRooms = floorPlan.rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
    setFloorPlan({ ...floorPlan, rooms: newRooms });
    setPendingChanges(true); 
    isEditingRef.current = true; 
  };

  if (!floorPlan) return <div className="p-8 text-center animate-pulse">Loading Admin Dashboard...</div>;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
      {/* Admin Toolbar */}
      <div className="p-4 border-b border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-gray-50">
        <div className="flex items-center gap-4 w-full xl:w-auto">
          <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Live Control Center</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> Live Syncing</span>
              <span>•</span>
              <span className={pendingChanges ? "text-amber-600 font-medium" : "text-green-600"}>
                {pendingChanges ? "Unsaved Changes" : "Monitoring Mode"}
              </span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6 ml-6 px-6 border-l border-gray-200">
             <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Floor Occupancy</div>
                <div className="font-bold text-gray-800 text-lg">{floorStats.occupancyRate}%</div>
             </div>
             <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">People</div>
                <div className="font-bold text-gray-800 text-lg text-blue-600">{floorStats.totalOccupants}</div>
             </div>
             <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Active Alerts</div>
                <div className={`font-bold text-lg ${activeAlerts.length > 0 ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}>
                    {activeAlerts.length}
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            {isOnline ? 'Online' : 'Offline'}
          </button>

          <Button variant="secondary" size="sm" onClick={handleOpenUsers}>
             <Database size={16} /> Users DB
          </Button>
          
          <Button variant="secondary" size="sm" onClick={() => { simulateExternalUpdate(); silentRefresh(); }}>
            <Zap size={16} /> Sim Conflict
          </Button>

          <Button 
            onClick={() => handleSave()} 
            size="sm"
            disabled={!pendingChanges && !conflict}
            isLoading={isSaving}
          >
            <Save size={16} /> {isOnline ? 'Sync' : 'Save Locally'}
          </Button>
        </div>
      </div>

      {/* Messages */}
      {(error || successMsg || conflict) && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          {error && <div className="text-red-600 text-sm flex items-center gap-2"><AlertTriangle size={16} /> {error}</div>}
          {successMsg && <div className="text-green-600 text-sm flex items-center gap-2"><RefreshCw size={16} /> {successMsg}</div>}
          
          {conflict && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 shrink-0 mt-1" size={20} />
                <div className="flex-1">
                  <h3 className="font-bold text-red-800">Sync Conflict</h3>
                  <div className="flex gap-3 mt-3">
                    <Button size="sm" variant="danger" onClick={() => resolveConflict('force_local')}>Force Local</Button>
                    <Button size="sm" variant="secondary" onClick={() => resolveConflict('accept_remote')}>Pull Server</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FLOOR SELECTOR */}
      <div className="bg-white border-b border-gray-200 px-4 flex gap-4">
         {FLOORS.map(f => (
             <button
                key={f.id}
                onClick={() => { setActiveFloorId(f.id); setSelectedRoom(null); }}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeFloorId === f.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
             >
                <Layers size={14} /> {f.name}
             </button>
         ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto hidden md:flex flex-col gap-6">
          
          {/* Active Alerts Panel */}
          {activeAlerts.length > 0 && (
             <div className="bg-red-50 p-4 rounded-lg border border-red-200 shadow-sm">
                 <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Bell size={12} className="animate-bounce" /> Occupancy Alerts ({activeAlerts.length})
                 </h3>
                 <ul className="space-y-2">
                    {activeAlerts.map(alertRoom => (
                        <li key={alertRoom.id} className="text-xs bg-white p-2 rounded border border-red-100 flex justify-between items-center">
                           <span className="font-medium text-gray-700 truncate">{alertRoom.name}</span>
                           <span className="text-red-600 font-bold">
                               {alertRoom.occupants.length}/{alertRoom.capacity} ({Math.round((alertRoom.occupants.length/alertRoom.capacity)*100)}%)
                           </span>
                        </li>
                    ))}
                 </ul>
             </div>
          )}

          {/* Pie Chart */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Floor Utilization</h3>
            <div className="h-40 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="block text-xl font-bold text-gray-800">{floorStats.totalOccupants}</span>
                <span className="block text-[8px] text-gray-400 uppercase">On Floor</span>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Room Editor</h3>
            {selectedRoom ? (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Room Name</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    value={selectedRoom.name}
                    onChange={(e) => updateRoom({ ...selectedRoom, name: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Capacity</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={selectedRoom.capacity}
                      onChange={(e) => updateRoom({ ...selectedRoom, capacity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        value={selectedRoom.type}
                        onChange={(e) => updateRoom({ ...selectedRoom, type: e.target.value as any })}
                    >
                        <option value="meeting">Meeting</option>
                        <option value="desk">Desk Area</option>
                        <option value="cafeteria">Cafeteria</option>
                        <option value="recreation">Recreation</option>
                        <option value="common">Common</option>
                    </select>
                  </div>
                </div>
                
                {/* Alert Threshold Config */}
                <div className="bg-red-50 p-3 rounded-md border border-red-100">
                    <label className="block text-xs font-bold text-red-800 mb-1 flex items-center gap-1">
                        <Bell size={10} /> Occupancy Alert Threshold (%)
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      max="200"
                      placeholder="e.g. 80"
                      className="w-full p-2 border border-red-200 rounded-md text-sm bg-white"
                      value={selectedRoom.occupancyThreshold || ''}
                      onChange={(e) => updateRoom({ ...selectedRoom, occupancyThreshold: parseInt(e.target.value) || undefined })}
                    />
                    <p className="text-[10px] text-red-600 mt-1">
                        Alerts when occupancy reaches this % of capacity.
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Features (Comma sep)</label>
                    <input 
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      placeholder="pc, projector..."
                      value={selectedRoom.features.join(', ')}
                      onChange={(e) => updateRoom({ ...selectedRoom, features: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    />
                </div>

                <div className="bg-white p-3 rounded-md border border-gray-200 mt-2">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-gray-700">Occupants</span>
                      <span className="text-[10px] text-gray-400">{selectedRoom.occupants.length} current</span>
                   </div>
                   {selectedRoom.occupants.length > 0 ? (
                      <ul className="space-y-1">
                        {selectedRoom.occupants.map((person, idx) => (
                           <li key={idx} className="text-xs bg-gray-50 p-1.5 rounded text-gray-700 flex items-center gap-2">
                              <Users size={10} /> {person}
                           </li>
                        ))}
                      </ul>
                   ) : <span className="text-xs text-gray-400 italic">Empty</span>}
                </div>

                {/* Future Scheduled Meetings */}
                <div className="mt-6 border-t border-gray-200 pt-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Calendar size={12} /> Future Schedule
                    </h3>
                    {selectedRoom.schedule.filter(b => b.endTime > Date.now()).length > 0 ? (
                        <div className="space-y-2">
                            {selectedRoom.schedule
                                .filter(b => b.endTime > Date.now())
                                .sort((a, b) => a.startTime - b.startTime)
                                .map(booking => (
                                    <div key={booking.id} className="bg-white border border-gray-200 p-2.5 rounded-md shadow-sm">
                                        <div className="font-bold text-sm text-gray-800">{booking.title || 'Meeting'}</div>
                                        <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                                            <span>{new Date(booking.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(booking.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{booking.userName}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 italic text-center py-2">No upcoming meetings scheduled.</p>
                    )}
                </div>

              </div>
            ) : (
              <div className="text-gray-400 text-sm text-center mt-10 p-4 border-2 border-dashed border-gray-200 rounded-lg">
                Select a room on the grid to edit.
              </div>
            )}
          </div>
        </div>

        {/* Visual Grid */}
        <div className="flex-1 bg-slate-100 p-8 overflow-auto relative flex justify-center">
          <div 
            className="bg-white shadow-lg relative border border-gray-300 transition-all"
            style={{ 
              width: GRID_SIZE * CELL_SIZE, 
              height: GRID_SIZE * CELL_SIZE,
              backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
              backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
            }}
          >
            {filteredRooms.map((room) => {
               const occupancy = room.occupants ? room.occupants.length : 0;
               const pct = room.capacity > 0 ? (occupancy / room.capacity) * 100 : 0;
               const isFull = occupancy >= room.capacity;
               const isAlert = room.occupancyThreshold && pct >= room.occupancyThreshold;
               const hasPC = room.features.includes('pc');
               
               let bgColor = 'bg-white';
               let borderColor = 'border-slate-300';
               let icon = room.type === 'meeting' ? 'M' : 'D';

               if (room.type === 'cafeteria') {
                 bgColor = 'bg-orange-50';
                 borderColor = 'border-orange-200';
                 icon = '☕';
               } else if (room.type === 'common') {
                 bgColor = 'bg-gray-50';
                 icon = 'C';
               } else if (room.type === 'recreation') {
                 bgColor = 'bg-green-50';
                 borderColor = 'border-green-200';
                 icon = '🎮';
               } else if (hasPC) {
                 bgColor = 'bg-indigo-50';
                 borderColor = 'border-indigo-200';
               }

               // Alert Override
               if (isAlert) {
                   borderColor = 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
                   bgColor = 'bg-red-50';
               }

               if (selectedRoom?.id === room.id) {
                 borderColor = 'border-blue-600';
                 bgColor = 'bg-blue-50 ring-4 ring-blue-100 z-20';
               }

               return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`absolute border-2 transition-all cursor-pointer group flex flex-col items-center justify-between p-1.5 text-center overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02]
                    ${borderColor} ${bgColor}
                  `}
                  style={{
                    left: room.x * CELL_SIZE,
                    top: room.y * CELL_SIZE,
                    width: room.width * CELL_SIZE,
                    height: room.height * CELL_SIZE,
                  }}
                >
                  <div className="w-full flex justify-between items-start">
                     <span className="text-[10px] font-bold text-gray-400">{icon}</span>
                     <div className="flex gap-1">
                        {isAlert && <Bell size={12} className="text-red-600 animate-pulse fill-current" />}
                        {hasPC && <Monitor size={10} className="text-indigo-600" />}
                        {room.features.includes('tt_table') && <Gamepad2 size={10} className="text-green-600" />}
                     </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center w-full">
                    <span className={`text-xs font-bold leading-tight truncate w-full px-1 ${isAlert ? 'text-red-700' : 'text-gray-800'}`}>
                        {room.name}
                    </span>
                  </div>

                  <div className="flex gap-0.5 justify-center flex-wrap w-full px-1 mb-1 h-3 overflow-hidden">
                     {Array.from({ length: Math.min(12, occupancy) }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${isFull ? 'bg-red-400' : 'bg-blue-400'} animate-pulse`}></div>
                     ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Database Modal */}
      {showUsers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Database className="text-blue-600" size={24}/> User Database</h2>
                    <button onClick={() => setShowUsers(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors">
                        <WifiOff size={20} className="rotate-45"/>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto bg-slate-50">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Stored Password</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersList.map((u, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{u.password}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-gray-400 mt-3 text-center">
                        This view simulates a database administrator console. In a real production app, passwords would be hashed.
                    </p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
