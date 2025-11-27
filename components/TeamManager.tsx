
import React, { useState } from 'react';
import { Developer, Role, Level, Team } from '../types';
import {
  Edit2,
  Trash2,
  UserPlus,
  X,
  Check,
  Search,
  Briefcase,
  Award,
  Users,
  Plus,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { PROJECT_COLORS } from '../constants';
import { Avatar } from './Avatar';

interface TeamManagerProps {
  developers: Developer[];
  teams: Team[];
  onSave: (dev: Developer) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSaveTeam: (team: Team) => Promise<void>;
  onDeleteTeam: (id: string) => Promise<void>;
  readOnly?: boolean;
}

type SortKey = 'role' | 'team' | 'level';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey | null;
  direction: SortDirection;
}

const TeamManager: React.FC<TeamManagerProps> = ({
  developers,
  teams,
  onSave,
  onDelete,
  onSaveTeam,
  onDeleteTeam,
  readOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'teams'>('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  // Member Modal
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingDev, setEditingDev] = useState<Developer | null>(null);
  const [memberFormData, setMemberFormData] = useState<Partial<Developer>>({});

  // Team Modal
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamFormData, setTeamFormData] = useState<Partial<Team>>({});

  // --- Members Logic ---
  const handleAddNewMember = () => {
    setEditingDev(null);
    setMemberFormData({
      name: '',
      role: Role.Frontend,
      level: 'Mid',
      avatar: '',
      teamId: '',
      capacity: 8
    });
    setIsMemberModalOpen(true);
  };

  const handleEditMember = (dev: Developer) => {
    setEditingDev(dev);
    setMemberFormData({ ...dev, capacity: dev.capacity || 8 });
    setIsMemberModalOpen(true);
  };

  const handleDeleteMember = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this team member?")) {
      await onDelete(id);
    }
  };

  const handleSaveMember = async () => {
    if (!memberFormData.name || !memberFormData.role || !memberFormData.level) return;

    const devToSave: Developer = {
      id: editingDev?.id || crypto.randomUUID(),
      name: memberFormData.name,
      role: memberFormData.role as Role,
      level: memberFormData.level as Level,
      avatar: '',
      teamId: memberFormData.teamId || undefined,
      capacity: memberFormData.capacity || 8
    };

    await onSave(devToSave);
    setIsMemberModalOpen(false);
  };

  // --- Teams Logic ---
  const handleAddNewTeam = () => {
    setEditingTeam(null);
    setTeamFormData({
      name: '',
      color: PROJECT_COLORS[0].value,
      sortOrder: 0
    });
    setIsTeamModalOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamFormData({ ...team });
    setIsTeamModalOpen(true);
  };

  const handleDeleteTeam = async (id: string) => {
    if (window.confirm("Delete this team? Members will become unassigned.")) {
      await onDeleteTeam(id);
    }
  };

  const handleSaveTeam = async () => {
    if (!teamFormData.name || !teamFormData.color) return;

    const teamToSave: Team = {
      id: editingTeam?.id || crypto.randomUUID(),
      name: teamFormData.name,
      color: teamFormData.color,
      sortOrder: teamFormData.sortOrder || 0
    };

    await onSaveTeam(teamToSave);
    setIsTeamModalOpen(false);
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 text-slate-400 opacity-50" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={14} className="ml-1 text-indigo-600" />
      : <ArrowDown size={14} className="ml-1 text-indigo-600" />;
  };

  const filteredDevs = developers.filter(dev => {
    const matchesSearch = dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = teamFilter === 'all' || dev.teamId === teamFilter || (teamFilter === 'unassigned' && !dev.teamId);
    const matchesRole = roleFilter === 'all' || dev.role === roleFilter;

    return matchesSearch && matchesTeam && matchesRole;
  });

  const sortedDevs = [...filteredDevs].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    switch (sortConfig.key) {
      case 'role':
        return a.role.localeCompare(b.role) * direction;
      case 'level':
        return a.level.localeCompare(b.level) * direction;
      case 'team': {
        const teamA = teams.find(t => t.id === a.teamId)?.name || 'Unassigned';
        const teamB = teams.find(t => t.id === b.teamId)?.name || 'Unassigned';
        return teamA.localeCompare(teamB) * direction;
      }
      default:
        return 0;
    }
  });

  return (
    <div className="flex flex-col h-full bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
      {/* Header & Tabs */}
      <div className="flex flex-col border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between p-6 pb-2">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Team Management</h2>
            <p className="text-sm text-slate-500 mt-1">Manage people and team structures.</p>
          </div>
          {!readOnly && (
            <button
              onClick={activeTab === 'members' ? handleAddNewMember : handleAddNewTeam}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors"
            >
              {activeTab === 'members' ? <UserPlus size={18} /> : <Plus size={18} />}
              <span>{activeTab === 'members' ? 'Add Member' : 'Add Team'}</span>
            </button>
          )}
        </div>

        <div className="flex px-6 space-x-6 mt-4">
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'members' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Users size={16} />
            <span>Members</span>
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'teams' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Briefcase size={16} />
            <span>Teams Structure</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50">

        {/* MEMBERS VIEW */}
        {activeTab === 'members' && (
          <>
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                />
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <Filter size={16} />
                  <span>Filter by:</span>
                </div>

                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="p-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white min-w-[140px]"
                >
                  <option value="all">All Teams</option>
                  <option value="unassigned">Unassigned</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="p-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white min-w-[140px]"
                >
                  <option value="all">All Roles</option>
                  {Object.values(Role).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                    <th className="px-6 py-4">Name</th>
                    <th
                      className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center">
                        Role {getSortIcon('role')}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      onClick={() => handleSort('team')}
                    >
                      <div className="flex items-center">
                        Team {getSortIcon('team')}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      onClick={() => handleSort('level')}
                    >
                      <div className="flex items-center">
                        Level {getSortIcon('level')}
                      </div>
                    </th>
                    {!readOnly && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedDevs.length === 0 ? (
                    <tr>
                      <td colSpan={readOnly ? 4 : 5} className="px-6 py-10 text-center text-slate-400">
                        No members found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    sortedDevs.map(dev => {
                      const team = teams.find(t => t.id === dev.teamId);
                      return (
                        <tr key={dev.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <Avatar name={dev.name} className="w-9 h-9 text-xs" />
                              <div className="font-medium text-slate-900">{dev.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold
                              ${dev.role === Role.Backend ? 'bg-blue-100 text-blue-700' :
                                dev.role === Role.Frontend ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}
                            `}>
                              {dev.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {team ? (
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${team.color.replace('bg-', 'bg-opacity-20 border-').replace('text-', 'text-')}`}>
                                {team.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-1 text-sm text-slate-600">
                              <Award size={14} className="text-slate-400" />
                              <span>{dev.level || 'Mid'}</span>
                            </div>
                          </td>
                          {!readOnly && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditMember(dev)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteMember(dev.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Remove"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TEAMS VIEW (Grid) */}
        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(team => {
              const memberCount = developers.filter(d => d.teamId === team.id).length;
              return (
                <div key={team.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${team.color.split(' ')[0]}`}></div>

                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-slate-800 text-lg">{team.name}</h3>
                    {!readOnly && (
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditTeam(team)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDeleteTeam(team.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center text-sm text-slate-500 mb-2">
                    <Users size={16} className="mr-2" />
                    <span>{memberCount} members assigned</span>
                  </div>

                  <div className="flex -space-x-2 overflow-hidden py-1 pl-1">
                    {developers.filter(d => d.teamId === team.id).slice(0, 5).map(dev => (
                      <div key={dev.id} className="ring-2 ring-white rounded-full">
                        <Avatar name={dev.name} className="w-8 h-8 text-xs" />
                      </div>
                    ))}
                    {memberCount > 5 && (
                      <div className="h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                        +{memberCount - 5}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {teams.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                <p>No teams created yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MEMBER MODAL */}
      {isMemberModalOpen && !readOnly && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingDev ? 'Edit Member' : 'Add Member'}
              </h3>
              <button onClick={() => setIsMemberModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Profile Preview */}
              <div className="flex items-center space-x-4 mb-2">
                <Avatar name={memberFormData.name || 'User Name'} className="w-16 h-16 text-xl" />
                <div>
                  <div className="text-sm font-medium text-slate-500">Preview</div>
                  <div className="font-bold text-slate-800">{memberFormData.name || 'Member Name'}</div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={memberFormData.name || ''}
                  onChange={e => setMemberFormData({ ...memberFormData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Sarah Connor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={memberFormData.role}
                    onChange={e => setMemberFormData({ ...memberFormData, role: e.target.value as Role })}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    {Object.values(Role).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                  <select
                    value={memberFormData.level}
                    onChange={e => setMemberFormData({ ...memberFormData, level: e.target.value as Level })}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="Junior">Junior</option>
                    <option value="Mid">Mid</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>
              </div>

              {/* Team & Capacity Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Team Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Team Assignment</label>
                  <select
                    value={memberFormData.teamId || ''}
                    onChange={e => setMemberFormData({ ...memberFormData, teamId: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">Unassigned</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Daily Capacity */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Daily Capacity (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={memberFormData.capacity || ''}
                    onChange={e => setMemberFormData({ ...memberFormData, capacity: parseFloat(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="8"
                  />
                </div>
              </div>

            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button onClick={() => setIsMemberModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-white">
                Cancel
              </button>
              <button onClick={handleSaveMember} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                Save Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEAM MODAL */}
      {isTeamModalOpen && !readOnly && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingTeam ? 'Edit Team' : 'Add Team'}
              </h3>
              <button onClick={() => setIsTeamModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Team Name</label>
                  <input
                    type="text"
                    value={teamFormData.name || ''}
                    onChange={e => setTeamFormData({ ...teamFormData, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Omega Squad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Position (1-30)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={teamFormData.sortOrder || ''}
                    onChange={e => setTeamFormData({ ...teamFormData, sortOrder: parseInt(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Team Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {PROJECT_COLORS.map(c => {
                    const isSelected = teamFormData.color === c.value;
                    const baseColorClass = c.value.split(' ')[0];
                    return (
                      <button
                        key={c.value}
                        onClick={() => setTeamFormData({ ...teamFormData, color: c.value })}
                        className={`h-10 rounded-md border-2 transition-all flex items-center justify-center ${baseColorClass} ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-transparent hover:border-slate-300'}`}
                      >
                        {isSelected && <Check size={16} className="text-indigo-900" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button onClick={() => setIsTeamModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-white">
                Cancel
              </button>
              <button onClick={handleSaveTeam} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                Save Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManager;
