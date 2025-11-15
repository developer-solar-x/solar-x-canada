# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automating repository tasks.

## Sync Upstream Workflow

The `sync-upstream.yml` workflow automatically syncs this fork with the upstream repository (`tayawaaean/solar-x`).

### How It Works

1. **Scheduled Runs**: The workflow runs every hour to check for updates from upstream
2. **Manual Trigger**: You can manually trigger it from the GitHub Actions tab
3. **Automatic Sync**: When upstream changes are detected, they are merged and pushed to your fork
4. **Vercel Deployment**: Pushing changes automatically triggers Vercel deployment

### Setup Instructions

1. **Enable GitHub Actions** (if not already enabled):
   - Go to your repository on GitHub
   - Navigate to Settings > Actions > General
   - Ensure "Allow all actions and reusable workflows" is selected

2. **Verify Permissions**:
   - The workflow uses `GITHUB_TOKEN` which should have write permissions by default
   - If you encounter permission issues, you may need to:
     - Go to Settings > Actions > General > Workflow permissions
     - Select "Read and write permissions"
     - Check "Allow GitHub Actions to create and approve pull requests"

3. **Optional: Use Personal Access Token (PAT)**:
   - If the default token doesn't work, create a Personal Access Token:
     - Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
     - Generate a new token with `repo` scope
     - Add it as a secret named `SYNC_TOKEN` in your repository
     - Update the workflow to use `${{ secrets.SYNC_TOKEN }}` instead of `${{ secrets.GITHUB_TOKEN }}`

### Manual Trigger

To manually trigger the sync:

1. Go to the "Actions" tab in your GitHub repository
2. Select "Sync Upstream Repository" workflow
3. Click "Run workflow"
4. Select the branch (usually `main`)
5. Click "Run workflow"

### Troubleshooting

**Issue: Workflow fails with permission errors**
- Solution: Check workflow permissions in repository settings (see Setup Instructions above)

**Issue: Merge conflicts**
- Solution: The workflow will fail if there are merge conflicts. You'll need to:
  1. Manually sync the fork on GitHub
  2. Resolve conflicts locally
  3. Push the resolved changes

**Issue: Workflow doesn't trigger Vercel deployment**
- Solution: Ensure Vercel is connected to your fork repository and watching the correct branch

### Customization

To change the sync frequency, edit the cron schedule in `sync-upstream.yml`:

```yaml
schedule:
  - cron: '0 * * * *' # Every hour (current)
  # Examples:
  # - cron: '0 */2 * * *' # Every 2 hours
  # - cron: '0 0 * * *' # Once per day at midnight
  # - cron: '*/30 * * * *' # Every 30 minutes
```

### Notes

- The workflow only syncs the `main` branch by default
- If you work on other branches, you may need to adjust the workflow
- The workflow creates merge commits to preserve history
- Vercel deployments are triggered automatically when changes are pushed

