
import React, { useState } from 'react';
import { Project, Priority, RiskLevel, Subproject, AppUser, UserRole, Stack, RiskLog } from '../types';
import { PROJECT_COLORS } from '../constants';
import { format, differenceInCalendarDays } from 'date-fns';
import {
  Edit2,
  Trash2,
  Plus,
  X,
  Check,
  Search,
  Briefcase,
  AlertTriangle,
  Clock,
  Flag,
  Calendar,
  MessageSquareText,
  CornerDownRight,
  User,
  Filter,
  AlertCircle,
  Layers
} from 'lucide-react';
import { Avatar } from './Avatar';

interface ProjectManagerProps {
  projects: Project[];
  users: AppUser[];
  onSave: (proj: Project) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

const STACK_OPTIONS: Stack[] = [
  'Magento 1',
  'Magento 2',
  'Magento 2 Hyva',
  'Shopify',
  'Wordpress',
  'Shopware',
  'Custom'
];

const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  users,
  onSave,
  onDelete,
  canCreate = true,
  canEdit = true,
  canDelete = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});

  // Delete Confirmation State
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleAddNew = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      color: PROJECT_COLORS[0].value,
      priority: 'Medium',
      riskLevel: 'Green',
      subprojects: [{ id: crypto.randomUUID(), name: '', deadline: '' }],
      subproject: '',
      deadline: '',
      shortUpdate: '',
      managerId: '',
      stack: undefined
    });
    setIsModalOpen(true);
  };

  const handleEdit = (proj: Project) => {
    setEditingProject(proj);

    // Normalize subprojects from legacy fields if array is missing
    let formSubprojects = proj.subprojects ? [...proj.subprojects] : [];
    if (formSubprojects.length === 0 && (proj.subproject || proj.deadline)) {
      formSubprojects.push({
        id: crypto.randomUUID(),
        name: proj.subproject || '',
        deadline: proj.deadline || ''
      });
    }
    // Ensure at least one empty row if completely empty
    if (formSubprojects.length === 0) {
      formSubprojects.push({ id: crypto.randomUUID(), name: '', deadline: '' });
    }

    setFormData({
      ...proj,
      subprojects: formSubprojects,
      riskLevel: proj.riskLevel || 'Green',
      managerId: proj.managerId || '',
      stack: proj.stack
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      await onDelete(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.color) return;

    if ((formData.riskLevel === 'Yellow' || formData.riskLevel === 'Red') && !formData.riskDescription) {
      alert("Please provide a description for the risk.");
      return;
    }

    const activeSubprojects = formData.subprojects?.filter(s => s.name.trim() !== '') || [];
    const primarySub = activeSubprojects.length > 0 ? activeSubprojects[0] : null;

    const projectToSave: Project = {
      id: editingProject?.id || crypto.randomUUID(),
      name: formData.name,
      color: formData.color,
      priority: formData.priority as Priority,
      subprojects: activeSubprojects,
      subproject: primarySub ? primarySub.name : undefined,
      deadline: primarySub ? primarySub.deadline : undefined,
      riskLevel: (formData.riskLevel || 'Green') as RiskLevel,
      riskDescription: formData.riskDescription,
      lastStatusUpdate: new Date().toISOString(),
      shortUpdate: formData.shortUpdate,
      managerId: formData.managerId || undefined,
      stack: formData.stack
    };

    await onSave(projectToSave);
    setIsModalOpen(false);
  };

  const handleAddSubproject = () => {
    const newSub: Subproject = { id: crypto.randomUUID(), name: '', deadline: '' };
    setFormData(prev => ({
      ...prev,
      subprojects: [...(prev.subprojects || []), newSub]
    }));
  };

  const removeSubproject = (index: number) => {
    const newSubs = [...(formData.subprojects || [])];
    newSubs.splice(index, 1);
    setFormData({ ...formData, subprojects: newSubs });
  };

  const updateSubproject = (index: number, field: keyof Subproject, value: string) => {
    const newSubs = [...(formData.subprojects || [])];
    newSubs[index] = { ...newSubs[index], [field]: value };
    setFormData({ ...formData, subprojects: newSubs });
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesManager = managerFilter === 'all' ||
      (managerFilter === 'unassigned' && !p.managerId) ||
      p.managerId === managerFilter;
    return matchesSearch && matchesManager;
  });

  const getPriorityColor = (p?: Priority) => {
    switch (p) {
      case 'High': return 'text-red-600 bg-red-50 border-red-100';
      case 'Medium': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'Low': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-slate-500 bg-slate-100 border-slate-200';
    }
  };

  const getRiskBadgeStyles = (r?: RiskLevel) => {
    switch (r) {
      case 'Red': return 'bg-red-50 text-red-700 border-red-100';
      case 'Yellow': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'Green': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const availableManagers = users.filter(u => u.role === UserRole.Admin || u.role === UserRole.ProjectManager);

  return (
    <div className="flex flex-col h-full bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Project Management</h2>
          <p className="text-sm text-slate-500 mt-1">Create and manage projects available for assignment.</p>
        </div>
        {canCreate && (
          <button
            onClick={handleAddNew}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus size={18} />
            <span>Add Project</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
          />
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-sm text-slate-500 whitespace-nowrap">
            <Filter size={16} />
            <span>Manager:</span>
          </div>
          <select
            value={managerFilter}
            onChange={(e) => setManagerFilter(e.target.value)}
            className="p-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white min-w-[200px]"
          >
            <option value="all">All Managers</option>
            <option value="unassigned">Unassigned</option>
            {availableManagers.map(mgr => (
              <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List View */}
      <div className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                <th className="px-6 py-4 w-1/4">Project</th>
                <th className="px-6 py-4 w-1/6">Status</th>
                <th className="px-6 py-4 w-1/6">Manager</th>
                <th className="px-6 py-4 w-1/4">Deadlines / Subprojects</th>
                <th className="px-6 py-4 w-1/6">Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No projects found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredProjects.map(proj => {
                  const mgr = users.find(u => u.id === proj.managerId);
                  const lastUpdate = proj.lastStatusUpdate ? new Date(proj.lastStatusUpdate) : null;
                  const isStale = lastUpdate ? differenceInCalendarDays(new Date(), lastUpdate) > 7 : false;

                  return (
                    <tr key={proj.id} className="group hover:bg-slate-50 transition-colors">
                      {/* Project Info */}
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-start space-x-3">
                          <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${proj.color.split(' ')[0]}`}></div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{proj.name}</div>
                            {proj.stack && (
                              <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 mt-1">
                                <Layers size={10} className="mr-1" />
                                {proj.stack}
                              </div>
                            )}
                            {proj.shortUpdate && (
                              <div className="mt-1 text-xs text-slate-500 bg-slate-100 p-1.5 rounded border border-slate-200 italic leading-relaxed">
                                "{proj.shortUpdate}"
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-2 items-start">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${getPriorityColor(proj.priority)}`}>
                            {proj.priority || 'Medium'} Priority
                          </span>

                          {proj.riskLevel && (
                            <div className={`text-[10px] px-2 py-1 rounded border flex items-center gap-1.5 ${getRiskBadgeStyles(proj.riskLevel)}`}>
                              {proj.riskLevel === 'Green' ? <Check size={10} /> : <AlertTriangle size={10} />}
                              <span className="font-medium">{proj.riskLevel === 'Green' ? 'On Track' : proj.riskLevel}</span>
                            </div>
                          )}
                          {proj.riskDescription && (proj.riskLevel === 'Yellow' || proj.riskLevel === 'Red') && (
                            <div className="text-[10px] text-slate-500 leading-tight max-w-[150px]">
                              Risk: {proj.riskDescription}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Manager */}
                      <td className="px-6 py-4 align-top">
                        {mgr ? (
                          <div className="flex items-center space-x-2">
                            <Avatar name={mgr.name} className="w-6 h-6 text-[10px]" />
                            <div className="text-sm text-slate-700 font-medium">{mgr.name}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Deadlines / Subprojects */}
                      <td className="px-6 py-4 align-top">
                        {(proj.subprojects && proj.subprojects.length > 0) ? (
                          <div className="space-y-1.5">
                            {proj.subprojects.slice(0, 3).map(sub => (
                              <div key={sub.id} className="flex items-center text-xs">
                                <CornerDownRight size={12} className="text-slate-300 mr-1.5 flex-shrink-0" />
                                <span className="text-slate-600 truncate max-w-[120px]" title={sub.name}>{sub.name}</span>
                                {sub.deadline && (
                                  <span className="ml-2 text-[9px] text-slate-400 bg-slate-100 px-1 rounded border border-slate-200">
                                    {format(new Date(sub.deadline), 'MMM d')}
                                  </span>
                                )}
                              </div>
                            ))}
                            {proj.subprojects.length > 3 && (
                              <div className="text-[10px] text-indigo-500 pl-4">
                                +{proj.subprojects.length - 3} more
                              </div>
                            )}
                          </div>
                        ) : (
                          // Legacy fallback
                          proj.subproject ? (
                            <div className="flex items-center text-xs">
                              <CornerDownRight size={12} className="text-slate-300 mr-1.5 flex-shrink-0" />
                              <span className="text-slate-600">{proj.subproject}</span>
                              {proj.deadline && (
                                <span className="ml-2 text-[9px] text-slate-400 bg-slate-100 px-1 rounded border border-slate-200">
                                  {format(new Date(proj.deadline), 'MMM d')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )
                        )}
                      </td>

                      {/* Updated */}
                      <td className="px-6 py-4 align-top">
                        {lastUpdate ? (
                          <div className="flex items-center justify-between min-w-[120px]">
                            <div>
                              <div className={`text-xs font-medium ${isStale ? 'text-red-600' : 'text-slate-700'}`}>
                                {format(lastUpdate, 'MMM d, yyyy')}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {format(lastUpdate, 'h:mm a')}
                              </div>
                            </div>
                            {mgr && (
                              <div className="flex items-center ml-2" title={`Updated by: ${mgr.name}`}>
                                <span className="text-xs text-slate-400 truncate max-w-[80px]">{mgr.name}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-red-500">Never</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(proj)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Edit Project"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setProjectToDelete(proj)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete Project"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingProject ? 'Edit Project Status' : 'Add Project'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* --- Basic Info Section --- */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Basic Info</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g. Website Redesign"
                      autoFocus
                    />
                  </div>

                  {/* Stack Dropdown */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                      <Layers size={14} className="mr-1.5 text-slate-400" />
                      Tech Stack
                    </label>
                    <select
                      value={formData.stack || ''}
                      onChange={e => setFormData({ ...formData, stack: e.target.value as Stack })}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="">Select Stack...</option>
                      {STACK_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Color Picker */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Color Label</label>
                    <div className="flex flex-wrap gap-2">
                      {PROJECT_COLORS.map(c => {
                        const isSelected = formData.color === c.value;
                        const baseColorClass = c.value.split(' ')[0];
                        return (
                          <button
                            key={c.value}
                            onClick={() => setFormData({ ...formData, color: c.value })}
                            className={`
                                w-8 h-8 rounded-full border-2 transition-all relative flex items-center justify-center
                                ${baseColorClass}
                                ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-transparent hover:border-slate-300'}
                              `}
                            title={c.label}
                          >
                            {isSelected && <Check size={14} className="text-indigo-900" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Status Report Section --- */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Status Report</h4>
                  {formData.lastStatusUpdate && (
                    <span className="text-[10px] text-slate-400">Last updated: {format(new Date(formData.lastStatusUpdate), 'PP p')}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Short Update */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                      <MessageSquareText size={14} className="mr-1.5 text-slate-400" />
                      Short Status Update
                    </label>
                    <input
                      type="text"
                      value={formData.shortUpdate || ''}
                      onChange={e => setFormData({ ...formData, shortUpdate: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Brief summary (e.g., 'On track, preparing for release')"
                    />
                  </div>

                  {/* Responsible Manager */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                      <User size={14} className="mr-1.5 text-slate-400" />
                      Responsible Project Manager
                    </label>
                    <select
                      value={formData.managerId || ''}
                      onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="">Select a manager...</option>
                      {availableManagers.map(mgr => (
                        <option key={mgr.id} value={mgr.id}>
                          {mgr.name} ({mgr.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                      <Flag size={14} className="mr-1.5 text-slate-400" />
                      Priority
                    </label>
                    <select
                      value={formData.priority || 'Medium'}
                      onChange={e => setFormData({ ...formData, priority: e.target.value as Priority })}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  {/* Risk Level */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                      <AlertTriangle size={14} className="mr-1.5 text-slate-400" />
                      Risk Level
                    </label>
                    <select
                      value={formData.riskLevel || 'Green'}
                      onChange={e => setFormData({ ...formData, riskLevel: e.target.value as RiskLevel })}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="Green">Green (On Track)</option>
                      <option value="Yellow">Yellow (At Risk)</option>
                      <option value="Red">Red (Critical)</option>
                    </select>
                  </div>

                  {/* Subprojects / Focus */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-slate-700 flex items-center">
                        <Briefcase size={14} className="mr-1.5 text-slate-400" />
                        Subprojects & Deadlines
                      </label>
                      <button
                        onClick={handleAddSubproject}
                        className="text-xs flex items-center text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-2 py-1 rounded"
                      >
                        <Plus size={14} className="mr-1" /> Add Subproject
                      </button>
                    </div>

                    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                      {formData.subprojects?.map((sub, index) => (
                        <div key={sub.id} className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-white rounded-md border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-indigo-200">

                          {/* Name Input */}
                          <div className="flex-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block md:hidden">Objective</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Flag size={14} className="text-indigo-400" />
                              </div>
                              <input
                                type="text"
                                value={sub.name}
                                onChange={(e) => updateSubproject(index, 'name', e.target.value)}
                                placeholder="Describe the objective or deliverable..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/30 focus:bg-white transition-colors"
                              />
                            </div>
                          </div>

                          {/* Deadline Input */}
                          <div className="w-full md:w-48">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block md:hidden">Due Date</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar size={14} className="text-indigo-400" />
                              </div>
                              <input
                                type="date"
                                value={sub.deadline}
                                onChange={(e) => updateSubproject(index, 'deadline', e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/30 focus:bg-white text-slate-600"
                              />
                            </div>
                          </div>

                          {/* Delete Action */}
                          {formData.subprojects && formData.subprojects.length > 0 && (
                            <div className="flex md:items-center justify-end">
                              <button
                                onClick={() => removeSubproject(index)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Remove entry"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {(!formData.subprojects || formData.subprojects.length === 0) && (
                        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                          <p className="text-sm text-slate-500 font-medium">No subprojects defined yet.</p>
                          <p className="text-xs text-slate-400 mt-1">Break down this project into smaller deliverables.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Risk Description - Conditional */}
                  {(formData.riskLevel === 'Yellow' || formData.riskLevel === 'Red') && (
                    <div className="md:col-span-2 animate-in fade-in slide-in-from-top-2">
                      <label className="block text-sm font-medium text-red-700 mb-1 flex items-center">
                        Risk Description <span className="text-red-500 ml-1">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={formData.riskDescription || ''}
                        onChange={e => setFormData({ ...formData, riskDescription: e.target.value })}
                        placeholder="Describe the blockers or risks..."
                        className="w-full p-2 border border-red-200 rounded-md focus:ring-red-500 focus:border-red-500 bg-red-50"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium flex items-center space-x-2"
              >
                <Check size={16} />
                <span>Save Project</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Project?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete <span className="font-bold text-slate-800">"{projectToDelete.name}"</span>?
                <br /><br />
                <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded">This will remove all existing allocations.</span>
                <br />
                This action cannot be undone.
              </p>

              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
