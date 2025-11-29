import { DeveloperPlan, AssignedProject, AbsenceRecord, AbsenceType, Developer, Project, Team, AppUser, CalendarEvent, RiskLog, Task } from '../types';

const API_BASE = '/api';

export const initData = async () => {
  // No-op for API
};

// --- Teams ---
export const getTeams = async (): Promise<Team[]> => {
  const res = await fetch(`${API_BASE}/teams`);
  return res.json();
};

export const saveTeam = async (team: Team) => {
  try {
    // Try to update first
    const res = await fetch(`${API_BASE}/teams/${team.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team)
    });

    if (!res.ok) {
      if (res.status === 404) {
        // If not found, create new
        const createRes = await fetch(`${API_BASE}/teams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(team)
        });
        if (!createRes.ok) throw new Error('Failed to create team');
      } else {
        throw new Error('Failed to update team');
      }
    }
  } catch (error) {
    console.error('Error saving team:', error);
    throw error;
  }
};

export const deleteTeam = async (id: string) => {
  await fetch(`${API_BASE}/teams/${id}`, {
    method: 'DELETE'
  });
};

// --- Developers ---
export const getDevelopers = async (): Promise<Developer[]> => {
  const res = await fetch(`${API_BASE}/developers`);
  return res.json();
};

export const saveDeveloper = async (developer: Developer) => {
  try {
    // Try PUT first (update existing)
    const putRes = await fetch(`${API_BASE}/developers/${developer.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(developer)
    });

    if (putRes.ok) {
      return await putRes.json();
    }

    // If PUT failed, try POST (create new)
    const postRes = await fetch(`${API_BASE}/developers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(developer)
    });

    if (!postRes.ok) {
      const error = await postRes.text();
      throw new Error(`Failed to save developer: ${error}`);
    }

    return await postRes.json();
  } catch (error) {
    console.error('Error saving developer:', error);
    throw error;
  }
};

export const deleteDeveloper = async (id: string) => {
  await fetch(`${API_BASE}/developers/${id}`, { method: 'DELETE' });
};

// --- Projects ---
export const getProjects = async (): Promise<Project[]> => {
  const res = await fetch(`${API_BASE}/projects`);
  return res.json();
};

export const saveProject = async (project: Project, currentUserId?: string) => {
  try {
    // Try PUT first (update existing)
    const putRes = await fetch(`${API_BASE}/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });

    if (putRes.ok) {
      return await putRes.json();
    }

    // If PUT failed, try POST (create new)
    const postRes = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });

    if (!postRes.ok) {
      const error = await postRes.text();
      throw new Error(`Failed to save project: ${error}`);
    }

    return await postRes.json();
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
};

export const deleteProject = async (id: string) => {
  await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
};

export const deleteAbsence = async (id: string) => {
  await fetch(`${API_BASE}/absences/${id}`, { method: 'DELETE' });
};

// --- Risk Logs ---
export const getRiskLogs = async (): Promise<RiskLog[]> => {
  const res = await fetch(`${API_BASE}/risk-logs`);
  return await res.json();
};

export const saveRiskLog = async (log: RiskLog) => {
  const res = await fetch(`${API_BASE}/risk-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log)
  });
  return await res.json();
};

// --- App Users ---
export const getAppUsers = async (): Promise<AppUser[]> => {
  const res = await fetch(`${API_BASE}/users`);
  return res.json();
};

export const saveAppUser = async (user: AppUser) => {
  await fetch(`${API_BASE}/users/${user.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
};

export const deleteAppUser = async (id: string) => {
  await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE'
  });
};

// --- Events ---
export const getEvents = async (): Promise<CalendarEvent[]> => {
  const res = await fetch(`${API_BASE}/events`);
  return res.json();
};

export const saveEvent = async (event: CalendarEvent) => {
  await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
};

export const deleteEvent = async (id: string) => {
  // Not implemented
};

// --- Tasks ---
export const getTasks = async (): Promise<Task[]> => {
  const res = await fetch(`${API_BASE}/tasks`);
  return res.json();
};

export const saveTask = async (task: Task) => {
  await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
};

export const deleteTask = async (id: string) => {
  await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE'
  });
};

// --- Risk Logs ---
// Implemented above

// --- Plans ---
export const getPlans = async (): Promise<DeveloperPlan[]> => {
  // Fetch all raw data
  const [devs, assignments, allocations, absences] = await Promise.all([
    fetch(`${API_BASE}/developers`).then(r => r.json()),
    fetch(`${API_BASE}/assignments`).then(r => r.json()),
    fetch(`${API_BASE}/allocations`).then(r => r.json()),
    fetch(`${API_BASE}/absences`).then(r => r.json())
  ]);

  return devs.map((dev: any) => {
    // 1. Get assignments for this dev
    const devAssignments = assignments.filter((a: any) => a.developerId === dev.id);

    // 2. Build Projects array
    const projects: AssignedProject[] = devAssignments.map((assign: any) => {
      const projAllocations = allocations.filter(
        (a: any) => a.developerId === dev.id && a.projectId === assign.projectId
      );

      const allocationsMap: Record<string, number> = {};
      projAllocations.forEach((a: any) => {
        allocationsMap[a.date] = a.hours;
      });

      return {
        projectId: assign.projectId,
        allocations: allocationsMap
      };
    });

    // 3. Build Absences map
    const devAbsences = absences.filter((a: any) => a.developerId === dev.id);
    const absencesMap: AbsenceRecord = {};
    devAbsences.forEach((a: any) => {
      absencesMap[a.date] = a.type;
    });

    return {
      developerId: dev.id,
      projects,
      absences: absencesMap
    };
  });
};

export const updateAllocation = async (developerId: string, projectId: string, date: string, hours: number) => {
  await fetch(`${API_BASE}/allocations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ developerId, projectId, date, hours })
  });
};

export const updateAbsence = async (developerId: string, date: string, type: AbsenceType) => {
  await fetch(`${API_BASE}/absences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ developerId, date, type })
  });
};

export const assignProject = async (developerId: string, projectId: string) => {
  await fetch(`${API_BASE}/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ developerId, projectId })
  });
};

export const removeAssignment = async (developerId: string, projectId: string) => {
  await fetch(`${API_BASE}/assignments`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ developerId, projectId })
  });
};
