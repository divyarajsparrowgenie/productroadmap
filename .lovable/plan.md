

## Updated Plan — Key Changes

### 1. WSJF Moves to Versions (not Features)
- **Versions table** gets: business_value, time_criticality, risk_reduction, job_size, wsjf_score
- **Features table** loses those fields — becomes just: id, title, description, created_at
- Feature progress = average of its versions' progress
- Dashboard WSJF table ranks **Versions** (showing parent feature name alongside)
- "Next Best Task" logic: highest WSJF **version** that isn't complete → first incomplete task

### 2. Editable Status Dropdowns
- Version status (Planned / In Progress / Released) — editable inline dropdown
- Task status (Todo / Doing / Done) — editable inline dropdown
- Changes save immediately on selection

### 3. "Completed" Flag to Hide from Dashboard
- Versions can be marked as **Completed** (a status option or separate toggle)
- Completed versions (and their tasks) are excluded from:
  - Dashboard WSJF table
  - "Next Best Task" calculation
  - Pie chart / velocity / deadline alerts
- Completed versions still visible in Feature Detail view (grayed out or with a badge)

### Database Schema (revised)

**Features**: id, title, description, created_at

**Versions**: id, feature_id (FK), version_name, status (Planned/In Progress/Released/Completed), due_date, business_value (1-10), time_criticality (1-10), risk_reduction (1-10), job_size (1-10), wsjf_score (computed), created_at

**Tasks**: id, version_id (FK), title, status (Todo/Doing/Done), due_date, completed_at, created_at

### UI Changes
- Feature List: shows Feature Name, # of Versions, overall progress (no WSJF columns)
- Feature Detail: WSJF inputs move into each Version's edit form
- Dashboard WSJF table: lists Versions ranked by WSJF, with parent Feature name column
- All status fields are inline-editable dropdowns
- Setting version status to "Completed" hides it from dashboard views

Everything else (task tracking, velocity, deadlines, pie chart, next-best-task, sidebar layout) stays the same as the original plan.

