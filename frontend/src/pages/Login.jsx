import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronRight, ShieldCheck } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Use environment variable for production (Render), fallback to localhost for dev
      const API_URL = import.meta.env.VITE_API_URL || 'https://dira-crm-hrm.onrender.com';

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      // Save JWT token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Route based on real database role
      if (data.user.role === 'ADMIN') navigate('/admin');
      else if (data.user.role === 'EMPLOYEE') navigate('/employee');
      else navigate('/client');

    } catch (err) {
      setError('Cannot connect to server. Ensure backend is running.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-10">
          <div className="mx-auto h-20 w-20 mb-6 flex items-center justify-center">
            <img
              src={logo}
              alt="DIRA Marketing Agency"
              className="h-full w-full object-contain"
            />
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">
            Nexa<span className="text-blue-500">Sync</span>
          </h2>
          <p className="mt-3 text-base text-slate-400 font-medium">
            Enterprise HRM & CRM Platform
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl py-10 px-8 shadow-2xl sm:rounded-3xl border border-white/20">

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-xl p-3 flex items-center text-red-200 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Work Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-12 sm:text-sm bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-500"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-12 sm:text-sm bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all transform hover:-translate-y-0.5"
              >
                Access Portal
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <p className="text-xs text-blue-200 text-center leading-relaxed font-medium">
                <span className="font-bold text-blue-400">Database Seed Credentials:</span><br />
                Admin: <code className="bg-slate-900 px-1 text-blue-300">admin@dira.com</code><br />
                Employee: <code className="bg-slate-900 px-1 text-blue-300">employee@dira.com</code><br />
                Client: <code className="bg-slate-900 px-1 text-blue-300">client@dira.com</code><br />
                Password for all: <code className="bg-slate-900 px-1 text-blue-300">password123</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
