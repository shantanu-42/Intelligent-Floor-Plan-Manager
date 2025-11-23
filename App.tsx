import React, { useState } from 'react';
import { User } from './types';
import { FloorPlanEditor } from './components/FloorPlanEditor';
import { BookingSystem } from './components/BookingSystem';
import { Login } from './components/Login';
import { ShieldCheck, User as UserIcon, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  
  // If not logged in, show Login Screen
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen flex flex-col text-slate-800 bg-slate-50">
      {/* Navigation */}
      <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xl ${user.role === 'ADMIN' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                {user.role === 'ADMIN' ? 'A' : 'E'}
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight block leading-none">IntelligentFloor</span>
                <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">{user.role === 'ADMIN' ? 'Admin Console' : 'Employee Portal'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  Welcome, <span className="font-bold text-white">{user.name}</span>
               </div>
               
               <button
                  onClick={() => setUser(null)}
                  className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 hover:text-red-400 transition-all text-slate-400"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-[calc(100vh-8rem)]">
          {user.role === 'ADMIN' ? (
            <FloorPlanEditor />
          ) : (
            <BookingSystem user={user} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-500">
            Intelligent Floor Plan System - Demo Implementation • React 18 • TypeScript • Tailwind
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;