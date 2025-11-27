# Capacity Planning Application - Project Documentation

## 1. Project Overview
The **Capacity Planning Application** is a comprehensive resource management tool designed for engineering teams. It enables administrators and project managers to visualize workload distribution, manage project timelines, track risks, and ensure optimal team utilization through a responsive, interactive web interface.

## 2. Technical Stack
- **Frontend Framework**: React 19 (Hooks, Context, Functional Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Utility-first CSS)
- **Database**: Dexie.js (IndexedDB wrapper for client-side persistence)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **AI Integration**: Google Gemini API (`@google/genai`) for capacity insights

---

## 3. Core Modules & Features

### A. Authentication & User Management
- **Login Screen**: Custom glassmorphism design with blurred background.
- **Mock Credentials**: One-click login for testing different roles (Admin, Project Manager, Team Mate).
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full access to all modules, including User Settings.
  - **Project Manager**: Can edit Planner and Projects but cannot delete Projects or manage Users/Teams.
  - **Team Mate**: Read-only access restricted strictly to the Planner view.
- **User Settings**: CRUD operations for system users with role assignment.

### B. Dashboard
A high-level command center displaying real-time statistics:
- **KPI Cards**: Weekly Utilization %, Absent Today count, and Workload Risks.
- **Workload Analysis**:
  - **Overloaded**: Developers booked beyond their daily capacity.
  - **Underutilized**: Developers with available hours.
- **Project Health**:
  - **Risk Distribution**: Pie-chart style summary of Green/Yellow/Red projects.
  - **Due Soon**: Projects with deadlines within 30 days. *Highlights overdue projects in bright red.*
  - **Attention Required**: Projects marked as 'Yellow' or 'Red' risk, displaying the responsible manager.
  - **Stale Reports**: Projects not updated in >7 days.
- **Planned Releases**: Dedicated section displaying projects scheduled for release today, including the specific developers involved.

### C. Resource Planner (The Grid)
The central workspace for allocation management:
- **Views**: Toggle between **Weekly** (5 days) and **Biweekly** (10 days) views.
- **Layout**: Full-width responsive grid with sticky headers for scrolling large datasets.
- **Allocations**:
  - Input hours per project per day.
  - Visual indicators for Overload (Red), Optimal (Green), and Underload (Yellow) based on individual developer capacity.
- **Project Assignment**:
  - Interactive "+" button to assign projects to developers.
  - Smart dropdown with z-index handling to prevent UI clipping.
- **Absence Management**: Toggle status between "None", "Vacation" (Purple), and "Sick Leave" (Pink).
- **Event Markers (Releases)**:
  - **Toggle**: Users can mark specific allocation cells as "Release" events via a hover icon.
  - **Visuals**: Displays "Release" label in red text alongside the booked hours.
  - **Granularity**: Events are linked to specific Developer + Project + Date combinations.

### D. Project Management
A structured list view for managing the project portfolio:
- **List View**: Table layout displaying Project Name, Tech Stack, Status, Manager, Deadlines, and Actions.
- **Status Reporting**:
  - **Priority**: High/Medium/Low indicators.
  - **Risk Level**: Green/Yellow/Red badges with mandatory descriptions for risks.
  - **Short Update**: Free-text field for quick status summaries.
- **Subprojects**:
  - Dynamic list of sub-deliverables within a project.
  - Individual deadlines per subproject.
  - Visualized with hierarchical icons (`CornerDownRight`).
- **Tech Stack**: Dropdown to define technologies (Magento, Shopify, Custom, etc.).
- **Ownership**: Assign a "Responsible Project Manager" to every project.
- **Validation**: Custom "Delete Confirmation" modal to prevent accidental data loss.

### E. Team Management
Manage the organizational structure:
- **Developers**:
  - Track Role (Frontend, Backend, QA) and Seniority Level.
  - **Daily Capacity**: Customizable work hours per developer (e.g., 4h for part-time, 8h for full-time).
  - Assign to specific Teams.
- **Teams**: Create and color-code teams (Squads) to group developers in the Planner.
- **Visuals**: Initials-based Avatars generated automatically on an Indigo background.

### F. Risk History Log
A dedicated audit trail for project status changes:
- **Purpose**: Provides a historical timeline of all risk assessments to track project health trends over time.
- **Automated Logging**: The system automatically records a log entry whenever a project's **Risk Level** or **Risk Description** is updated in the Project Management module.
- **Data Captured**:
  - Timestamp of the change.
  - Project Name.
  - New Risk Level (Green/Yellow/Red).
  - Risk Description/Comment.
  - User who made the update.
- **Visualization**: A vertical timeline dashboard displaying changes in chronological order.
- **Filtering**: Users can filter the timeline to view the history of a specific project.

---

## 4. Database Schema (IndexedDB/SQLite)

The application uses a normalized schema via `sql.js` (SQLite in browser).

| Table | Description | Key Fields |
| :--- | :--- | :--- |
| **users** | System users | `id`, `name`, `role`, `email` |
| **teams** | Engineering squads | `id`, `name`, `color` |
| **developers** | Resource profiles | `id`, `name`, `role`, `teamId`, `capacity` |
| **projects** | Project metadata | `id`, `name`, `riskLevel`, `managerId`, `subprojects`, `stack` |
| **assignments** | Dev-Project links | `developerId`, `projectId` |
| **allocations** | Daily hours | `developerId`, `projectId`, `date`, `hours` |
| **absences** | Leave records | `developerId`, `date`, `type` |
| **events** | Calendar markers | `id`, `date`, `type`, `developerId`, `projectId` |
| **risk_logs** | Historical audit trail | `id`, `projectId`, `date`, `riskLevel`, `riskDescription`, `updatedBy` |

---

## 5. Visual & UX Improvements
Throughout the development, specific emphasis was placed on:
1.  **Z-Index Layering**: Ensuring dropdowns and sticky headers do not overlap incorrectly.
2.  **Tooltips**: Hover states for project managers, full names, and project details.
3.  **Color Coding**:
    - **Risks**: Green (Emerald), Yellow (Amber), Red (Red).
    - **Status**: Visual styling for "Stale" (Red text) vs "Recent" (Slate text) updates.
4.  **Responsive Design**: The planner stretches to fill the screen; lists use scrolling containers.

## 6. AI Integration
- **Service**: `services/geminiService.ts`
- **Function**: Aggregates planner data and sends a prompt to Google Gemini.
- **Output**: Returns strategic advice on balancing the schedule, identifying bottlenecks, and suggesting moves.