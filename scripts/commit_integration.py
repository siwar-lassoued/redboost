#!/usr/bin/env python3
import subprocess
import sys
import os

# Change to project directory
os.chdir('/vercel/share/v0-project')

try:
    # Stage all changes
    print("📝 Staging changes...")
    subprocess.run(['git', 'add', '-A'], check=True)
    
    # Create commit
    print("✅ Creating commit...")
    commit_message = """feat: Integrate coach dashboard with backend API

- Added dynamic data loading for entrepreneurs and sessions
- Enhanced coach.service.ts with new API methods:
  * getDashboardStats() - Load dashboard statistics
  * getCoachEntrepreneurs() - Load assigned entrepreneurs
  * getUpcomingSessions() - Load upcoming sessions
  * getDashboardOverview() - Combined data endpoint
- Updated CoachDashboard component to use backend data
- Replaced static mockup data with dynamic content
- Added loading states and empty states
- Added DTOs for type-safe data handling
- Updated styles for session statuses (green, orange, red)
- Added documentation and integration guide

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>"""
    
    subprocess.run(
        ['git', 'commit', '-m', commit_message],
        check=True
    )
    
    print("✨ Commit successful!")
    print("📤 Pushing to frontend-integration branch...")
    subprocess.run(['git', 'push', 'origin', 'frontend-integration'], check=True)
    print("✅ Push successful!")
    
except subprocess.CalledProcessError as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
