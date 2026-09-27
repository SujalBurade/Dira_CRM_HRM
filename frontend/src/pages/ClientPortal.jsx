import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, LogOut, CheckCircle2, Circle, Clock, MessageSquare, Briefcase, Calendar, ShieldCheck } from 'lucide-react';

export default function ClientPortal() {
  const navigate = useNavigate();
  const [data, setData] = useState({ user: {}, projects: [] });
  const [loading, setLoading] = useState(true);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
        const response = await fetch(`${API_URL}/api/client/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const json = await response.json();
          setData(json);
        } else {
          if (response.status === 401 || response.status === 403) navigate('/login');
        }
      } catch (err) {
        console.error("Failed to fetch client data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const clientUser = data.user?.name ? data.user : JSON.parse(localStorage.getItem('user') || '{}');
  const projects = data.projects || [];
  const project = projects.length > 0 ? projects[selectedProjectIndex] || projects[0] : null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
               <span className="text-white font-bold text-lg">{clientUser.name ? clientUser.name[0] : 'C'}</span>
             </div>
             <div>
               <h1 className="text-xl font-bold tracking-tight text-white">{clientUser.name || 'Client'} Portal</h1>
               <p className="text-xs text-slate-400 font-medium">NexaSync CRM Client Experience</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors border border-white/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center p-12 text-slate-500 font-medium">Loading your project status...</div>
        ) : !project ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-800">No active projects found</h3>
            <p className="text-sm mt-1">You currently do not have any projects assigned. Please contact administration for onboarding.</p>
          </div>
        ) : (
          <div>
            {/* Multiple Project Selector */}
            {projects.length > 1 && (
              <div className="mb-6 flex space-x-2 overflow-x-auto pb-2">
                {projects.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectIndex(idx)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      selectedProjectIndex === idx 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Project Feed */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-8 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-3xl font-extrabold text-slate-900">{project.name}</h2>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center ${
                        project.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        <Activity className="h-4 w-4 mr-2 animate-pulse" /> {project.status}
                      </span>
                    </div>

                    <p className="text-slate-600 font-medium leading-relaxed text-base mb-6">
                      {project.description}
                    </p>

                    {/* Progress Bar & Status Summary */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-700">Project Completion Status</span>
                        <span className="text-lg font-extrabold text-blue-600">{project.completion_percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${project.completion_percentage}%` }}
                        ></div>
                      </div>
                      <div className="mt-3 flex justify-between text-xs text-slate-500 font-semibold">
                        <span>Target Due Date: {project.due_date || 'Dec 31, 2026'}</span>
                        <span>Phase: {project.completion_percentage >= 100 ? 'Finalized' : project.completion_percentage >= 60 ? 'Development & QA' : 'Design & Planning'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline */}
                  <div className="p-8 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                      Milestones & Timeline Progress
                    </h3>
                    
                    <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
                      <div className="relative pl-8">
                        <span className="absolute -left-3.5 bg-white h-7 w-7 rounded-full flex items-center justify-center ring-4 ring-slate-100">
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        </span>
                        <h4 className="font-bold text-slate-900 text-base">Requirements & Onboarding</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Completed successfully</p>
                      </div>
                      
                      <div className="relative pl-8">
                        <span className="absolute -left-3.5 bg-white h-7 w-7 rounded-full flex items-center justify-center ring-4 ring-slate-100">
                          {project.completion_percentage >= 40 ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : (
                            <Clock className="h-6 w-6 text-blue-500" />
                          )}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base">UI/UX Design & Architecture</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {project.completion_percentage >= 40 ? 'Completed' : 'In Progress'}
                        </p>
                      </div>

                      <div className="relative pl-8">
                        <span className="absolute -left-3.5 bg-white h-7 w-7 rounded-full flex items-center justify-center ring-4 ring-slate-100">
                          {project.completion_percentage >= 80 ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : project.completion_percentage >= 40 ? (
                            <Clock className="h-6 w-6 text-blue-500" />
                          ) : (
                            <Circle className="h-6 w-6 text-slate-300" />
                          )}
                        </span>
                        <h4 className={`font-bold text-base ${project.completion_percentage >= 40 ? 'text-slate-900' : 'text-slate-400'}`}>
                          Development & Testing
                        </h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {project.completion_percentage >= 80 ? 'Completed' : project.completion_percentage >= 40 ? 'In Active Development' : 'Pending'}
                        </p>
                      </div>

                      <div className="relative pl-8">
                        <span className="absolute -left-3.5 bg-white h-7 w-7 rounded-full flex items-center justify-center ring-4 ring-slate-100">
                          {project.completion_percentage >= 100 ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : (
                            <Circle className="h-6 w-6 text-slate-300" />
                          )}
                        </span>
                        <h4 className={`font-bold text-base ${project.completion_percentage >= 100 ? 'text-slate-900' : 'text-slate-400'}`}>
                          Final Deployment & Handover
                        </h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {project.completion_percentage >= 100 ? 'Deployed' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    Assigned Project Team
                  </h3>
                  {project.team && project.team.length > 0 ? (
                    <div className="space-y-4">
                      {project.team.map((member) => (
                        <div key={member.id} className="flex items-center space-x-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-200">
                            {member.initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{member.name}</p>
                            <p className="text-xs text-slate-500 font-medium">{member.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No dedicated team members assigned yet.</p>
                  )}
                  
                  <a 
                    href={`mailto:${project.team && project.team.length > 0 ? project.team[0].email : 'support@dira.com'}`}
                    className="mt-6 w-full flex items-center justify-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Assigned Team
                  </a>
                </div>
                
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-md p-6 text-white">
                  <h3 className="text-lg font-bold mb-2">Need Help?</h3>
                  <p className="text-blue-100 text-sm font-medium mb-4">
                    If you have questions regarding project status or deliverables, contact your assigned account lead.
                  </p>
                  <div className="flex items-center text-xs text-blue-200 font-semibold bg-white/10 p-3 rounded-xl">
                    <ShieldCheck className="h-4 w-4 mr-2 text-blue-300" />
                    Secure & Restricted Client Portal
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
