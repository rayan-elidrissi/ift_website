import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { UserPlus, Mail, Shield, Check, LogOut, Copy, Users, BookOpen, Crown, FileText, Calendar, PenTool, Edit3 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [role, setRole] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (isSupabaseConfigured() && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        setRole('admin');
      } else {
        const isAuthenticated = localStorage.getItem('ift_auth');
        const storedRole = localStorage.getItem('ift_role');
        if (!isAuthenticated) {
          navigate('/login');
          return;
        }
        setRole(storedRole || 'student');
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('ift_auth');
    localStorage.removeItem('ift_role');
    window.dispatchEvent(new Event('ift_auth_change'));
    navigate('/login');
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setLoading(true);
    
    // Simulate API call to invite user
    setTimeout(() => {
      const password = generatePassword();
      setGeneratedPassword(password);
      setSuccess(true);
      setLoading(false);
    }, 1500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
  };

  const getRoleBadge = () => {
    switch(role) {
      case 'director':
        return <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-100 flex items-center gap-1"><Crown className="w-3 h-3" /> Director Access</span>;
      case 'admin':
        return <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-100 flex items-center gap-1"><Shield className="w-3 h-3" /> Admin Access</span>;
      case 'staff':
        return <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-100 flex items-center gap-1"><Users className="w-3 h-3" /> Staff Access</span>;
      default:
        return <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-teal-100 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Student Access</span>;
    }
  };

  const getHeaderContent = () => {
    switch(role) {
      case 'director': return "Administrative Control";
      case 'admin': return "System Administration";
      case 'staff': return "Staff Portal";
      default: return "Student Portal";
    }
  };

  return (
    <section className="min-h-screen bg-neutral-50 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-serif text-neutral-900">{getHeaderContent()}</h1>
              {getRoleBadge()}
            </div>
            <p className="text-sm text-neutral-500 font-mono mt-1">Institute for Future Technologies</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Supabase: Quick link to edit content */}
          {isSupabaseConfigured() && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-teal-200 shadow-lg p-6 rounded-lg"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-50 rounded-lg">
                    <Edit3 className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">Edit Website Content</h2>
                    <p className="text-sm text-neutral-500 mt-1">Content is stored in the cloud and shared across all visitors.</p>
                  </div>
                </div>
                <Link
                  to="/"
                  className="flex items-center gap-2 bg-teal-600 text-white px-6 py-3 hover:bg-teal-700 transition-colors text-sm font-bold uppercase tracking-wider"
                >
                  <Edit3 className="w-4 h-4" />
                  Go to site & edit
                </Link>
              </div>
            </motion.div>
          )}

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 gap-8">
          
          {/* DIRECTOR ONLY: Invite System */}
          {role === 'director' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-neutral-200 shadow-xl p-8 md:p-12 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5">
                 <Shield className="w-32 h-32" />
              </div>

              <div className="relative z-10">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                  Invite New Member
                </h2>
                <p className="text-neutral-500 mb-8 max-w-lg leading-relaxed">
                  As a Director, you can grant access to new members. Enter their email address to generate a secure temporary password.
                </p>

                {!success ? (
                  <form onSubmit={handleInvite} className="max-w-md">
                    <div className="mb-6">
                      <label className="block text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">
                        Member Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 text-neutral-900 focus:outline-none focus:border-teal-500 transition-colors"
                          placeholder="colleague@ift.edu"
                          required
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-neutral-900 text-white px-8 py-4 uppercase text-xs font-bold tracking-widest hover:bg-teal-600 transition-colors flex items-center gap-2 disabled:opacity-70"
                    >
                      {loading ? 'Generating...' : 'Generate Invite'}
                      {!loading && <UserPlus className="w-4 h-4" />}
                    </button>
                  </form>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-teal-50 border border-teal-100 p-6 rounded-lg max-w-lg"
                  >
                    <div className="flex items-center gap-3 text-teal-800 mb-4 font-bold">
                      <Check className="w-5 h-5" />
                      Invitation Generated
                    </div>
                    <p className="text-sm text-teal-700 mb-4">
                      An invitation has been prepared for <span className="font-semibold">{inviteEmail}</span>.
                    </p>
                    
                    <div className="bg-white p-4 border border-teal-100 mb-4">
                      <span className="text-xs uppercase text-neutral-400 tracking-widest block mb-1">Temporary Password</span>
                      <div className="flex items-center justify-between">
                        <code className="text-lg font-mono text-neutral-900">{generatedPassword}</code>
                        <button onClick={copyToClipboard} className="text-neutral-400 hover:text-teal-600 transition-colors" title="Copy">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-4">
                       <button 
                         onClick={() => { setSuccess(false); setInviteEmail(''); setGeneratedPassword(''); }}
                         className="text-xs font-bold uppercase tracking-widest text-teal-800 hover:text-teal-600"
                       >
                         Invite Another
                       </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ADMIN ONLY: System Administration */}
          {role === 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="bg-white p-6 border border-neutral-200 shadow-sm">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-purple-600" />
                  System Status
                </h3>
                <div className="space-y-3 text-sm text-neutral-700">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <span>Authentication Service</span>
                    <span className="text-green-600 font-medium">Operational</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <span>Database Replication</span>
                    <span className="text-green-600 font-medium">Healthy</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Backup Snapshot</span>
                    <span className="text-neutral-500 font-medium">Today, 03:00</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 border border-neutral-200 shadow-sm">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-purple-600" />
                  User Management
                </h3>
                <div className="space-y-3 text-sm text-neutral-700">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <span>Active Users</span>
                    <span className="font-semibold">128</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <span>Pending Invitations</span>
                    <span className="font-semibold">6</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Role Change Requests</span>
                    <span className="font-semibold text-amber-600">2</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 border border-neutral-200 shadow-sm md:col-span-2">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Recent Security Activity
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm border-b border-neutral-100 pb-3">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-neutral-800">New admin account verified</p>
                      <p className="text-neutral-500 text-xs">Today at 09:14</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm border-b border-neutral-100 pb-3">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-neutral-800">Password policy update deployed</p>
                      <p className="text-neutral-500 text-xs">Yesterday at 18:42</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-neutral-800">Audit logs exported for compliance review</p>
                      <p className="text-neutral-500 text-xs">Yesterday at 11:06</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* LEAD VIEW: Project Management */}
          {role === 'lead' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 border border-neutral-200 shadow-sm">
                   <h3 className="font-bold flex items-center gap-2 mb-4">
                     <Users className="w-4 h-4 text-blue-600" />
                     Team Activity
                   </h3>
                   <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 text-sm border-b border-neutral-100 pb-3 last:border-0">
                          <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center font-mono text-xs">U{i}</div>
                          <div>
                            <p className="font-medium">Update on Project Alpha</p>
                            <p className="text-neutral-400 text-xs">2 hours ago</p>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="bg-white p-6 border border-neutral-200 shadow-sm">
                   <h3 className="font-bold flex items-center gap-2 mb-4">
                     <PenTool className="w-4 h-4 text-blue-600" />
                     Pending Approvals
                   </h3>
                   <p className="text-sm text-neutral-500">No pending approvals required.</p>
                </div>
             </div>
          )}

          {/* STUDENT VIEW: Courses */}
          {role === 'student' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-6 border border-neutral-200 shadow-sm">
                  <h3 className="font-bold flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-teal-600" />
                    Current Assignments
                  </h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-neutral-50 border border-neutral-100 rounded">
                       <p className="font-medium text-sm">Creative Coding Final</p>
                       <p className="text-xs text-red-500 mt-1">Due in 2 days</p>
                    </div>
                    <div className="p-3 bg-neutral-50 border border-neutral-100 rounded">
                       <p className="font-medium text-sm">HCI Research Proposal</p>
                       <p className="text-xs text-neutral-500 mt-1">Due next week</p>
                    </div>
                  </div>
               </div>
               <div className="bg-white p-6 border border-neutral-200 shadow-sm">
                  <h3 className="font-bold flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    Upcoming Schedule
                  </h3>
                  <div className="text-sm text-neutral-600">
                    <p className="mb-2"><strong>Today 14:00</strong> - Guest Lecture</p>
                    <p><strong>Tomorrow 10:00</strong> - Lab Access</p>
                  </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};