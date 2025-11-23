
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Button } from './Button';
import { authService } from '../services/mockBackend';
import { ShieldCheck, User as UserIcon, Building2, ArrowRight, Lock, Mail, CheckCircle, KeyRound, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>('EMPLOYEE');
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', password: '', email: '' });
  const [masterKey, setMasterKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await authService.login(formData.name, formData.password);
      if (result.success && result.user) {
        if (result.user.role !== activeTab) {
           setError(`Please login via the ${result.user.role === 'ADMIN' ? 'Admin' : 'Employee'} tab.`);
        } else {
           onLogin(result.user);
        }
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('System error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    if (activeTab === 'ADMIN') {
        if (masterKey !== '12345678') {
            setError('Invalid Master Admin Password. Authorization failed.');
            setIsLoading(false);
            return;
        }
    }

    try {
      const success = await authService.register(
          formData.name, 
          formData.password, 
          formData.email,
          activeTab
      );
      if (success) {
        setSuccessMsg(`Account created! Welcome email sent to ${formData.email}.`);
        setIsRegistering(false);
        setFormData(prev => ({ ...prev, password: '' }));
        setMasterKey('');
      } else {
        setError('Registration failed. Email might be in use.');
      }
    } catch (err) {
      setError('Registration error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const sent = await authService.forgotPassword(formData.email);
    setIsLoading(false);
    if (sent) {
      setForgotMsg(`Reset link sent to ${formData.email} (Check server logs)`);
      setTimeout(() => { setShowForgot(false); setForgotMsg(''); }, 3000);
    } else {
      setError('Email not found in database');
    }
  };

  const switchTab = (tab: UserRole) => {
    setActiveTab(tab);
    setIsRegistering(false);
    setError('');
    setSuccessMsg('');
    setFormData({ name: '', password: '', email: '' });
    setMasterKey('');
  };

  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
           <h2 className="text-xl font-bold mb-4">Reset Password</h2>
           {forgotMsg ? (
             <div className="p-4 bg-green-50 text-green-700 rounded-lg mb-4">{forgotMsg}</div>
           ) : (
             <>
               <p className="text-sm text-gray-500 mb-4">Enter your email address to receive a reset link.</p>
               <form onSubmit={handleForgotPassword} className="space-y-4">
                 <input 
                    name="email"
                    type="email" 
                    placeholder="Enter email..." 
                    className="w-full p-3 border rounded-lg"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                 <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowForgot(false)}>Cancel</Button>
                    <Button type="submit" isLoading={isLoading}>Send Link</Button>
                 </div>
               </form>
             </>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg transform rotate-3">
              <Building2 size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold relative z-10">Workspace Manager</h1>
          <p className="text-slate-400 text-sm mt-2 relative z-10">Intelligent Floor Plan & Booking System</p>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            onClick={() => switchTab('EMPLOYEE')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'EMPLOYEE' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserIcon size={18} /> Employee
          </button>
          <button
            onClick={() => switchTab('ADMIN')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'ADMIN' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShieldCheck size={18} /> Admin
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2 animate-shake">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}
          
          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100 flex items-center gap-2">
              <CheckCircle size={16} /> {successMsg}
            </div>
          )}

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="font-bold text-gray-800">
                  {isRegistering ? `Create ${activeTab === 'ADMIN' ? 'Admin' : 'User'} Account` : (activeTab === 'ADMIN' ? 'Admin Console' : 'Employee Portal')}
                </h3>
                <p className="text-xs text-gray-500">
                  {isRegistering 
                    ? (activeTab === 'ADMIN' ? 'Requires Main Admin authorization' : 'Join the workspace to book rooms') 
                    : (activeTab === 'ADMIN' ? 'Manage layout, view analytics & logs' : 'Book rooms, find colleagues & cafes')}
                </p>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  {isRegistering ? 'Full Name' : 'Username / Email'}
                </label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder={activeTab === 'ADMIN' ? 'admin' : 'e.g. John Doe'}
                    required
                  />
                </div>
              </div>

              {/* Email Field - Only for Registration */}
              {isRegistering && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {!isRegistering && (
                  <div className="flex justify-end mt-1">
                    <button 
                        type="button" 
                        onClick={() => setShowForgot(true)} 
                        className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
                      >
                        Forgot Password?
                      </button>
                  </div>
                )}
              </div>

              {/* Master Admin Key */}
              {isRegistering && activeTab === 'ADMIN' && (
                 <div className="animate-fadeIn bg-red-50 p-3 rounded-lg border border-red-100">
                    <label className="block text-xs font-bold text-red-700 uppercase mb-1">Master Admin Password</label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3 top-3.5 text-red-400" />
                      <input
                        name="masterKey"
                        type="password"
                        value={masterKey}
                        onChange={(e) => setMasterKey(e.target.value)}
                        className="w-full pl-10 p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all bg-white"
                        placeholder="Required for Admin access"
                        required
                      />
                    </div>
                  </div>
              )}

              <Button type="submit" className="w-full justify-center" size="lg" isLoading={isLoading}>
                {isRegistering ? 'Register' : 'Login'} <ArrowRight size={18} />
              </Button>
            </form>
            
            <div className="mt-6 text-center pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                  setSuccessMsg('');
                  setMasterKey('');
                }}
                className="text-sm text-gray-600 hover:text-blue-600 font-medium flex items-center justify-center gap-2 mx-auto"
              >
                {isRegistering ? (
                  <>Already have an account? <span className="text-blue-600">Login</span></>
                ) : (
                  <>Don't have an account? <span className="text-blue-600">Create one</span></>
                )}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};
