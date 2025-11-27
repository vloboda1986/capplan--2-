
import React, { useState } from 'react';
import { AppUser, UserRole } from '../types';
import { Lock, Mail, LogIn, User, Shield, Briefcase, Code } from 'lucide-react';
import { Avatar } from './Avatar';

interface LoginProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (user) {
        onLogin(user);
      } else {
        setError('Invalid email address. Please use one of the test accounts.');
        setLoading(false);
      }
    }, 600);
  };

  const handleQuickLogin = (user: AppUser) => {
    setEmail(user.email || '');
    setPassword('password123');
    setError('');
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.Admin: return <Shield size={14} className="text-purple-600" />;
      case UserRole.ProjectManager: return <Briefcase size={14} className="text-indigo-600" />;
      case UserRole.TeamMate: return <Code size={14} className="text-slate-600" />;
    }
  };

  // Group users by role for the quick login section
  const admins = users.filter(u => u.role === UserRole.Admin);
  const pms = users.filter(u => u.role === UserRole.ProjectManager);
  const devs = users.filter(u => u.role === UserRole.TeamMate);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-slate-900 overflow-hidden">
      {/* Background Image & Blur Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        }}
      ></div>
      <div className="absolute inset-0 z-10 bg-slate-900/40 backdrop-blur-md"></div>

      {/* Login Card */}
      <div className="relative z-20 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden m-4 animate-in fade-in zoom-in-95 duration-300">

        {/* Left Side: Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <div className="mb-4 mx-auto md:mx-0">
              <img src="/logo.png" alt="AlloCap Logo" className="h-16 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Sign in to manage team capacity and projects.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-800"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100 flex items-center">
                <AlertCircle size={14} className="mr-2" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn size={18} className="ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account? Ask your administrator to invite you.
            </p>
          </div>
        </div>

        {/* Right Side: Quick Login / Mock Data */}
        <div className="bg-slate-50 p-8 md:p-12 border-l border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Test Credentials</h3>
          <p className="text-sm text-slate-500 mb-6">Click a user profile to auto-fill credentials for testing.</p>

          <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">

            {/* Admins */}
            <div>
              <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3 flex items-center">
                <Shield size={12} className="mr-1" /> Admin
              </h4>
              <div className="space-y-2">
                {admins.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleQuickLogin(user)}
                    className="w-full flex items-center p-3 bg-white border border-slate-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all text-left group"
                  >
                    <Avatar name={user.name} className="w-8 h-8 text-[10px] mr-3" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 text-sm">{user.name}</div>
                      <div className="text-xs text-slate-400 truncate">{user.email}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-purple-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* PMs */}
            <div>
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center">
                <Briefcase size={12} className="mr-1" /> Project Manager
              </h4>
              <div className="space-y-2">
                {pms.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleQuickLogin(user)}
                    className="w-full flex items-center p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                  >
                    <Avatar name={user.name} className="w-8 h-8 text-[10px] mr-3" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 text-sm">{user.name}</div>
                      <div className="text-xs text-slate-400 truncate">{user.email}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Team Mates */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                <Code size={12} className="mr-1" /> Team Mate
              </h4>
              <div className="space-y-2">
                {devs.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleQuickLogin(user)}
                    className="w-full flex items-center p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-400 hover:shadow-md transition-all text-left group"
                  >
                    <Avatar name={user.name} className="w-8 h-8 text-[10px] mr-3" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 text-sm">{user.name}</div>
                      <div className="text-xs text-slate-400 truncate">{user.email}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="absolute bottom-4 text-white/50 text-xs">
        &copy; {new Date().getFullYear()} CapPlan AI. All rights reserved.
      </div>
    </div>
  );
};

// Helper icons for the file
import { ChevronRight, AlertCircle } from 'lucide-react';

export default Login;
