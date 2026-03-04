import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Shield, LogOut, FileText, Users, Edit3, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { CMSRole } from '../lib/cmsPermissions';

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: CMSRole | null;
};

export const Dashboard = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .order('email', { nullsFirst: false });
      if (error) {
        console.error('Failed to fetch users:', error);
        setUsers([]);
      } else {
        setUsers((data as ProfileRow[]) ?? []);
      }
      setUsersLoading(false);
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: CMSRole | null) => {
    if (!supabase) return;
    setUpdatingId(userId);
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) {
      console.error('Failed to update role:', error);
      alert('Could not update role. You may not have permission.');
    } else {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    }
    setUpdatingId(null);
  };

  const getRoleBadge = () => (
    <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-100 flex items-center gap-1">
      <Shield className="w-3 h-3" /> Admin Access
    </span>
  );

  return (
    <section className="min-h-screen bg-neutral-50 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-serif text-neutral-900">System Administration</h1>
              {getRoleBadge()}
            </div>
            <p className="text-sm text-neutral-500 font-mono mt-1">
              {profile?.email && <span className="text-neutral-600">{profile.email}</span>}
              {!profile?.email && 'Institute for Future Technologies'}
            </p>
          </div>
          <button 
            onClick={async () => { await signOut(); navigate('/login'); }}
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

              <div className="bg-white p-6 border border-neutral-200 shadow-sm md:col-span-2">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-purple-600" />
                  User Management
                </h3>
                <p className="text-sm text-neutral-500 mb-4">
                  New people can <Link to="/login" className="text-teal-600 hover:underline">sign up</Link>, then appear here. Assign a role to grant CMS access.
                </p>
                {usersLoading ? (
                  <p className="text-sm text-neutral-500">Loading users…</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-neutral-500">No users yet. Ask people to sign up from the Login page.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 text-left">
                          <th className="pb-2 pr-4 font-semibold text-neutral-700">Email</th>
                          <th className="pb-2 pr-4 font-semibold text-neutral-700">Name</th>
                          <th className="pb-2 font-semibold text-neutral-700">Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b border-neutral-100">
                            <td className="py-3 pr-4 text-neutral-800">{u.email || '—'}</td>
                            <td className="py-3 pr-4 text-neutral-600">{u.full_name || '—'}</td>
                            <td className="py-3">
                              <select
                                value={u.role ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  handleRoleChange(u.id, v === '' ? null : (v as CMSRole));
                                }}
                                disabled={updatingId === u.id}
                                className="text-xs font-medium px-2 py-1.5 rounded border border-neutral-200 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50"
                              >
                                <option value="">No role</option>
                                <option value="admin">Admin</option>
                                <option value="staff">Staff</option>
                                <option value="students">Students</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
        </div>
      </div>
    </section>
  );
};