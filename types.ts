
export enum Role {
  Backend = 'Backend',
  Frontend = 'Frontend',
  QA = 'QA',
}

export type Level = 'Junior' | 'Mid' | 'Senior' | 'Lead';

export enum AbsenceType {
  None = 'None',
  Vacation = 'Vacation',
  SickLeave = 'Sick Leave',
}

export interface Team {
  id: string;
  name: string;
  color: string; // Tailwind bg class usually
}

export interface Developer {
  id: string;
  name: string;
  role: Role;
  level: Level;
  avatar: string;
  teamId?: string;
  capacity?: number; // Daily capacity in hours, default 8
}

export type Priority = 'High' | 'Medium' | 'Low';
export type RiskLevel = 'Green' | 'Yellow' | 'Red';
export type Stack = 'Magento 1' | 'Magento 2' | 'Magento 2 Hyva' | 'Shopify' | 'Wordpress' | 'Shopware' | 'Custom';

export interface Subproject {
  id: string;
  name: string;
  deadline: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  // Status Report Fields
  priority?: Priority;
  subproject?: string; // Legacy/Primary
  deadline?: string;   // Legacy/Primary
  subprojects?: Subproject[];
  riskLevel?: RiskLevel;
  riskDescription?: string;
  lastStatusUpdate?: string; // ISO Date String
  shortUpdate?: string;
  managerId?: string; // ID of the AppUser responsible
  stack?: Stack;
}

// Map 'YYYY-MM-DD' to number of hours
export interface DailyAllocation {
  [date: string]: number;
}

export interface AssignedProject {
  projectId: string;
  allocations: DailyAllocation;
}

// Map 'YYYY-MM-DD' to AbsenceType
export interface AbsenceRecord {
  [date: string]: AbsenceType;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'Release' | 'Milestone';
  title: string;
  developerId?: string;
  projectId?: string;
}

export interface DeveloperPlan {
  developerId: string;
  projects: AssignedProject[];
  absences: AbsenceRecord;
}

export interface WeeklyInsight {
  status: 'success' | 'loading' | 'error' | 'idle';
  text: string;
}

export enum UserRole {
  Admin = 'Admin',
  ProjectManager = 'Project Manager',
  TeamMate = 'Team Mate'
}

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
}

export interface RiskLog {
  id: string;
  projectId: string;
  date: string; // ISO String
  riskLevel: RiskLevel;
  riskDescription: string;
  updatedBy?: string; // User ID
}
