# Capacity Planning App - Test Cases

## 1. Authentication & Role-Based Access Control (RBAC)

| ID | Title | Pre-Conditions | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Admin Login | App loaded, on Login screen | 1. Click "Admin User" in Test Credentials.<br>2. Click "Sign In". | User logs in. Sidebar shows: Dashboard, Planner, Team, Projects, Settings. |
| **AUTH-02** | Project Manager Login | App loaded, on Login screen | 1. Click "PM User" in Test Credentials.<br>2. Click "Sign In". | User logs in. Sidebar shows: Dashboard, Planner, Team, Projects. **Settings is hidden**. |
| **AUTH-03** | Team Mate Login | App loaded, on Login screen | 1. Click "Dev User" in Test Credentials.<br>2. Click "Sign In". | User logs in. **Automatically redirects to Planner**. Sidebar shows **only Planner**. Dashboard, Team, Projects are hidden. |
| **AUTH-04** | Invalid Login | App loaded | 1. Enter random email/password.<br>2. Click "Sign In". | Error message "Invalid email address" appears. |
| **AUTH-05** | Session Switch | Logged in as Admin | 1. Click User Avatar in top right.<br>2. Click "Sign Out". | User is logged out. Login screen appears. |

---

## 2. Dashboard

| ID | Title | Pre-Conditions | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **DASH-01** | KPI Calculation | Data exists in Planner | 1. Navigate to Dashboard.<br>2. Check "Weekly Utilization". | Percentage = (Total Booked / Total Capacity) * 100. Capacity respects individual developer settings. |
| **DASH-02** | Overloaded List | Planner has dev with > Capacity hours | 1. Navigate to Dashboard.<br>2. Check "Overloaded" card. | Developer appears in the list with red booked hours vs capacity. |
| **DASH-03** | Underutilized List | Planner has dev with < Capacity hours | 1. Navigate to Dashboard.<br>2. Check "Underutilized" card. | Developer appears in the list with yellow booked hours. |
| **DASH-04** | Absent Today | Planner has Absence set for Today | 1. Navigate to Dashboard.<br>2. Check "Absent Today" card. | Developer appears with absence type (Vacation/Sick). |
| **DASH-05** | Risk Distribution | Projects have Green/Yellow/Red status | 1. Navigate to Dashboard.<br>2. Check "Risk Distribution". | Counts match the number of projects in each risk category. |
| **DASH-06** | Due Soon - Overdue | Project has deadline in past | 1. Navigate to Dashboard.<br>2. Check "Due Soon" list. | Project appears with **Bright Red** badge (e.g., "5 days overdue"). Row has red tint. |
| **DASH-07** | Attention Required | Project has Red/Yellow risk | 1. Navigate to Dashboard.<br>2. Check "Attention Required". | Project listed with Risk Description. **Owner (Manager) name** is displayed next to avatar. |
| **DASH-08** | Stale Reports | Project not updated > 7 days | 1. Navigate to Dashboard.<br>2. Check "Stale Reports". | Project listed. Days since update displayed. **Owner (Manager) name** is visible in tooltip/text. |

---

## 3. Planner (Resource Schedule)

