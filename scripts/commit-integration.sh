#!/bin/bash

# Script to commit the coach dashboard frontend-backend integration changes
cd /vercel/share/v0-project

echo "Staging all changes..."
git add -A

echo "Creating commit for coach dashboard integration..."
git commit -m "feat: integrate coach dashboard with backend APIs

- Add dynamic data loading for entrepreneurs list
- Add dynamic data loading for upcoming sessions
- Add dashboard stats endpoint integration
- Create new DTOs for CoachEntrepreneur, DashboardStats, UpcomingSession
- Implement loadCoachEntrepreneurs() and loadUpcomingSessions() methods
- Update CoachDashboard component to use CoachService
- Replace hardcoded data with dynamic backend data
- Add loading states and empty state handling
- Add responsive UI for dynamic data display

The coach dashboard now dynamically loads all data from the backend instead of using static mockup data. This includes:
- Coach's assigned entrepreneurs with completion rates
- Upcoming sessions with status and meeting links
- Dashboard statistics (meetings, tasks, phases, projects)

All data is fetched on component initialization and displays proper loading/error states."

echo "Commit completed successfully!"
