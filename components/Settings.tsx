
import React, { useState } from 'react';
import { AppUser, UserRole } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  Shield,
  Search,
  Check,
  X,
  UserCog
} from 'lucide-react';
import { Avatar } from './Avatar';

interface SettingsProps {
  users: AppUser[];
  onSaveUser: (user: AppUser) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ users, onSaveUser, onDeleteUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState<Partial<AppUser>>({});

  const handleAddNew = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: UserRole.TeamMate
    });
    setIsModalOpen(true);
  };

  const handleEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormData({ ...user });
    setIsModalOpen(true);
  };

  const handleDelete = (user: AppUser) => {
    if (users.length <= 1) {
      alert("Cannot delete the last user.");
      return;
    }
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await onDeleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.role) return;

    const userToSave: AppUser = {
      id: editingUser?.id || crypto.randomUUID(),
      name: formData.name,
      role: formData.role,
      email: formData.email,
      password: formData.password
    };

    await onSaveUser(userToSave);

    // Simulate email invitation flow for new users
    if (!editingUser) {
      alert(`Invitation email sent to ${formData.email} with login details.`);
    }

    setIsModalOpen(false);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.Admin:
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case UserRole.ProjectManager:
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case UserRole.TeamMate:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-800">User Management</h2>
          <p className="text-sm text-slate-500 mt-1">Manage system access and user roles.</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} />
          <span>Add User</span>
        </button>
      </div>

      {/* Filter */}
      <div className="p-4 border-b border-slate-100 bg-white">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(user => (
            <div key={user.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar name={user.name} className="w-12 h-12 text-lg" />
                  <div>
                    <h3 className="font-bold text-slate-800">{user.name}</h3>
                    <p className="text-xs text-slate-500">{user.email || 'No email'}</p>
                  </div>
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(user)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(user)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-auto pt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                  {user.role === UserRole.Admin && <Shield size={12} className="mr-1" />}
                  {user.role === UserRole.ProjectManager && <UserCog size={12} className="mr-1" />}
                  {user.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingUser ? 'Edit User' : 'Add User'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={formData.password || ''}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={editingUser ? '••••••••' : 'Enter password'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <div className="space-y-2">
                  {Object.values(UserRole).map(role => (
                    <label key={role} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${formData.role === role ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={formData.role === role}
                        onChange={() => setFormData({ ...formData, role })}
                        className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-slate-900">{role}</span>
                        <span className="block text-xs text-slate-500">
                          {role === UserRole.Admin && 'Full access to all settings and data.'}
                          {role === UserRole.ProjectManager && 'Can manage projects and edit planner.'}
                          {role === UserRole.TeamMate && 'Restricted access: Can only view the Planner page.'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-white">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center">
                <Check size={16} className="mr-2" />
                Save User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete User?</h3>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">{userToDelete.name}</span>? This action cannot be undone.
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-sm"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