| ID | Title | Pre-Conditions | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **PLAN-01** | View Mode Toggle | Planner open | 1. Click "Biweekly".<br>2. Click "Weekly". | Grid expands to 10 days (Biweekly) with separator line after Friday. Shrinks back to 5 days (Weekly). |
| **PLAN-02** | Date Navigation | Planner open | 1. Click "<" (Prev) or ">" (Next). | Dates shift by 7 days (Weekly) or 14 days (Biweekly). |
| **PLAN-03** | Assign Project | Admin/PM logged in | 1. Hover over "+" icon on developer row.<br>2. Select a project from dropdown. | Project row appears under developer. Dropdown does **not** clip/hide behind other rows (Z-Index check). |
| **PLAN-04** | Input Allocation | Project assigned | 1. Click cell.<br>2. Type "4".<br>3. Click outside. | Value saves. Cell color changes (Green if optimal, Yellow if under, Red if over). Total updates. |
| **PLAN-05** | Toggle Absence | Admin/PM logged in | 1. Click header cell (Total/Absence area) for a day. | Cycles: None -> "VAC" (Purple) -> "SICK" (Pink) -> None. Inputs below become disabled. |
| **PLAN-06** | Remove Project | Admin/PM logged in | 1. Hover over project name in row.<br>2. Click Trash icon. | Project row removed for that developer. Allocations deleted. |
| **PLAN-07** | Read-Only Mode | Team Mate logged in | 1. Try to click "+" or Trash icon.<br>2. Try to edit inputs. | Icons are hidden. Inputs are disabled. |
| **PLAN-08** | Release Marker | Admin/PM logged in | 1. Hover over an allocation cell.<br>2. Click small "Alert" icon (top-right).<br>3. Check result.<br>4. Click cell again. | Cell displays "Release" in red text with hours below. Click toggles state off. |

---

## 4. Project Management

| ID | Title | Pre-Conditions | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **PROJ-01** | List View Layout | Admin/PM logged in | 1. Navigate to Projects tab. | Projects displayed in **Table** format. Columns: Project, Status, Manager, Deadlines, Updated, Actions. |
| **PROJ-02** | Create Project | Admin logged in | 1. Click "Add Project".<br>2. Fill Name, Stack, Color.<br>3. Add Subproject with Deadline.<br>4. Select Manager.<br>5. Click Save. | Project appears in list with correct details. |
| **PROJ-03** | Status Update | Admin/PM logged in | 1. Edit Project.<br>2. Change Risk to "Red".<br>3. Enter Risk Description.<br>4. Enter Short Update.<br>5. Save. | Risk badge updates. Short update displayed in list. "Last Updated" timestamp refreshes. |
| **PROJ-04** | Delete Confirmation | Admin logged in | 1. Click Trash icon on project.<br>2. Check Modal.<br>3. Click "Delete Project". | **Custom Modal** appears warning about allocation loss. Project removed after confirmation. |
| **PROJ-05** | Filter by Manager | Projects exist | 1. Select specific Manager from dropdown. | List shows only projects assigned to that user. |
| **PROJ-06** | Tech Stack | Edit Project | 1. Select "Magento 2" from Stack dropdown. | Stack badge appears in Project list view. |

---

## 5. Team Management

| ID | Title | Pre-Conditions | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **TEAM-01** | Add Member | Admin logged in | 1. Click "Add Member".<br>2. Fill Name, Role, Level, Team.<br>3. Set Capacity to "6".<br>4. Save. | Member appears in list. Capacity of 6h used in Planner calculations. |
| **TEAM-02** | Sorting | Members exist | 1. Click "Role" header.<br>2. Click "Team" header. | List sorts alphabetically by Role/Team. Icon indicates direction. |
| **TEAM-03** | Filtering | Members exist | 1. Select "Frontend" in Role filter. | Only Frontend developers displayed. |
| **TEAM-04** | Create Team | Admin logged in | 1. Switch to "Teams Structure" tab.<br>2. Add Team "Gamma".<br>3. Select Color. | Team card appears. Can be selected in Member modal. |

---

## 6. Settings (User Management)

| ID | Title | Pre-Conditions | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **SET-01** | Add User | Admin logged in | 1. Click "Add User".<br>2. Enter Name, Email, Role (e.g., Team Mate).<br>3. Save. | User added. "Invitation sent" alert appears. User appears in list. |
| **SET-02** | Edit Role | Admin logged in | 1. Edit existing user.<br>2. Change Role.<br>3. Save. | Role updates. Permissions in app change immediately upon that user's login. |
| **SET-03** | Delete User | Admin logged in | 1. Delete user. | User removed from system. |