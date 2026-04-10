import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const projectDir = '/vercel/share/v0-project';

try {
  console.log('📁 Navigating to project directory...');
  process.chdir(projectDir);

  console.log('📦 Staging all changes...');
  execSync('git add -A', { stdio: 'inherit' });

  console.log('✍️  Creating commit for coach dashboard integration...');
  const commitMessage = `feat: integrate coach dashboard with backend APIs

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

All data is fetched on component initialization and displays proper loading/error states.`;

  execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });

  console.log('✅ Commit completed successfully!');
  console.log('\n📝 Changes committed to the frontend-integration branch.');
} catch (error) {
  console.error('❌ Error during commit:', error.message);
  process.exit(1);
}
