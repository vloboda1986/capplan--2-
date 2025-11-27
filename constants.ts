
import { AbsenceType, AppUser, Developer, DeveloperPlan, Project, Role, Team, UserRole } from "./types";

export const MOCK_TEAMS: Team[] = [
  { id: 't1', name: 'Alpha Squad', color: 'bg-indigo-100 text-indigo-800' },
  { id: 't2', name: 'Beta Force', color: 'bg-emerald-100 text-emerald-800' },
];

export const MOCK_DEVELOPERS: Developer[] = [
  { id: 'd1', name: 'Alice Chen', role: Role.Frontend, level: 'Senior', avatar: 'https://picsum.photos/32/32?random=1', teamId: 't1' },
  { id: 'd2', name: 'Bob Smith', role: Role.Backend, level: 'Mid', avatar: 'https://picsum.photos/32/32?random=2', teamId: 't1' },
  { id: 'd3', name: 'Charlie Davis', role: Role.QA, level: 'Junior', avatar: 'https://picsum.photos/32/32?random=3', teamId: 't2' },
  { id: 'd4', name: 'Diana Prince', role: Role.Backend, level: 'Lead', avatar: 'https://picsum.photos/32/32?random=4', teamId: 't2' },
];

export const MOCK_APP_USERS: AppUser[] = [
  { id: 'u1', name: 'Admin User', role: UserRole.Admin, email: 'admin@company.com' },
  { id: 'u2', name: 'PM User', role: UserRole.ProjectManager, email: 'pm@company.com' },
  { id: 'u3', name: 'Dev User', role: UserRole.TeamMate, email: 'dev@company.com' }
];

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'E-Commerce Platform', color: 'bg-blue-200 text-blue-800', managerId: 'u2' },
  { id: 'p2', name: 'Internal Dashboard', color: 'bg-green-200 text-green-800', managerId: 'u2' },
  { id: 'p3', name: 'Mobile App API', color: 'bg-purple-200 text-purple-800', managerId: 'u1' },
  { id: 'p4', name: 'Website Redesign', color: 'bg-orange-200 text-orange-800' },
];

export const PROJECT_COLORS = [
  { label: 'Blue', value: 'bg-blue-200 text-blue-800' },
  { label: 'Green', value: 'bg-green-200 text-green-800' },
  { label: 'Purple', value: 'bg-purple-200 text-purple-800' },
  { label: 'Orange', value: 'bg-orange-200 text-orange-800' },
  { label: 'Red', value: 'bg-red-200 text-red-800' },
  { label: 'Teal', value: 'bg-teal-200 text-teal-800' },
  { label: 'Indigo', value: 'bg-indigo-200 text-indigo-800' },
  { label: 'Pink', value: 'bg-pink-200 text-pink-800' },
  { label: 'Yellow', value: 'bg-yellow-200 text-yellow-800' },
  { label: 'Gray', value: 'bg-slate-200 text-slate-800' },
];

export const INITIAL_PLANS: DeveloperPlan[] = [
  {
    developerId: 'd1',
    projects: [
      { projectId: 'p1', allocations: {} },
      { projectId: 'p4', allocations: {} }
    ],
    absences: {}
  },
  {
    developerId: 'd2',
    projects: [
      { projectId: 'p3', allocations: {} }
    ],
    absences: {}
  },
  {
    developerId: 'd3',
    projects: [
      { projectId: 'p1', allocations: {} },
      { projectId: 'p2', allocations: {} }
    ],
    absences: {}
  },
  {
    developerId: 'd4',
    projects: [],
    absences: {}
  }
];

export const DAYS_OF_WEEK = 5;
export const WORK_HOURS_TARGET = 8;
