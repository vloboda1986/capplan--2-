import React, { useState, useMemo, useEffect } from 'react';
import { addDays, format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  BrainCircuit,
  CalendarOff,
  AlertCircle,
  Plus as PlusIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowRight,
  X
} from 'lucide-react';
import { Developer, Project, DeveloperPlan, AbsenceType, Team, CalendarEvent, Task } from '../types';
import { WORK_HOURS_TARGET } from '../constants';
import { analyzeCapacity } from '../services/geminiService';
import * as DataService from '../services/dataService';
import { Avatar } from './Avatar';

// --- Sub-component for reliable input handling ---
interface AllocationInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (val: number) => void;
  disabled: boolean;
  className: string;
}

const AllocationInput = ({
  value,
  onChange,
  disabled,
  className,
  ...props
}: AllocationInputProps) => {
  // Local state to manage input value while typing without triggering parent re-renders/DB calls
  const [localValue, setLocalValue] = useState(value === 0 ? '' : value.toString());

  // Sync with prop changes (e.g., from DB reload or other user changes)
  useEffect(() => {
    setLocalValue(value === 0 ? '' : value.toString());
  }, [value]);

  const handleBlur = () => {
    const floatVal = parseFloat(localValue);
    const validHours = isNaN(floatVal) ? 0 : Math.min(24, Math.max(0, floatVal));

    // Only fire change if the value is actually different to avoid unnecessary DB calls
    if (validHours !== value) {
      onChange(validHours);
    }
  };

  return (
    <input
      {...props}
      type="number"
      min="0"
      max="24"
      step="0.5"
      disabled={disabled}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      placeholder="-"
      className={className}
    />
  );
};

interface PlannerProps {
  developers: Developer[];
  projects: Project[];
  plans: DeveloperPlan[];
  teams: Team[];
  onUpdateAllocation: (devId: string, projId: string, date: string, hours: number) => void;
  onUpdateAbsence: (devId: string, date: string, type: AbsenceType) => void;
  onAssignProject: (devId: string, projId: string) => void;
  onRemoveProject: (devId: string, projId: string) => void;
  readOnly?: boolean;
}

