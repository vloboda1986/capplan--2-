
import React, { useState, useEffect } from 'react';
import {
  Users,
  LayoutGrid,
  Settings as SettingsIcon,
  Briefcase,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  History
} from 'lucide-react';
import Planner from './components/Planner';
import TeamManager from './components/TeamManager';
import ProjectManager from './components/ProjectManager';
import Dashboard from './components/Dashboard';
import RiskDashboard from './components/RiskDashboard';
import Settings from './components/Settings';
import Login from './components/Login';
import { Developer, Project, DeveloperPlan, AbsenceType, Team, AppUser, UserRole, RiskLog, CalendarEvent } from './types';
import * as DataService from './services/dataService';
import { Avatar } from './components/Avatar';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Data State
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [plans, setPlans] = useState<DeveloperPlan[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [riskLogs, setRiskLogs] = useState<RiskLog[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Session State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Load Data
  const loadData = async () => {
    try {
      const devs = await DataService.getDevelopers();
      const projs = await DataService.getProjects();
      const currentPlans = await DataService.getPlans();
      const currentTeams = await DataService.getTeams();
      const users = await DataService.getAppUsers();
      const logs = await DataService.getRiskLogs();
      const currentEvents = await DataService.getEvents();

      setDevelopers(devs);
      setProjects(projs);
      setPlans(currentPlans);
      setTeams(currentTeams);
      setAppUsers(users);
      setRiskLogs(logs);
      setEvents(currentEvents);

      // Note: We removed the auto-login logic to ensure the Login screen appears first.

    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await DataService.initData();
      await loadData();
    };
    init();
  }, []);

  // Handlers
  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    // Redirect based on role if necessary
    if (user.role === UserRole.TeamMate) {
      setActiveTab('planner');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsUserMenuOpen(false);
  };

  const handleUpdateAllocation = async (devId: string, projId: string, date: string, hours: number) => {
    await DataService.updateAllocation(devId, projId, date, hours);
    await loadData();
  };

  const handleUpdateAbsence = async (devId: string, date: string, type: AbsenceType) => {
    // If setting vacation or sick leave, clear all allocations for that day
    if (type === AbsenceType.Vacation || type === AbsenceType.SickLeave) {
      const plan = plans.find(p => p.developerId === devId);
      if (plan) {
        // Clear all project allocations for this developer on this date
        for (const project of plan.projects) {
          if (project.allocations[date] && project.allocations[date] > 0) {
            await DataService.updateAllocation(devId, project.projectId, date, 0);
          }
        }
      }
    }

    await DataService.updateAbsence(devId, date, type);
    await loadData();
  };

  const handleAssignProject = async (devId: string, projId: string) => {
    await DataService.assignProject(devId, projId);
    await loadData();
  };

  const handleRemoveProject = async (devId: string, projId: string) => {
    await DataService.removeAssignment(devId, projId);
    await loadData();
  };

  // Team Manager Handlers
  const handleSaveDeveloper = async (dev: Developer) => {
    await DataService.saveDeveloper(dev);
    await loadData();
  };

  const handleDeleteDeveloper = async (id: string) => {
    await DataService.deleteDeveloper(id);
    await loadData();
  };

  const handleSaveTeam = async (team: Team) => {
    await DataService.saveTeam(team);
    await loadData();
  };

  const handleDeleteTeam = async (id: string) => {
    await DataService.deleteTeam(id);
    await loadData();
  };

  // Project Manager Handlers
  const handleSaveProject = async (proj: Project) => {
    // Pass current user ID for logging
    await DataService.saveProject(proj, currentUser?.id);

    // Check for risk updates and log if necessary
    if (proj.riskLevel === 'Yellow' || proj.riskLevel === 'Red') {
      const riskLog: RiskLog = {
        id: crypto.randomUUID(),
        projectId: proj.id,
        date: new Date().toISOString(),
        riskLevel: proj.riskLevel,
        riskDescription: proj.riskDescription || '',
        updatedBy: currentUser?.id
      };
      await DataService.saveRiskLog(riskLog);
    }

    await loadData();
  };

  const handleDeleteProject = async (id: string) => {
    await DataService.deleteProject(id);
    await loadData();
  };

  // User Settings Handlers
  const handleSaveUser = async (user: AppUser) => {
    await DataService.saveAppUser(user);
    await loadData();
  };

  const handleDeleteUser = async (id: string) => {
    await DataService.deleteAppUser(id);
    await loadData();
  };

  // --- Permission Logic ---
  const getPermissions = () => {
    if (!currentUser) return {
      plannerReadOnly: true,
      teamReadOnly: true,
      project: { canCreate: false, canEdit: false, canDelete: false },
      showSettings: false,
      canViewDashboard: false,
      canViewTeam: false,
      canViewProjects: false,
      canViewRiskLog: false
    };

    switch (currentUser.role) {
      case UserRole.Admin:
        return {
          plannerReadOnly: false,
          teamReadOnly: false,
          project: { canCreate: true, canEdit: true, canDelete: true },
          showSettings: true,
          canViewDashboard: true,
          canViewTeam: true,
          canViewProjects: true,
          canViewRiskLog: true
        };
      case UserRole.ProjectManager:
        return {
          plannerReadOnly: false,
          teamReadOnly: true, // PMs can't change team structure
          project: { canCreate: false, canEdit: true, canDelete: false }, // PMs manage status but don't delete/create
          showSettings: false,
          canViewDashboard: true,
          canViewTeam: true,
          canViewProjects: true,
          canViewRiskLog: true
        };
      case UserRole.TeamMate:
        return {
          plannerReadOnly: true,
          teamReadOnly: true,
          project: { canCreate: false, canEdit: false, canDelete: false },
          showSettings: false,
          canViewDashboard: false,
          canViewTeam: false,
          canViewProjects: false,
          canViewRiskLog: false
        };
      default:
        return {
          plannerReadOnly: true,
          teamReadOnly: true,
          project: { canCreate: false, canEdit: false, canDelete: false },
          showSettings: false,
          canViewDashboard: false,
          canViewTeam: false,
          canViewProjects: false,
          canViewRiskLog: false
        };
    }
  };

  const perms = getPermissions();

  if (loading) {
    return (
      <div className="flex h-screen w-screen bg-slate-100 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium">Loading Resource Data...</p>
        </div>
      </div>
    );
  }

  // Authentication Guard
  if (!currentUser) {
    return <Login users={appUsers} onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-100 text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="w-16 md:w-20 flex-shrink-0 bg-slate-900 flex flex-col items-center py-6 space-y-8 z-50">
        <img src="/logo-sidebar.png" alt="Logo" className="w-10 h-10" />

        <nav className="flex flex-col w-full space-y-2">
          {perms.canViewDashboard && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full p-3 flex justify-center transition-colors relative ${activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-100'}`}
              title="Dashboard"
            >
              <LayoutDashboard size={24} />
              {activeTab === 'dashboard' && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-l-full"></div>}
            </button>
          )}

          <button
            onClick={() => setActiveTab('planner')}
            className={`w-full p-3 flex justify-center transition-colors relative ${activeTab === 'planner' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-100'}`}
            title="Planner"
          >
            <LayoutGrid size={24} />
            {activeTab === 'planner' && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-l-full"></div>}
          </button>

          {perms.canViewTeam && (
            <button
              onClick={() => setActiveTab('team')}
              className={`w-full p-3 flex justify-center transition-colors relative ${activeTab === 'team' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-100'}`}
              title="Team"
            >
              <Users size={24} />
              {activeTab === 'team' && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-l-full"></div>}
            </button>
          )}

          {perms.canViewProjects && (
            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full p-3 flex justify-center transition-colors relative ${activeTab === 'projects' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-100'}`}
              title="Projects"
            >
              <Briefcase size={24} />
              {activeTab === 'projects' && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-l-full"></div>}
            </button>
          )}

          {perms.canViewRiskLog && (
            <button
              onClick={() => setActiveTab('risks')}
              className={`w-full p-3 flex justify-center transition-colors relative ${activeTab === 'risks' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-100'}`}
              title="Risk History Log"
            >
              <History size={24} />
              {activeTab === 'risks' && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-l-full"></div>}
            </button>
          )}
        </nav>

        <div className="mt-auto">
          {perms.showSettings && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-3 transition-colors ${activeTab === 'settings' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="Settings"
            >
              <SettingsIcon size={22} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 flex-shrink-0 z-[120]">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">Capacity Planning</h1>
              <p className="text-xs text-slate-500">Manage team allocations and workload distribution</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {activeTab === 'planner' && (
              <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-slate-500">
                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Optimal</div>
                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Overload</div>
                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span> Under</div>
              </div>
            )}

            {/* User Profile / Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <Avatar name={currentUser?.name || 'User'} className="w-8 h-8 text-xs bg-indigo-100 text-indigo-700 border border-indigo-200" />
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-700 leading-none">{currentUser?.name}</div>
                  <div className="text-[10px] text-slate-400 leading-none mt-0.5">{currentUser?.role}</div>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Session</div>
                    <div className="text-sm font-medium text-slate-800 truncate">{currentUser.name}</div>
                    <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                  </div>
                  <div className="px-1 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center"
                    >
                      <LogOut size={14} className="mr-2" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-4 md:p-6 overflow-hidden">
          {activeTab === 'dashboard' && perms.canViewDashboard && (
            <Dashboard
              developers={developers}
              plans={plans}
              teams={teams}
              projects={projects}
              users={appUsers}
              events={events}
            />
          )}

          {activeTab === 'planner' && (
            <Planner
              developers={developers}
              projects={projects}
              plans={plans}
              teams={teams}
              onUpdateAllocation={handleUpdateAllocation}
              onUpdateAbsence={handleUpdateAbsence}
              onAssignProject={handleAssignProject}
              onRemoveProject={handleRemoveProject}
              readOnly={perms.plannerReadOnly}
            />
          )}

          {activeTab === 'team' && perms.canViewTeam && (
            <TeamManager
              developers={developers}
              teams={teams}
              onSave={handleSaveDeveloper}
              onDelete={handleDeleteDeveloper}
              onSaveTeam={handleSaveTeam}
              onDeleteTeam={handleDeleteTeam}
              readOnly={perms.teamReadOnly}
            />
          )}

          {activeTab === 'projects' && perms.canViewProjects && (
            <ProjectManager
              projects={projects}
              users={appUsers}
              onSave={handleSaveProject}
              onDelete={handleDeleteProject}
              canCreate={perms.project.canCreate}
              canEdit={perms.project.canEdit}
              canDelete={perms.project.canDelete}
            />
          )}

          {activeTab === 'risks' && perms.canViewRiskLog && (
            <RiskDashboard
              projects={projects}
              riskLogs={riskLogs}
              users={appUsers}
            />
          )}

          {activeTab === 'settings' && perms.showSettings && (
            <Settings
              users={appUsers}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
