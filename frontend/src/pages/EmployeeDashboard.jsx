import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, LogOut, Search, Clock, Calendar, ChevronRight, Users, Shield, Edit3, X, CheckCircle, Percent, UserCheck } from 'lucide-react';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({ user: {}, projects: [], assigned_clients: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects'); // 'projects', 'clients', 'profile'
  const [searchQuery, setSearchQuery] = useState('');

  // Status update modal
  const [updateModal, setUpdateModal] = useState({ open: false, project: null });
  const [statusForm, setStatusForm] = useState({ status: 'In Progress', completion_percentage: 0 });
  const [msg, setMsg] = useState('');

  const fetchEmployeeData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const response = await fetch(`${API_URL}/api/employee/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const json = await response.json();
        setData(json);
      } else {
        if (response.status === 401 || response.status === 403) navigate('/login');
      }
    } catch (err) {
      console.error("Failed to fetch employee data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleOpenUpdate = (proj) => {
    setUpdateModal({ open: true, project: proj });
    setStatusForm({
      status: proj.status || 'In Progress',
      completion_percentage: proj.completion_percentage || 0
    });
    setMsg('');
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setMsg('Updating...');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const response = await fetch(`${API_URL}/api/employee/projects/${updateModal.project.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusForm)
      });
      
      if (response.ok) {
        setMsg('Progress updated successfully!');
        fetchEmployeeData();
        setTimeout(() => setUpdateModal({ open: false, project: null }), 1000);
      } else {
        const errJson = await response.json();
        setMsg(errJson.message || 'Failed to update status');
      }
    } catch (err) {
      setMsg('Network error');
    }
  };

  const currentUser = data.user.name ? data.user : JSON.parse(localStorage.getItem('user') || '{}');

  const filteredProjects = (data.projects || []).filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-md">
              {currentUser.name ? currentUser.name[0] : 'E'}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">{currentUser.name || 'Employee'} Workspace</h1>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">Employee Access</span>
                <span>•</span>
                <span className="flex items-center text-slate-300"><Shield className="h-3 w-3 mr-1 text-slate-400" /> {currentUser.permissions || 'Standard Access'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden sm:block relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-slate-700 bg-slate-800 rounded-xl text-sm placeholder-slate-400 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Search assigned projects..."
              />
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center text-sm font-medium text-slate-300 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex space-x-3 mb-8 border-b border-slate-200 pb-4">
          <button 
            onClick={() => setActiveTab('projects')}
            className={`flex items-center px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'projects' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            My Projects ({data.projects?.length || 0})
          </button>
          
          <button 
            onClick={() => setActiveTab('clients')}
            className={`flex items-center px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'clients' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Assigned Clients ({data.assigned_clients?.length || 0})
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Shield className="h-4 w-4 mr-2" />
            My Permissions & Role
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12 text-slate-500 font-medium">Loading your allocations...</div>
        ) : (
          <>
            {/* PROJECTS TAB */}
            {activeTab === 'projects' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-slate-900">My Allotted Client Projects</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    Strictly restricted to projects assigned to you by administration.
                  </p>
                </div>

                {filteredProjects.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-slate-400">
                    <Briefcase className="h-12 w-12 mb-3 text-slate-300" />
                    <p className="font-bold text-slate-700 text-lg">No assigned projects found</p>
                    <p className="text-sm mt-1 max-w-md">When an admin allocates you to a client project, it will appear here with your team members.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredProjects.map((project) => (
                      <div key={project.id} className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                <Briefcase className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-slate-900">{project.name}</h3>
                                <p className="text-sm font-semibold text-slate-500">Client: {project.client_name}</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              project.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>{project.status}</span>
                          </div>

                          <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                            {project.description}
                          </p>

                          {/* Progress bar */}
                          <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span className="text-slate-600">Completion Status</span>
                              <span className="text-blue-600">{project.completion_percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${project.completion_percentage}%` }}></div>
                            </div>
                          </div>

                          {/* Team Members */}
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assigned Co-Team Members</p>
                            <div className="flex items-center space-x-2">
                              {project.team && project.team.length > 0 ? (
                                project.team.map((m) => (
                                  <div key={m.id} title={`${m.name} (${m.email})`} className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white">
                                    {m.initials}
                                  </div>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">Only you</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                          <div className="flex items-center text-xs text-slate-500 font-medium">
                            <Calendar className="h-4 w-4 mr-1 text-slate-400" />
                            Due: {project.due_date || 'N/A'}
                          </div>

                          <button 
                            onClick={() => handleOpenUpdate(project)}
                            className="flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5 mr-1" />
                            Update Progress
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CLIENTS TAB */}
            {activeTab === 'clients' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-slate-900">My Assigned Clients</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    Clients whose projects you are actively assigned to work on.
                  </p>
                </div>

                {data.assigned_clients.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 font-medium">
                    No assigned clients at present.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.assigned_clients.map((c) => (
                      <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4 border border-emerald-100">
                          {c.name[0]}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">{c.email}</p>
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs text-slate-400 font-semibold uppercase">Allocated Project</p>
                          <p className="text-sm font-bold text-blue-600 mt-0.5">{c.project_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PROFILE & PERMISSIONS TAB */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <Shield className="h-6 w-6 text-blue-600 mr-2" /> Employee Account & Role Status
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-500">Full Name</span>
                    <span className="text-sm font-bold text-slate-900">{currentUser.name}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-500">Work Email</span>
                    <span className="text-sm font-bold text-slate-900">{currentUser.email}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-500">System Role</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{currentUser.role}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-500">Admin-Granted Permissions</span>
                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{currentUser.permissions || 'Standard Access'}</span>
                  </div>
                </div>

                <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    <span className="font-bold text-slate-800">Data Visibility Notice:</span> Your account operates under strict role-based access control (RBAC). You can only view client details and project resources allocated directly to you by your Administrator.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Update Progress Modal */}
        {updateModal.open && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Update Project Progress</h3>
                <button onClick={() => setUpdateModal({ open: false, project: null })} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <p className="text-sm font-semibold text-blue-600 mb-4">{updateModal.project.name}</p>
              
              <form onSubmit={handleStatusSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Project Status</label>
                  <select 
                    value={statusForm.status} 
                    onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Planning">Planning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Completion Percentage (0 - 100%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={statusForm.completion_percentage}
                    onChange={(e) => setStatusForm({ ...statusForm, completion_percentage: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900" 
                  />
                </div>

                {msg && <div className="text-sm font-bold text-blue-600 bg-blue-50 p-2.5 rounded-xl">{msg}</div>}

                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors mt-2">
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