const Planner: React.FC<PlannerProps> = ({
  developers,
  projects,
  plans,
  teams,
  onUpdateAllocation,
  onUpdateAbsence,
  onAssignProject,
  onRemoveProject,
  readOnly = false
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'weekly' | 'biweekly'>('weekly');
  const [analysis, setAnalysis] = useState<{ loading: boolean; result: string | null }>({ loading: false, result: null });
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [activeDropdownDevId, setActiveDropdownDevId] = useState<string | null>(null);

  // Events State
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Tasks State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());
  const [taskModalState, setTaskModalState] = useState<{
    isOpen: boolean;
    developerId: string | null;
    projectId: string | null;
    date: string | null;
    taskFields: { title: string; url: string }[];
  }>({ isOpen: false, developerId: null, projectId: null, date: null, taskFields: [{ title: '', url: '' }] });

  // Copy Task State
  const [copyTaskModal, setCopyTaskModal] = useState<{
    isOpen: boolean;
    task: Task | null;
    selectedDate: string | null;
    calendarMonth: Date;
  }>({ isOpen: false, task: null, selectedDate: null, calendarMonth: new Date() });

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      const evs = await DataService.getEvents();
      setEvents(evs);
    };
    loadEvents();
  }, [currentDate]);

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      const ts = await DataService.getTasks();
      setTasks(ts);
    };
    loadTasks();
  }, []);

  // Derive the week days based on view mode
  // Using addDays logic instead of startOfWeek to avoid import issues
  const weekStart = useMemo(() => {
    const day = currentDate.getDay();
    const diff = (day + 6) % 7; // Adjust for Monday start (Mon=0, ... Sun=6)
    return addDays(currentDate, -diff);
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const days: Date[] = [];

    // First Week (Mon-Fri)
    for (let i = 0; i < 5; i++) {
      days.push(addDays(weekStart, i));
    }

    // Second Week (Mon-Fri) if biweekly
    if (viewMode === 'biweekly') {
      for (let i = 0; i < 5; i++) {
        // i + 7 skips the weekend (Sat/Sun) and goes to next Mon
        days.push(addDays(weekStart, i + 7));
      }
    }

    return days;
  }, [weekStart, viewMode]);

  const weekDateStrings = weekDays.map(d => format(d, 'yyyy-MM-dd'));

  // --- Group Developers by Team ---
  const groupedDevelopers = useMemo(() => {
    // Sort teams by sortOrder
    const sortedTeams = [...teams].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const teamMap = new Map(sortedTeams.map(t => [t.id, t]));
    const groups: { team: Team | null; devs: Developer[] }[] = [];

    sortedTeams.forEach(team => {
      const teamDevs = developers.filter(d => d.teamId === team.id);

      groups.push({
        team,
        devs: teamDevs
      });
    });

    const unassigned = developers.filter(d => !d.teamId || !teamMap.has(d.teamId));

    if (unassigned.length > 0) {
      groups.push({ team: null, devs: unassigned });
    }

    return groups.filter(g => g.devs.length > 0);
  }, [developers, teams]);


  // --- Handlers ---

  const handlePrev = () => {
    const daysToSubtract = viewMode === 'weekly' ? 7 : 14;
    setCurrentDate(addDays(currentDate, -daysToSubtract));
  };

  const handleNext = () => {
    const daysToAdd = viewMode === 'weekly' ? 7 : 14;
    setCurrentDate(addDays(currentDate, daysToAdd));
  };

  const handleAbsenceToggle = (developerId: string, dateStr: string) => {
    if (readOnly) return;
    const plan = plans.find(p => p.developerId === developerId);
    const currentAbsence = plan?.absences[dateStr] || AbsenceType.None;
    let nextAbsence = AbsenceType.None;

    if (currentAbsence === AbsenceType.None) nextAbsence = AbsenceType.Vacation;
    else if (currentAbsence === AbsenceType.Vacation) nextAbsence = AbsenceType.SickLeave;
    else nextAbsence = AbsenceType.None;

    onUpdateAbsence(developerId, dateStr, nextAbsence);
  };

  const handleToggleCellRelease = async (developerId: string, projectId: string, dateStr: string) => {
    if (readOnly) return;
    const existingEvent = events.find(e =>
      e.date === dateStr &&
      e.type === 'Release' &&
      e.developerId === developerId &&
      e.projectId === projectId
    );

    if (existingEvent) {
      // Remove
      await DataService.deleteEvent(existingEvent.id);
      setEvents(events.filter(e => e.id !== existingEvent.id));
    } else {
      // Add
      const newEvent: CalendarEvent = {
        id: crypto.randomUUID(),
        date: dateStr,
        type: 'Release',
        title: 'Release',
        developerId,
        projectId
      };
      await DataService.saveEvent(newEvent);
      setEvents([...events, newEvent]);
    }
  };



  const handleAnalyze = async () => {
    setAnalysis({ loading: true, result: null });
    setShowAnalysisModal(true);
    const result = await analyzeCapacity(developers, projects, plans, weekStart);
    setAnalysis({ loading: false, result });
  };

  // --- Task Handlers ---
  const handleOpenTaskModal = (developerId: string, projectId: string, date: string) => {
    if (readOnly) return;
    setTaskModalState({
      isOpen: true,
      developerId,
      projectId,
      date,
      taskFields: [{ title: '', url: '' }]
    });
  };

  const handleCloseTaskModal = () => {
    setTaskModalState({
      isOpen: false,
      developerId: null,
      projectId: null,
      date: null,
      taskFields: [{ title: '', url: '' }]
    });
  };

  const handleAddTaskField = () => {
    setTaskModalState(prev => ({
      ...prev,
      taskFields: [...prev.taskFields, { title: '', url: '' }]
    }));
  };

  const handleTaskFieldChange = (index: number, field: 'title' | 'url', value: string) => {
    setTaskModalState(prev => {
      const newFields = [...prev.taskFields];
      newFields[index][field] = value;
      return { ...prev, taskFields: newFields };
    });
  };

  const handleSaveTasks = async () => {
    const { developerId, projectId, date, taskFields } = taskModalState;
    if (!developerId || !projectId || !date) return;

    const validFields = taskFields.filter(f => f.url.trim());
    if (validFields.length === 0) return;

    const newTasks: Task[] = validFields.map(f => ({
      id: crypto.randomUUID(),
      developerId,
      projectId,
      date,
      title: f.url.trim(), // Use URL as title since title field is removed
      url: f.url.trim()
    }));

    for (const task of newTasks) {
      await DataService.saveTask(task);
    }

    setTasks([...tasks, ...newTasks]);
    handleCloseTaskModal();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (readOnly) return;
    await DataService.deleteTask(taskId);
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleCopyTaskClick = (task: Task) => {
    setCopyTaskModal({ isOpen: true, task, selectedDate: null, calendarMonth: new Date() });
  };

  const handleCopyTask = async () => {
    if (!copyTaskModal.task || !copyTaskModal.selectedDate) return;

    const newTask: Task = {
      ...copyTaskModal.task,
      id: crypto.randomUUID(),
      date: copyTaskModal.selectedDate
    };

    await DataService.saveTask(newTask);
    setTasks([...tasks, newTask]);
    setCopyTaskModal({ isOpen: false, task: null, selectedDate: null, calendarMonth: new Date() });
  };

  const handleCloseCopyModal = () => {
    setCopyTaskModal({ isOpen: false, task: null, selectedDate: null, calendarMonth: new Date() });
  };

  const toggleCellExpanded = (cellKey: string) => {
    setExpandedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cellKey)) {
        newSet.delete(cellKey);
      } else {
        newSet.add(cellKey);
      }
      return newSet;
    });
  };

  const getCellTasks = (developerId: string, projectId: string, date: string) => {
    return tasks.filter(t => t.developerId === developerId && t.projectId === projectId && t.date === date);
  };

  // --- Render Helpers ---

  const getDayTotal = (developerId: string, dateStr: string) => {
    const plan = plans.find(p => p.developerId === developerId);
    if (!plan) return 0;
    return plan.projects.reduce((sum, proj) => sum + (proj.allocations[dateStr] || 0), 0);
  };

  const getWeeklyTotal = (developerId: string) => {
    let sum = 0;
    weekDateStrings.forEach(dateStr => {
      sum += getDayTotal(developerId, dateStr);
    });
    return sum;
  };

  const getAbsence = (developerId: string, dateStr: string) => {
    return plans.find(p => p.developerId === developerId)?.absences[dateStr];
  };

  const getCellStatusColor = (hours: number, isAbsence: boolean, dailyTarget: number) => {
    if (isAbsence) return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    if (hours > dailyTarget) return 'bg-red-50 border-red-200 text-red-700';
    if (hours === dailyTarget) return 'bg-green-50 border-green-200 text-green-700';
    if (hours > 0 && hours < dailyTarget) return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    return 'bg-white hover:bg-slate-50';
  };

  const getWeeklyTotalClass = (hours: number, weeklyTarget: number) => {
    if (hours > weeklyTarget) return 'bg-red-100 text-red-800';
    if (hours === weeklyTarget) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
      {/* --- Toolbar --- */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center bg-white rounded-md border border-slate-300 shadow-sm">
            <button onClick={handlePrev} className="p-2 hover:bg-slate-50 text-slate-600 border-r border-slate-200">
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 py-2 text-sm font-medium text-slate-700 min-w-[200px] text-center">
              {format(weekStart, 'MMM d')} - {format(weekDays[weekDays.length - 1], 'MMM d, yyyy')}
            </div>
            <button onClick={handleNext} className="p-2 hover:bg-slate-50 text-slate-600 border-l border-slate-200">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex bg-slate-200 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'weekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode('biweekly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'biweekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Biweekly
            </button>
          </div>

          <h2 className="text-lg font-semibold text-slate-800 hidden lg:block">Resource Schedule</h2>
        </div>

        <button
          onClick={handleAnalyze}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
        >
          <BrainCircuit size={18} />
          <span className="hidden sm:inline">AI Insights</span>
        </button>
      </div>

      {/* --- Main Grid --- */}
      <div className="flex-1 overflow-auto relative">
        <div className="min-w-full">
          {/* Grid Header */}
          <div className="sticky top-0 z-[80] flex border-b border-slate-200 bg-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="w-64 flex-shrink-0 sticky left-0 z-[90] bg-slate-100 p-3 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              Developer / Project
            </div>
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`flex-1 min-w-[6rem] flex-shrink-0 p-2 text-center border-r border-slate-200 last:border-r-0 relative
                  ${index === 5 ? 'border-l-4 border-l-slate-300' : ''}`}
                >
                  <div className={isToday ? 'text-indigo-600 font-bold' : ''}>
                    {format(day, 'EEE')}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal">{format(day, 'd MMM')}</div>
                </div>
              );
            })}
            <div className="w-20 flex-shrink-0 p-3 text-center border-l border-slate-200 bg-slate-100 sticky right-0 z-[80]">Total</div>
          </div>

          {/* Grouped Developers Loop */}
          {groupedDevelopers.map((group, groupIdx) => (
            <React.Fragment key={group.team ? group.team.id : 'unassigned'}>
              {/* Team Separator Row */}
              <div className="sticky left-0 z-30 w-full flex bg-slate-50 border-b border-slate-200">
                <div
                  className={`sticky left-0 z-30 w-64 flex-shrink-0 px-3 py-1 flex items-center font-bold text-xs uppercase tracking-wider h-[30px] border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] 
                      ${group.team ? group.team.color : 'bg-slate-200 text-slate-700'}`}
                >
                  {group.team ? group.team.name : 'Unassigned'}
                </div>
                <div className={`flex-1 h-[30px] ${group.team ? group.team.color.split(' ')[0] : 'bg-slate-200'} opacity-20`}></div>
              </div>

              {group.devs.map(dev => {
                const plan = plans.find(p => p.developerId === dev.id);
                const devTotal = getWeeklyTotal(dev.id);
                const dailyTarget = dev.capacity || WORK_HOURS_TARGET;
                const weeklyTarget = dailyTarget * weekDateStrings.length;
                const isDropdownActive = activeDropdownDevId === dev.id;

                return (
                  <div
                    key={dev.id}
                    className="group border-b border-slate-200 last:border-b-0 bg-white"
                  >
                    <div className="flex items-stretch">
                      {/* LEFT CONTENT COLUMN (Info + Projects) */}
                      <div className="flex-1 flex-col min-w-0">

                        {/* Developer Summary Row */}
                        <div className="flex bg-white hover:bg-slate-50 transition-colors">
                          <div className={`w-64 flex-shrink-0 sticky left-0 ${isDropdownActive ? 'z-[60]' : 'z-20'} flex items-center justify-between p-3 border-r border-slate-200 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]`}>
                            <div className="flex items-center space-x-3">
                              <Avatar name={dev.name} className="w-8 h-8 text-xs" />
                              <div>
                                <div className="text-sm font-medium text-slate-900">{dev.name}</div>
                                <div className="text-xs text-slate-500">{dev.role} <span className="text-slate-300">|</span> {dailyTarget}h/d</div>
                              </div>
                            </div>

                            {!readOnly && (
                              <div
                                className="relative group/add"
                                onMouseEnter={() => setActiveDropdownDevId(dev.id)}
                                onMouseLeave={() => setActiveDropdownDevId(null)}
                              >
                                <button className="text-slate-400 hover:text-indigo-600 p-1">
                                  <Plus size={16} />
                                </button>
                                <div className="absolute left-full top-0 pl-1 w-64 hidden group-hover/add:block z-[100]">
                                  <div className="bg-white rounded-md shadow-xl border border-slate-200 p-1">
                                    <div className="text-xs font-semibold text-slate-400 px-2 py-1 border-b border-slate-100 mb-1">Assign Project</div>
                                    <div className="max-h-60 overflow-y-auto">
                                      {projects.map(proj => {
                                        const isAssigned = plan?.projects.some(p => p.projectId === proj.id);
                                        if (isAssigned) return null;
                                        return (
                                          <button
                                            key={proj.id}
                                            onClick={() => onAssignProject(dev.id, proj.id)}
                                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-100 rounded text-slate-700 flex items-center space-x-2 transition-colors"
                                          >
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${proj.color.split(' ')[0]}`}></span>
                                            <span className="truncate">{proj.name}</span>
                                          </button>
                                        );
                                      })}
                                      {projects.every(p => plan?.projects.some(assigned => assigned.projectId === p.id)) && (
                                        <div className="px-2 py-2 text-xs text-slate-400 text-center italic">
                                          All projects assigned
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Days Summary for Dev */}
                          {weekDateStrings.map((dateStr, index) => {
                            const dailyTotal = getDayTotal(dev.id, dateStr);
                            const absence = getAbsence(dev.id, dateStr);
                            const isOver = dailyTotal > dailyTarget;
                            const isUnder = dailyTotal < dailyTarget && dailyTotal > 0;

                            return (
                              <div
                                key={dateStr}
                                className={`flex-1 min-w-[6rem] flex-shrink-0 p-2 border-r border-slate-200 last:border-r-0 flex flex-col justify-center items-center relative group/cell 
                                        ${index === 5 ? 'border-l-4 border-l-slate-300' : ''}`}
                              >
                                {absence ? (
                                  <div
                                    onClick={() => handleAbsenceToggle(dev.id, dateStr)}
                                    className={`w-full h-full absolute inset-0 flex items-center justify-center text-xs font-medium ${readOnly ? 'cursor-default' : 'cursor-pointer'} transition-colors ${absence === AbsenceType.Vacation ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'}`}
                                  >
                                    {absence === AbsenceType.Vacation ? 'VAC' : 'SICK'}
                                  </div>
                                ) : (
                                  <>
                                    <div className={`text-sm font-semibold ${isOver ? 'text-red-600' : isUnder ? 'text-yellow-600' : dailyTotal === 0 ? 'text-slate-300' : 'text-green-600'}`}>
                                      {dailyTotal}h
                                    </div>
                                    {!readOnly && (
                                      <button
                                        onClick={() => handleAbsenceToggle(dev.id, dateStr)}
                                        className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 text-slate-400 hover:text-purple-600 transition-opacity"
                                        title="Mark Absence"
                                      >
                                        <CalendarOff size={12} />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Project Allocation Rows */}
                        {plan?.projects.map(assignedProj => {
                          const projectMeta = projects.find(p => p.id === assignedProj.projectId);
                          if (!projectMeta) return null;

                          return (
                            <div key={assignedProj.projectId} className="flex bg-slate-50/50 hover:bg-slate-100 transition-colors">
                              <div className="w-64 flex-shrink-0 sticky left-0 z-20 flex items-center justify-between pl-12 pr-3 py-2 border-r border-slate-200 bg-slate-50/50 group-hover:bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                <div className="flex items-center space-x-2 overflow-hidden">
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${projectMeta.color.split(' ')[0]}`}></span>
                                  <span className="text-xs text-slate-600 truncate" title={projectMeta.name}>{projectMeta.name}</span>
                                </div>
                                {!readOnly && (
                                  <button
                                    onClick={() => onRemoveProject(dev.id, assignedProj.projectId)}
                                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>

                              {weekDateStrings.map((dateStr, index) => {
                                const hrs = assignedProj.allocations[dateStr] || 0;
                                const absence = getAbsence(dev.id, dateStr);

                                // Check if this specific cell has a "Release" marker
                                const releaseEvent = events.find(e =>
                                  e.date === dateStr &&
                                  e.type === 'Release' &&
                                  e.developerId === dev.id &&
                                  e.projectId === assignedProj.projectId
                                );

                                return (
                                  <div
                                    key={dateStr}
                                    className={`flex-1 min-w-[6rem] flex-shrink-0 p-1 border-r border-slate-100 last:border-r-0 relative group/cell
                                            ${absence ? 'bg-slate-50' : ''} 
                                            ${index === 5 ? 'border-l-4 border-l-slate-300' : ''}`}
                                  >
                                    {!releaseEvent ? (
                                      <AllocationInput
                                        value={hrs}
                                        disabled={!!absence || readOnly}
                                        onChange={(val) => onUpdateAllocation(dev.id, assignedProj.projectId, dateStr, val)}
                                        className={`w-full text-center text-xs py-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${getCellStatusColor(hrs, !!absence, dailyTarget)}`}
                                        title={projectMeta.name}
                                      />
                                    ) : (
                                      <div
                                        className="w-full h-8 flex flex-col items-center justify-center text-[10px] leading-tight bg-red-50 rounded border border-red-100 cursor-pointer select-none"
                                        onClick={() => handleToggleCellRelease(dev.id, assignedProj.projectId, dateStr)}
                                        title="Click to remove Release marker"
                                      >
                                        <span className="font-bold text-red-500 leading-none">Release</span>
                                        <span className="text-slate-600 font-medium leading-none mt-0.5">{hrs}h</span>
                                      </div>
                                    )}

                                    {/* Toggle Release Marker Button */}
                                    {!readOnly && !absence && !releaseEvent && (
                                      <button
                                        onClick={() => handleToggleCellRelease(dev.id, assignedProj.projectId, dateStr)}
                                        className="absolute top-2 right-10 p-0.5 rounded-full z-10 opacity-0 group-hover/cell:opacity-100 text-slate-400 hover:text-slate-600 transition-all"
                                        title="Mark as Release"
                                      >
                                        <AlertCircle size={14} />
                                      </button>
                                    )}

                                    {/* --- Task Links UI --- */}
                                    {(() => {
                                      const cellTasks = getCellTasks(dev.id, assignedProj.projectId, dateStr);
                                      const hasTasks = cellTasks.length > 0;
                                      const cellKey = `${dev.id}-${assignedProj.projectId}-${dateStr}`;
                                      const isExpanded = expandedCells.has(cellKey);

                                      return (
                                        <>
                                          {/* Task Controls (Add + Indicator) */}
                                          <div className="absolute top-2 left-1 flex items-center space-x-1 z-20">
                                            {/* Add Task Button (Hover) */}
                                            {!readOnly && !absence && (
                                              <button
                                                onClick={() => handleOpenTaskModal(dev.id, assignedProj.projectId, dateStr)}
                                                className="flex items-center justify-center px-1.5 py-0.5 rounded-full opacity-0 group-hover/cell:opacity-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                title="Add Task Link"
                                              >
                                                <PlusIcon size={14} />
                                              </button>
                                            )}

                                            {/* Task Indicator / Expand Toggle */}
                                            {hasTasks && (
                                              <button
                                                onClick={() => toggleCellExpanded(cellKey)}
                                                className={`flex items-center space-x-0.5 px-2 py-0.5 rounded text-[10px] transition-colors ${isExpanded ? 'bg-yellow-200 text-yellow-900' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}
                                              >
                                                <span className="font-bold">{cellTasks.length}</span>
                                                {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                              </button>
                                            )}
                                          </div>

                                          {/* Expanded Task List */}
                                          {isExpanded && (
                                            <div className="mt-2 w-full bg-white border border-slate-200 rounded-md overflow-hidden">
                                              <div className="max-h-60 overflow-y-auto">
                                                {cellTasks.map(task => (
                                                  <div key={task.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 group/task">
                                                    <a
                                                      href={task.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="flex items-center space-x-1.5 text-[10px] text-indigo-600 hover:underline truncate flex-1"
                                                      title={task.title}
                                                    >
                                                      <ExternalLink size={8} className="flex-shrink-0" />
                                                      <span className="truncate">{task.title}</span>
                                                    </a>
                                                    {!readOnly && (
                                                      <>
                                                        <button
                                                          onClick={() => handleCopyTaskClick(task)}
                                                          className="text-slate-300 hover:text-indigo-500 opacity-0 group-hover/task:opacity-100 transition-opacity p-0.5"
                                                          title="Copy task to another date"
                                                        >
                                                          <ArrowRight size={10} />
                                                        </button>
                                                        <button
                                                          onClick={() => handleDeleteTask(task.id)}
                                                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-opacity p-0.5"
                                                        >
                                                          <Trash2 size={10} />
                                                        </button>
                                                      </>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                              {!readOnly && (
                                                <button
                                                  onClick={() => handleOpenTaskModal(dev.id, assignedProj.projectId, dateStr)}
                                                  className="w-full text-center text-[10px] py-1 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 border-t border-slate-100 transition-colors"
                                                >
                                                  + Add
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>

                      {/* RIGHT COLUMN (Total - Vertically Centered) */}
                      <div className={`w-20 flex-shrink-0 border-l border-slate-200 flex items-center justify-center font-bold text-sm sticky right-0 z-[80] bg-white group-hover:bg-slate-50 ${getWeeklyTotalClass(devTotal, weeklyTarget)}`}>
                        {devTotal}h
                      </div>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div >

      {/* --- Analysis Modal --- */}
      {
        showAnalysisModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div className="flex items-center space-x-3 text-indigo-600">
                  <BrainCircuit size={24} />
                  <h3 className="text-xl font-bold text-slate-800">Capacity Analysis</h3>
                </div>
                <button onClick={() => setShowAnalysisModal(false)} className="text-slate-400 hover:text-slate-600">
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {analysis.loading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    <p className="text-slate-500 animate-pulse">Analyzing schedule patterns...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: analysis.result || '' }} />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
                <button
                  onClick={() => setShowAnalysisModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* --- Task Modal --- */}
      {taskModalState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Add Tasks</h3>
              <button onClick={handleCloseTaskModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {taskModalState.taskFields.map((field, idx) => (
                <div key={idx} className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-500">Task {idx + 1}</span>
                    {taskModalState.taskFields.length > 1 && (
                      <button
                        onClick={() => {
                          const newFields = taskModalState.taskFields.filter((_, i) => i !== idx);
                          setTaskModalState(prev => ({ ...prev, taskFields: newFields }));
                        }}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    placeholder="URL (https://...)"
                    value={field.url}
                    onChange={(e) => handleTaskFieldChange(idx, 'url', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus={idx === taskModalState.taskFields.length - 1 && idx === 0}
                  />
                </div>
              ))}

              <button
                onClick={handleAddTaskField}
                className="w-full py-2 flex items-center justify-center space-x-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-sm"
              >
                <PlusIcon size={16} />
                <span>Add Another Task</span>
              </button>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end space-x-3">
              <button
                onClick={handleCloseTaskModal}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTasks}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm shadow-sm"
              >
                Save Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Copy Task Modal with Calendar --- */}
      {copyTaskModal.isOpen && copyTaskModal.task && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Copy Task</h3>
              <button onClick={handleCloseCopyModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Task:</p>
                <p className="text-sm font-medium text-slate-800 truncate">{copyTaskModal.task.title}</p>
              </div>

              <p className="text-sm font-medium text-slate-700 mb-3">Select target date:</p>

              {(() => {
                const currentMonth = copyTaskModal.calendarMonth;
                const monthStart = startOfMonth(currentMonth);
                const monthEnd = endOfMonth(currentMonth);
                const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

                return (
                  <div>
                    {/* Month header with navigation */}
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setCopyTaskModal(prev => ({ ...prev, calendarMonth: subMonths(prev.calendarMonth, 1) }))}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                        type="button"
                      >
                        <ChevronLeft size={20} className="text-slate-600" />
                      </button>
                      <div className="text-center font-bold text-slate-700">
                        {format(currentMonth, 'MMMM yyyy')}
                      </div>
                      <button
                        onClick={() => setCopyTaskModal(prev => ({ ...prev, calendarMonth: addMonths(prev.calendarMonth, 1) }))}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                        type="button"
                      >
                        <ChevronRight size={20} className="text-slate-600" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="font-semibold text-slate-500 py-1">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {/* Add empty cells for days before the 1st of the month */}
                      {(() => {
                        // getDay returns 0 for Sunday, 1 for Monday, etc.
                        // We want Monday (1) to be index 0, so adjust
                        const firstDayOfWeek = getDay(monthStart);
                        const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert Sunday=0 to index 6, Monday=1 to index 0
                        return Array.from({ length: offset }).map((_, i) => (
                          <div key={`empty-${i}`} />
                        ));
                      })()}

                      {allDays.map((day, idx) => {
                        const dayOfWeek = getDay(day);
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isSelected = copyTaskModal.selectedDate === dateStr;
                        const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

                        return (
                          <button
                            key={idx}
                            onClick={() => !isWeekend && setCopyTaskModal(prev => ({ ...prev, selectedDate: dateStr }))}
                            disabled={isWeekend}
                            className={`
                              aspect-square p-2 text-xs rounded transition-all relative
                              ${isWeekend ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-indigo-50 cursor-pointer'}
                              ${isSelected ? 'bg-indigo-600 text-white font-bold' : 'text-slate-700'}
                              ${isToday && !isSelected ? 'ring-2 ring-indigo-400 font-bold' : ''}
                            `}
                          >
                            {format(day, 'd')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end space-x-3">
              <button
                onClick={handleCloseCopyModal}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCopyTask}
                disabled={!copyTaskModal.selectedDate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Copy Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default Planner;