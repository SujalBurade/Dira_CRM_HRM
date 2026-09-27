import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, DollarSign, LogOut, Bell, Search, TrendingUp, UserPlus, Activity, X, Edit, Trash2, PlusCircle, Shield, Calendar, Percent, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.png';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState('overview'); // overview, budgets, projects, directory
  const [data, setData] = useState({ stats: {}, allocations: [] });
  const [fullData, setFullData] = useState({ projects: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [allocModal, setAllocModal] = useState(false);
  const [allocForm, setAllocForm] = useState({ project_id: '', employee_id: '' });

  // CRUD Modals state
  const [userModal, setUserModal] = useState({ open: false, mode: 'create', data: {} });
  const [projectModal, setProjectModal] = useState({ open: false, mode: 'create', data: {} });
  const [statusMsg, setStatusMsg] = useState('');

  const fetchDashboard = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const [dashRes, dataRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/data`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (dashRes.ok && dataRes.ok) {
        setData(await dashRes.json());
        setFullData(await dataRes.json());
      } else {
        if (dashRes.status === 401 || dashRes.status === 403) navigate('/login');
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const executeApi = async (url, method, bodyData) => {
    setStatusMsg('Processing...');
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
    try {
      const response = await fetch(`${API_URL}${url}`, {
        method,
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: bodyData ? JSON.stringify(bodyData) : null
      });
      const result = await response.json();
      if (response.ok) {
        setStatusMsg('Success!');
        fetchDashboard();
        setTimeout(() => {
          setStatusMsg('');
          setAllocModal(false);
          setUserModal({ open: false, mode: 'create', data: {} });
          setProjectModal({ open: false, mode: 'create', data: {} });
        }, 1000);
      } else {
        setStatusMsg(result.message || 'Error occurred');
      }
    } catch (err) {
      setStatusMsg('Network error');
    }
  };

  const handleAllocation = (e) => {
    e.preventDefault();
    executeApi('/api/admin/allocate', 'POST', allocForm);
  };

  const handleRemoveAllocation = (allocId) => {
    if (window.confirm("Remove this employee assignment?")) {
      executeApi(`/api/admin/allocate/${allocId}`, 'DELETE');
    }
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (userModal.mode === 'create') {
      executeApi('/api/admin/users', 'POST', userModal.data);
    } else {
      executeApi(`/api/admin/users/${userModal.data.id}`, 'PUT', userModal.data);
    }
  };

  const handleDeleteUser = (id) => {
    if(window.confirm("Are you sure? This deletes all associated projects & allocations!")) {
      executeApi(`/api/admin/users/${id}`, 'DELETE');
    }
  };

  const handleProjectSubmit = (e) => {
    e.preventDefault();
    if (projectModal.mode === 'create') {
      executeApi('/api/admin/projects', 'POST', projectModal.data);
    } else {
      executeApi(`/api/admin/projects/${projectModal.data.id}`, 'PUT', projectModal.data);
    }
  };

  const handleDeleteProject = (id) => {
    if(window.confirm("Delete this project and all its allocations?")) {
      executeApi(`/api/admin/projects/${id}`, 'DELETE');
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const employees = fullData.users.filter(u => u.role === 'EMPLOYEE');
  const clients = fullData.users.filter(u => u.role === 'CLIENT');

  // Search filtering
  const filteredUsers = fullData.users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = fullData.projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- RENDER VIEWS ---

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-slate-500">Total Revenue</p>
            <span className="p-2 bg-green-100 text-green-700 rounded-lg"><DollarSign className="h-4 w-4" /></span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-4">${data.stats.revenue?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-slate-500">Active Clients</p>
            <span className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Briefcase className="h-4 w-4" /></span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-4">{data.stats.active_clients || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-slate-500">Total Employees</p>
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-lg"><Users className="h-4 w-4" /></span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-4">{data.stats.total_employees || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-slate-500">Active Allocations</p>
            <span className="p-2 bg-purple-100 text-purple-700 rounded-lg"><Activity className="h-4 w-4" /></span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-4">{data.stats.active_allocations || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Project & Employee Allocations</h3>
          <button onClick={() => setAllocModal(true)} className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
            <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Assign Employee
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Assigned Project</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Status & Progress</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.allocations.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">No allocations found</td></tr>
              ) : data.allocations.map((alloc) => (
                <tr key={alloc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                      {alloc.employee_initials || 'E'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{alloc.employee_name}</p>
                      <p className="text-xs text-slate-400">{alloc.employee_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{alloc.project_name}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{alloc.client_name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        alloc.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>{alloc.status}</span>
                      <span className="text-xs font-bold text-slate-700">{alloc.completion_percentage}%</span>
                    </div>
                    <div className="w-28 bg-slate-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${alloc.completion_percentage}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleRemoveAllocation(alloc.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center">
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Unassign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderBudgets = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200"><h3 className="text-lg font-bold text-slate-900">Global Budgets & Financials</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Project Name</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Total Budget</th>
              <th className="px-6 py-4">Amount Billed</th>
              <th className="px-6 py-4">Remaining Balance</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredProjects.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                <td className="px-6 py-4 font-medium">{p.client_name}</td>
                <td className="px-6 py-4 text-slate-900 font-medium">${p.budget.toLocaleString()}</td>
                <td className="px-6 py-4 text-green-600 font-medium">${p.billing.toLocaleString()}</td>
                <td className="px-6 py-4 text-blue-600 font-bold">${(p.budget - p.billing).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <button onClick={() => setProjectModal({ open: true, mode: 'edit', data: p })} className="text-blue-600 hover:text-blue-800 flex items-center font-semibold">
                    <Edit className="h-4 w-4 mr-1" /> Edit Financials
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProjects = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-900">All Client Projects ({filteredProjects.length})</h3>
        <button onClick={() => setProjectModal({ open: true, mode: 'create', data: { budget: 0, billing: 0, status: 'In Progress', completion_percentage: 0, due_date: 'Dec 31, 2026' } })} className="flex items-center px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors">
          <PlusCircle className="h-4 w-4 mr-2" /> Create Project
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col relative group">
            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => setProjectModal({ open: true, mode: 'edit', data: p })} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit className="h-4 w-4" /></button>
               <button onClick={() => handleDeleteProject(p.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="flex justify-between items-start mb-3 pr-16">
              <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                p.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>{p.status}</span>
              <span className="text-xs text-slate-500 font-semibold flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" /> Due: {p.due_date}
              </span>
            </div>

            <p className="text-sm text-slate-600 mb-4 line-clamp-3 flex-1">{p.description}</p>
            
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-500">Progress</span>
                <span className="text-blue-600">{p.completion_percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${p.completion_percentage}%` }}></div>
              </div>
            </div>

            {/* Team Assigned */}
            <div className="mb-4">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Assigned Team</p>
              <div className="flex -space-x-2 overflow-hidden">
                {p.team && p.team.length > 0 ? (
                  p.team.map((member, i) => (
                    <div key={i} title={`${member.name} (${member.email})`} className="inline-block h-8 w-8 rounded-full bg-indigo-600 ring-2 ring-white text-white font-bold text-xs flex items-center justify-center">
                      {member.initials}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No employees assigned yet</span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Client</p>
                <p className="text-sm font-bold text-slate-900">{p.client_name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-semibold uppercase">Budget</p>
                <p className="text-sm font-bold text-slate-900">${p.budget.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderDirectory = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-900">User Directory & System Roles ({filteredUsers.length})</h3>
        <button onClick={() => setUserModal({ open: true, mode: 'create', data: { role: 'EMPLOYEE', permissions: 'Standard Access' } })} className="flex items-center px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors">
          <UserPlus className="h-4 w-4 mr-2" /> Add User
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">System Role</th>
                <th className="px-6 py-4">Assigned Permissions</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs">{u.name[0]}</div>
                    <span className="font-bold text-slate-900">{u.name}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'EMPLOYEE' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    <div className="flex items-center">
                      <Shield className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                      {u.permissions || 'Standard Access'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setUserModal({ open: true, mode: 'edit', data: u })} className="text-blue-600 hover:text-blue-800 flex items-center font-semibold text-xs">
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </button>
                      <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 flex items-center font-semibold text-xs">
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-10">
        <div className="p-6 flex items-center justify-center mb-2 border-b border-slate-800">
          <img src={logo} alt="DIRA Logo" className="h-16 w-auto object-contain drop-shadow-md" />
        </div>
        
        <div className="px-4 mb-4 mt-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Main Menu</p>
          <nav className="space-y-1">
            <button onClick={() => setView('overview')} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${view === 'overview' ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 rounded-l-none' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <Activity className="h-5 w-5 mr-3" /> Overview
            </button>
            <button onClick={() => setView('budgets')} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${view === 'budgets' ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 rounded-l-none' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <DollarSign className="h-5 w-5 mr-3" /> Global Budgets
            </button>
            <button onClick={() => setView('projects')} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${view === 'projects' ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 rounded-l-none' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <Briefcase className="h-5 w-5 mr-3" /> Client Projects
            </button>
            <button onClick={() => setView('directory')} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${view === 'directory' ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 rounded-l-none' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <Users className="h-5 w-5 mr-3" /> Directory & Roles
            </button>
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="bg-slate-800 rounded-xl p-4 mb-4 border border-slate-700">
            <p className="text-xs text-slate-400 font-medium">Logged in as</p>
            <p className="text-base font-bold text-white line-clamp-1">{user.name || 'System Admin'}</p>
            <span className="inline-block mt-1 text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Admin Privileges</span>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all w-full px-4 py-3 rounded-xl font-medium">
            <LogOut className="h-5 w-5 mr-3" /> End Session
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-0">
          <div className="relative w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50" 
              placeholder="Search projects, employees, clients..." 
            />
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-700">{user.name || 'Owner'}</p>
                <p className="text-xs text-slate-500 font-medium">Administrator</p>
              </div>
              <div className="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-slate-100">
                {user.name ? user.name[0] : 'A'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50 relative">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight capitalize">
                {view === 'overview' ? 'Dashboard Overview' : view.replace('-', ' ')}
              </h1>
              <p className="text-slate-500 mt-1 font-medium">Full administrative control over employees, clients, projects & roles.</p>
            </div>
            {view === 'overview' && (
              <button onClick={() => setAllocModal(true)} className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-sm hover:bg-blue-700 transition-colors">
                <UserPlus className="h-4 w-4 mr-2" /> New Allocation
              </button>
            )}
          </div>

          {loading ? (
             <div className="flex justify-center p-12 text-slate-500">Loading dashboard data...</div>
          ) : (
            <>
              {view === 'overview' && renderOverview()}
              {view === 'budgets' && renderBudgets()}
              {view === 'projects' && renderProjects()}
              {view === 'directory' && renderDirectory()}
            </>
          )}

          {/* New Allocation Modal */}
          {allocModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Assign Employee to Project</h3>
                  <button onClick={() => setAllocModal(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
                </div>
                <form onSubmit={handleAllocation} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Select Employee</label>
                    <select required value={allocForm.employee_id} onChange={e => setAllocForm({...allocForm, employee_id: e.target.value})} className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900">
                      <option value="">-- Choose Employee --</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.email})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Select Project</label>
                    <select required value={allocForm.project_id} onChange={e => setAllocForm({...allocForm, project_id: e.target.value})} className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900">
                      <option value="">-- Choose Project --</option>
                      {fullData.projects.map(p => <option key={p.id} value={p.id}>{p.name} - Client: {p.client_name}</option>)}
                    </select>
                  </div>
                  {statusMsg && <div className="text-sm font-bold text-blue-600 bg-blue-50 p-2.5 rounded-xl">{statusMsg}</div>}
                  <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors mt-2">Confirm Allocation</button>
                </form>
              </div>
            </div>
          )}

          {/* User Form Modal (Create/Edit) */}
          {userModal.open && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">{userModal.mode === 'create' ? 'Add New User' : 'Edit User & Permissions'}</h3>
                  <button onClick={() => setUserModal({open:false, data: {}})} className="text-slate-400 hover:text-slate-600"><X /></button>
                </div>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                    <input required type="text" value={userModal.data.name || ''} onChange={e => setUserModal({...userModal, data: {...userModal.data, name: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-2.5" />
                  </div>
                  {userModal.mode === 'create' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                      <input required type="email" value={userModal.data.email || ''} onChange={e => setUserModal({...userModal, data: {...userModal.data, email: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-2.5" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">System Role</label>
                    <select required value={userModal.data.role || 'EMPLOYEE'} onChange={e => setUserModal({...userModal, data: {...userModal.data, role: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-2.5">
                      <option value="EMPLOYEE">Employee</option>
                      <option value="CLIENT">Client</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Permissions Description</label>
                    <input type="text" placeholder="e.g. Read & Write, Standard Access, Design Access" value={userModal.data.permissions || ''} onChange={e => setUserModal({...userModal, data: {...userModal.data, permissions: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Password {userModal.mode === 'edit' && '(leave blank to keep current)'}</label>
                    <input type="password" value={userModal.data.password || ''} onChange={e => setUserModal({...userModal, data: {...userModal.data, password: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-2.5" />
                  </div>
                  {statusMsg && <div className="text-sm font-bold text-blue-600 bg-blue-50 p-2.5 rounded-xl">{statusMsg}</div>}
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors mt-2">Save User</button>
                </form>
              </div>
            </div>
          )}

          {/* Project Form Modal (Create/Edit) */}
          {projectModal.open && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">{projectModal.mode === 'create' ? 'Add New Project' : 'Edit Project Details'}</h3>
                  <button onClick={() => setProjectModal({open:false, data: {}})} className="text-slate-400 hover:text-slate-600"><X /></button>
                </div>
                <form onSubmit={handleProjectSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name</label>
                    <input required type="text" value={projectModal.data.name || ''} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, name: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                    <textarea rows="3" value={projectModal.data.description || ''} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, description: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Assigned Client</label>
                    <select required value={projectModal.data.client_id || ''} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, client_id: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-2.5">
                      <option value="">-- Choose Client --</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                      <select value={projectModal.data.status || 'In Progress'} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, status: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-2.5">
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Planning">Planning</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Progress (%)</label>
                      <input required type="number" min="0" max="100" value={projectModal.data.completion_percentage ?? 0} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, completion_percentage: parseInt(e.target.value) || 0}})} className="w-full border border-slate-200 rounded-xl p-2.5" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                      <input type="text" placeholder="e.g. Dec 31, 2026" value={projectModal.data.due_date || ''} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, due_date: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-2.5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Total Budget ($)</label>
                      <input required type="number" value={projectModal.data.budget || 0} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, budget: parseFloat(e.target.value) || 0}})} className="w-full border border-slate-200 rounded-xl p-2.5" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Amount Billed ($)</label>
                      <input required type="number" value={projectModal.data.billing || 0} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, billing: parseFloat(e.target.value) || 0}})} className="w-full border border-slate-200 rounded-xl p-2.5" />
                    </div>
                  </div>
                  {statusMsg && <div className="text-sm font-bold text-blue-600 bg-blue-50 p-2.5 rounded-xl">{statusMsg}</div>}
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors mt-2">Save Project</button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
