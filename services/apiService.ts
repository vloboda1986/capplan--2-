import { DeveloperPlan, AssignedProject, AbsenceRecord, AbsenceType, Developer, Project, Team, AppUser, CalendarEvent, RiskLog } from '../types';

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
    await fetch(`${API_BASE}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(team)
    });
};

export const deleteTeam = async (id: string) => {
    // Not implemented in API yet, but would be DELETE /api/teams/:id
    console.warn('deleteTeam not fully implemented in API');
};

// --- Developers ---
export const getDevelopers = async (): Promise<Developer[]> => {
    const res = await fetch(`${API_BASE}/developers`);
    return res.json();
};

export const saveDeveloper = async (developer: Developer) => {
    // Check if exists to decide PUT vs POST, or just use POST if upsert logic is there
    // For now assuming POST handles creation/update or we use PUT for update
    // The backend route for POST creates, PUT updates.
    // We'll try POST first, if it fails (duplicate), we might need logic.
    // Actually, let's just use POST for now as our backend is simple.
    // Wait, my backend POST creates new. PUT updates by ID.
    // I should check if ID exists.
    // For simplicity, I'll use a helper to check or just try PUT first.

    // Let's try to fetch first? No that's slow.
    // Let's assume we use PUT if we have an ID and it exists?
    // The UI usually calls saveDeveloper with an existing ID.

    // Let's use a simple upsert logic if possible, or just try PUT.
    // If PUT 404s, then POST.

    const res = await fetch(`${API_BASE}/developers/${developer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(developer)
    });

    if (!res.ok) {
        // If PUT failed (likely 404 or 400), try POST
        await fetch(`${API_BASE}/developers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(developer)
        });
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
    // Similar upsert logic
    const res = await fetch(`${API_BASE}/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
    });

    if (!res.ok) {
        await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
        });
    }
};

export const deleteProject = async (id: string) => {
    await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
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

// --- Risk Logs ---
export const getRiskLogs = async (): Promise<RiskLog[]> => {
    // Not implemented in API yet
    return [];
};

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
