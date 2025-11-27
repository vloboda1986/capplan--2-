
import React, { useMemo } from 'react';
import { format, addDays, differenceInCalendarDays } from 'date-fns';
import {
  Users,
  AlertTriangle,
  TrendingDown,
  Activity,
  CalendarOff,
  CheckCircle2,
  AlertCircle,
  PieChart,
  Clock,
  FileWarning,
  Flag,
  Target,
  Rocket
} from 'lucide-react';
import { Developer, DeveloperPlan, AbsenceType, Team, Project, AppUser, CalendarEvent } from '../types';
import { DAYS_OF_WEEK, WORK_HOURS_TARGET } from '../constants';
import { Avatar } from './Avatar';

interface DashboardProps {
  developers: Developer[];
  plans: DeveloperPlan[];
  teams: Team[];
  projects: Project[];
  users: AppUser[];
  events: CalendarEvent[];
}

const Dashboard: React.FC<DashboardProps> = ({ developers, plans, teams, projects, users, events }) => {
  // Use current real-time date for the dashboard
  const today = new Date();

  // Use addDays to simulate startOfWeek({ weekStartsOn: 1 }) to avoid import issues
  const currentWeekStart = useMemo(() => {
    const day = today.getDay();
    const diff = (day + 6) % 7;
    return addDays(today, -diff);
  }, [today]);

  const weekDays = Array.from({ length: DAYS_OF_WEEK }).map((_, i) => addDays(currentWeekStart, i));
  const weekDateStrings = weekDays.map(d => format(d, 'yyyy-MM-dd'));
  const todayStr = format(today, 'yyyy-MM-dd');

  // Helper to safe parse dates (replaces parseISO)
  const parseLocalISO = (dateStr: string) => {
    if (!dateStr) return new Date();
    // If it's a simple date string (YYYY-MM-DD), append time to ensure local parsing or standard behavior
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return new Date(`${dateStr}T00:00:00`);
    }
    return new Date(dateStr);
  };

  // Filter events for releases today
  const todaysReleases = useMemo(() => {
    const releases = events.filter(e => e.type === 'Release' && e.date === todayStr);

    // Group by project
    const groupedByProject = new Map<string, { project: Project | undefined, developers: Developer[] }>();

    releases.forEach(evt => {
      if (!evt.projectId || !evt.developerId) return;

      if (!groupedByProject.has(evt.projectId)) {
        groupedByProject.set(evt.projectId, {
          project: projects.find(p => p.id === evt.projectId),
          developers: []
        });
      }

      const dev = developers.find(d => d.id === evt.developerId);
      if (dev) {
        groupedByProject.get(evt.projectId)?.developers.push(dev);
      }
    });

    return Array.from(groupedByProject.values());
  }, [events, todayStr, projects, developers]);

  // Workload Statistics
  const stats = useMemo(() => {
    let totalCapacity = 0;
    let totalBooked = 0;

    const absentToday: { dev: Developer; type: AbsenceType }[] = [];
    const overloaded: { dev: Developer; booked: number; capacity: number }[] = [];
    const underloaded: { dev: Developer; booked: number; capacity: number }[] = [];
    const underutilizedToday: { dev: Developer; available: number }[] = [];
    const underutilizedToday: { dev: Developer; available: number }[] = [];

    developers.forEach(dev => {
      const plan = plans.find(p => p.developerId === dev.id);
      const dailyCap = dev.capacity || WORK_HOURS_TARGET;

      // 1. Check Absence Today
      const absenceToday = plan?.absences[todayStr];
      if (absenceToday && absenceToday !== AbsenceType.None) {
        absentToday.push({ dev, type: absenceToday });
      } else {
        // Calculate Today's Utilization
        const bookedToday = plan?.projects.reduce((sum, proj) => sum + (proj.allocations[todayStr] || 0), 0) || 0;
        if (bookedToday < dailyCap) {
          underutilizedToday.push({ dev, available: dailyCap - bookedToday });
        }
      }

      // 2. Calculate Weekly Stats
      let devWeeklyBooked = 0;
      let devWeeklyAbsenceHours = 0;

      weekDateStrings.forEach(dateStr => {
        // Sum allocations
        const dayAlloc = plan?.projects.reduce((sum, proj) => sum + (proj.allocations[dateStr] || 0), 0) || 0;
        devWeeklyBooked += dayAlloc;

        // Sum absences
        if (plan?.absences[dateStr] && plan.absences[dateStr] !== AbsenceType.None) {
          devWeeklyAbsenceHours += dailyCap;
        }
      });

      const devCapacity = (DAYS_OF_WEEK * dailyCap) - devWeeklyAbsenceHours;

      totalCapacity += devCapacity;
      totalBooked += devWeeklyBooked;

      // Categorize Workload
      if (devWeeklyBooked > devCapacity) {
        overloaded.push({ dev, booked: devWeeklyBooked, capacity: devCapacity });
      } else if (devWeeklyBooked < devCapacity && devCapacity > 0) {
        // Only count as underloaded if they actually have capacity (not fully on vacation)
        underloaded.push({ dev, booked: devWeeklyBooked, capacity: devCapacity });
      }
    });

    return {
      totalCapacity,
      totalBooked,
      utilization: totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0,
      absentToday,
      overloaded,
      underloaded,
      underutilizedToday
    };
  }, [developers, plans, todayStr, weekDateStrings]);

  // Project Statistics
  const projectStats = useMemo(() => {
    const riskCounts = { Green: 0, Yellow: 0, Red: 0 };
    const atRiskProjects: Project[] = [];
    const deadlineApproaching: { project: Project; daysLeft: number }[] = [];
    const staleReports: { project: Project; daysSince: number }[] = [];

    projects.forEach(p => {
      // Risk Counts
      const risk = p.riskLevel || 'Green';
      if (risk === 'Red') riskCounts.Red++;
      else if (risk === 'Yellow') riskCounts.Yellow++;
      else riskCounts.Green++;

      // At Risk List
      if (risk === 'Red' || risk === 'Yellow') {
        atRiskProjects.push(p);
      }

      // Deadlines (<= 30 days) including overdue
      if (p.deadline) {
        const daysLeft = differenceInCalendarDays(parseLocalISO(p.deadline), today);
        if (daysLeft <= 30) {
          deadlineApproaching.push({ project: p, daysLeft });
        }
      }

      // Stale Reports (> 7 days or missing)
      if (p.lastStatusUpdate) {
        const daysSince = differenceInCalendarDays(today, parseLocalISO(p.lastStatusUpdate));
        if (daysSince > 7) {
          staleReports.push({ project: p, daysSince });
        }
      } else {
        // Missing update considered stale
        staleReports.push({ project: p, daysSince: -1 }); // -1 indicates never
      }
    });

    // Sort at risk by severity (Red first)
    atRiskProjects.sort((a, b) => (a.riskLevel === 'Red' ? -1 : 1));

    // Sort deadlines by closest (most overdue first since negative numbers are smaller)
    deadlineApproaching.sort((a, b) => a.daysLeft - b.daysLeft);

    // Sort stale by longest (never updated first, then descending days)
    staleReports.sort((a, b) => {
      if (a.daysSince === -1) return -1;
      if (b.daysSince === -1) return 1;
      return b.daysSince - a.daysSince;
    });

    return { riskCounts, atRiskProjects, deadlineApproaching, staleReports };
  }, [projects, today]);


  const getTeamName = (teamId?: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Unassigned';
  };

  const getTeamColor = (teamId?: string) => {
    return teams.find(t => t.id === teamId)?.color || 'bg-slate-200 text-slate-700';
  };

  const getManager = (managerId?: string) => {
    return users.find(u => u.id === managerId);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* --- Top KPIs --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Capacity Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Weekly Utilization</div>
            <div className="text-2xl font-bold text-slate-800">{stats.utilization}%</div>
            <div className="text-xs text-slate-400 mt-1">
              {stats.totalBooked}h booked / {stats.totalCapacity}h available
            </div>
          </div>
        </div>

        {/* Absences Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <CalendarOff size={24} />
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Absent Today</div>
            <div className="text-2xl font-bold text-slate-800">{stats.absentToday.length}</div>
            <div className="text-xs text-slate-400 mt-1">People on leave</div>
          </div>
        </div>

        {/* Risk Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Workload Risks</div>
            <div className="text-2xl font-bold text-slate-800">{stats.overloaded.length}</div>
            <div className="text-xs text-slate-400 mt-1">Overloaded developers</div>
          </div>
        </div>

        {/* Out Today Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <CalendarOff size={24} />
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Out Today</div>
            <div className="text-2xl font-bold text-slate-800">{stats.absentToday.length}</div>
            <div className="text-xs text-slate-400 mt-1">On leave today</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* --- Workload Analysis --- */}
        <div className="space-y-6">
          {/* Overloaded List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-red-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center">
                <AlertCircle size={18} className="mr-2 text-red-500" />
                Overloaded (Current Week)
              </h3>
              <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded-full">
                {stats.overloaded.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {stats.overloaded.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">No overloaded resources. Great job!</div>
              ) : (
                stats.overloaded.map(item => (
                  <div key={item.dev.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Avatar name={item.dev.name} className="w-10 h-10 text-sm" />
                      <div>
                        <div className="font-medium text-slate-900">{item.dev.name}</div>
                        <div className="text-xs text-slate-500 flex items-center space-x-1">
                          <span className={`px-1.5 rounded-sm ${getTeamColor(item.dev.teamId).split(' ')[0]} bg-opacity-30`}>
                            {getTeamName(item.dev.teamId)}
                          </span>
                          <span>• {item.dev.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">{item.booked}h</div>
                      <div className="text-xs text-slate-400">of {item.capacity}h capacity</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Underutilized Today List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center">
                <CheckCircle2 size={18} className="mr-2 text-emerald-600" />
                Available Today ({format(today, 'MMM d')})
              </h3>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                {stats.underutilizedToday.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {stats.underutilizedToday.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">Everyone is fully booked today.</div>
              ) : (
                stats.underutilizedToday.map(item => (
                  <div key={item.dev.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Avatar name={item.dev.name} className="w-10 h-10 text-sm" />
                      <div>
                        <div className="font-medium text-slate-900">{item.dev.name}</div>
                        <div className="text-xs text-slate-500 flex items-center space-x-1">
                          <span className={`px-1.5 rounded-sm ${getTeamColor(item.dev.teamId).split(' ')[0]} bg-opacity-30`}>
                            {getTeamName(item.dev.teamId)}
                          </span>
                          <span>• {item.dev.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-600">{item.available}h</div>
                      <div className="text-xs text-slate-400">available</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Out Today List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-orange-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center">
                <CalendarOff size={18} className="mr-2 text-orange-600" />
                Out Today ({format(today, 'MMM d')})
              </h3>
              <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                {stats.absentToday.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {stats.absentToday.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">Everyone is available today.</div>
              ) : (
                stats.absentToday.map(item => (
                  <div key={item.dev.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Avatar name={item.dev.name} className="w-10 h-10 text-sm" />
                      <div>
                        <div className="font-medium text-slate-900">{item.dev.name}</div>
                        <div className="text-xs text-slate-500 flex items-center space-x-1">
                          <span className={`px-1.5 rounded-sm ${getTeamColor(item.dev.teamId).split(' ')[0]} bg-opacity-30`}>
                            {getTeamName(item.dev.teamId)}
                          </span>
                          <span>• {item.dev.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${item.type === AbsenceType.Vacation ? 'text-blue-600' :
                        item.type === AbsenceType.SickLeave ? 'text-red-600' :
                          'text-slate-600'
                        }`}>
                        {item.type}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Underloaded List (Weekly) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-yellow-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center">
                <TrendingDown size={18} className="mr-2 text-yellow-600" />
                Underutilized (Weekly)
              </h3>
              <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                {stats.underloaded.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {stats.underloaded.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">Everyone is fully booked this week.</div>
              ) : (
                stats.underloaded.map(item => (
                  <div key={item.dev.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Avatar name={item.dev.name} className="w-10 h-10 text-sm" />
                      <div>
                        <div className="font-medium text-slate-900">{item.dev.name}</div>
                        <div className="text-xs text-slate-500 flex items-center space-x-1">
                          <span className={`px-1.5 rounded-sm ${getTeamColor(item.dev.teamId).split(' ')[0]} bg-opacity-30`}>
                            {getTeamName(item.dev.teamId)}
                          </span>
                          <span>• {item.dev.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-yellow-600">{item.booked}h</div>
                      <div className="text-xs text-slate-400">{item.capacity - item.booked}h available</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* --- Right Col: Absences & Details --- */}
        <div className="space-y-6">
          {/* Absent Today List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-purple-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center">
                <CalendarOff size={18} className="mr-2 text-purple-500" />
                Out Today ({format(today, 'MMM d')})
              </h3>
              <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                {stats.absentToday.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {stats.absentToday.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <CheckCircle2 size={32} className="text-green-400" />
                  <div className="text-sm">Full attendance today!</div>
                </div>
              ) : (
                stats.absentToday.map(item => (
                  <div key={item.dev.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar name={item.dev.name} className="w-10 h-10 text-sm opacity-60" />
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{item.dev.name}</div>
                        <div className="text-xs text-slate-500">{item.dev.role}</div>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      {item.type}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Planned Releases Today */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
            <div className="px-6 py-4 border-b border-slate-100 bg-indigo-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center">
                <Rocket size={18} className="mr-2 text-indigo-500" />
                Planned Releases ({todaysReleases.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {todaysReleases.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <div className="bg-slate-50 p-2 rounded-full">
                    <Rocket size={20} className="text-slate-300" />
                  </div>
                  <span className="text-sm">No releases scheduled for today.</span>
                </div>
              ) : (
                todaysReleases.map((item, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${item.project?.color.split(' ')[0] || 'bg-slate-400'}`}></div>
                        <div className="font-bold text-slate-800 text-sm">{item.project?.name || 'Unknown Project'}</div>
                      </div>
                    </div>
                    {item.developers.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Devs:</span>
                        <div className="flex -space-x-1">
                          {item.developers.map(dev => (
                            <Avatar key={dev.id} name={dev.name} className="w-6 h-6 text-[10px] border-2 border-white" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- PROJECT HEALTH & STATUS SECTION --- */}
      <div className="mt-2 mb-6">
        <div className="flex items-center space-x-2 mb-4 px-1">
          <PieChart size={20} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">Project Health & Status</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1: Summary Stats */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center">
                <Target size={16} className="mr-2 text-slate-400" /> Risk Distribution
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{projectStats.riskCounts.Green}</div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide mt-1">On Track</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{projectStats.riskCounts.Yellow}</div>
                  <div className="text-[10px] font-bold text-yellow-800 uppercase tracking-wide mt-1">At Risk</div>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{projectStats.riskCounts.Red}</div>
                  <div className="text-[10px] font-bold text-red-800 uppercase tracking-wide mt-1">Critical</div>
                </div>
              </div>
            </div>

            {/* Approaching Deadlines */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[300px]">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 flex items-center">
                  <Clock size={16} className="mr-2 text-indigo-500" /> Due Soon (30 Days)
                </h3>
              </div>
              <div className="overflow-y-auto flex-1 p-0">
                {projectStats.deadlineApproaching.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">No imminent deadlines.</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {projectStats.deadlineApproaching.map(({ project, daysLeft }) => (
                      <div key={project.id} className={`p-3 hover:bg-slate-50 transition-colors flex justify-between items-center ${daysLeft <= 0 ? 'bg-red-50/50' : ''}`}>
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${project.color.split(' ')[0]}`}></div>
                          <div className="text-sm font-medium text-slate-700 truncate">{project.name}</div>
                        </div>
                        <div className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${daysLeft <= 0 ? 'bg-red-600 text-white font-bold shadow-sm' : daysLeft <= 7 ? 'bg-red-100 text-red-700' : 'bg-indigo-50 text-indigo-700'}`}>
                          {daysLeft === 0 ? 'Due Today' : daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Col 2: Projects At Risk */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
              <div className="px-5 py-3 border-b border-slate-100 bg-red-50/30 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 flex items-center">
                  <AlertTriangle size={16} className="mr-2 text-red-500" /> Attention Required
                </h3>
                {projectStats.atRiskProjects.length > 0 && (
                  <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {projectStats.atRiskProjects.length}
                  </span>
                )}
              </div>
              <div className="overflow-y-auto flex-1 max-h-[400px]">
                {projectStats.atRiskProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
                    <p className="text-sm">All projects are on track!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {projectStats.atRiskProjects.map(proj => {
                      const mgr = getManager(proj.managerId);
                      return (
                        <div key={proj.id} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${proj.color.split(' ')[0]}`}></div>
                              <span className="font-semibold text-slate-800 text-sm">{proj.name}</span>
                            </div>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${proj.riskLevel === 'Red' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {proj.riskLevel}
                            </span>
                          </div>

                          {/* Risk Desc */}
                          <div className="bg-red-50/50 p-2 rounded text-xs text-slate-700 mb-2 border-l-2 border-red-200">
                            <span className="font-bold text-red-800 block mb-0.5">Risk:</span>
                            {proj.riskDescription || "No details provided."}
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            {/* Short Update */}
                            <div className="flex-1 min-w-0 mr-4">
                              {proj.shortUpdate && (
                                <div className="text-xs text-slate-500 flex items-start gap-1.5 truncate">
                                  <Flag size={12} className="mt-0.5 flex-shrink-0 text-slate-400" />
                                  <span className="italic truncate">"{proj.shortUpdate}"</span>
                                </div>
                              )}
                            </div>

                            {/* Responsible Manager */}
                            {mgr && (
                              <div className="flex items-center space-x-1.5 flex-shrink-0" title={`Owner: ${mgr.name}`}>
                                <span className="text-[10px] text-slate-400">Owner:</span>
                                <Avatar name={mgr.name} className="w-5 h-5 text-[8px]" />
                                <span className="text-[11px] text-slate-600 font-medium">{mgr.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Col 3: Stale Reports */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 flex items-center">
                  <FileWarning size={16} className="mr-2 text-slate-400" /> Stale Reports ({'>'}7 days)
                </h3>
                {projectStats.staleReports.length > 0 && (
                  <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                    {projectStats.staleReports.length}
                  </span>
                )}
              </div>
              <div className="overflow-y-auto flex-1 max-h-[400px]">
                {projectStats.staleReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <CheckCircle2 size={32} className="text-indigo-300 mb-2" />
                    <p className="text-sm">All statuses updated recently.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {projectStats.staleReports.map(({ project, daysSince }) => {
                      const mgr = getManager(project.managerId);
                      return (
                        <div key={project.id} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                          <div className="flex items-center space-x-3 overflow-hidden flex-1">
                            <div className={`w-8 h-8 rounded flex items-center justify-center text-xs text-white font-bold flex-shrink-0 ${project.color.split(' ')[0]}`}>
                              {daysSince === -1 ? '!' : daysSince}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-800 truncate">{project.name}</div>
                              <div className="text-xs text-slate-400 flex items-center gap-2">
                                <span>{daysSince === -1 ? 'Never updated' : `${daysSince} days ago`}</span>
                                {mgr && (
                                  <div className="flex items-center gap-1.5" title={`Owner: ${mgr.name}`}>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                      <Avatar name={mgr.name} className="w-4 h-4 text-[7px]" />
                                      <span className="text-slate-500">{mgr.name}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <button className="text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Update
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
