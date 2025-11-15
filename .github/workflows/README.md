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

3. **Set Up Authentication (REQUIRED for private upstream repositories)**:
   - Since the upstream repository (`tayawaaean/solar-x`) is private, you need to configure authentication
   - The workflow supports two methods: **SSH (Recommended)** or **HTTPS with Personal Access Token**
   
   **Option A: SSH Deploy Key (Recommended for Private Repositories)**
   
   SSH is often more reliable for private repositories. Here's how to set it up:
   
   1. **Generate an SSH key pair** (on your local machine):
      ```powershell
      ssh-keygen -t ed25519 -C "github-actions-upstream-sync" -f upstream_sync_key
      ```
      - Press Enter to accept the default location
      - You can leave the passphrase empty (or set one if you prefer)
      - This creates two files: `upstream_sync_key` (private key) and `upstream_sync_key.pub` (public key)
   
   2. **Add the public key as a Deploy Key to the upstream repository**:
      - Log in to the `tayawaaean` GitHub account
      - Go to the repository: `tayawaaean/solar-x`
      - Navigate to: Settings > Deploy keys
      - Click "Add deploy key"
      - Title: "GitHub Actions Sync for developer-solar-x"
      - Key: Paste the contents of `upstream_sync_key.pub` (the public key)
      - **Important**: Check "Allow write access" if you need write access, or leave it unchecked for read-only
      - Click "Add key"
   
   3. **Add the private key as a secret in your fork repository**:
      - Log in to the `developer-solar-x` GitHub account
      - Go to your fork repository: `developer-solar-x/solar-x-canada`
      - Navigate to: Settings > Secrets and variables > Actions
      - Click "New repository secret"
      - Name: `UPSTREAM_SSH_KEY`
      - Value: Paste the **entire contents** of `upstream_sync_key` (the private key)
        - Include the `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines
        - Include all lines of the key
      - Click "Add secret"
   
   **Option B: Personal Access Token (HTTPS)**
   
   If you prefer to use HTTPS instead of SSH:
   
   1. **Create a Personal Access Token**:
      - Log in to the `tayawaaean` GitHub account (the owner of the upstream repository)
      - Go to: GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
      - Click "Generate new token (classic)"
      - Give it a descriptive name (e.g., "Upstream Sync Token for developer-solar-x")
      - Select the `repo` scope (this gives access to private repositories)
      - Click "Generate token"
      - **Copy the token immediately** (you won't be able to see it again)
   
   2. **Add the token as a secret in your fork repository**:
      - Log in to the `developer-solar-x` GitHub account (the fork owner)
      - Go to your fork repository: `developer-solar-x/solar-x-canada`
      - Navigate to: Settings > Secrets and variables > Actions
      - Click "New repository secret"
      - Name: `UPSTREAM_SYNC_TOKEN`
      - Value: Paste the Personal Access Token you created
      - Click "Add secret"
   
   **Note**: The workflow will automatically use SSH if `UPSTREAM_SSH_KEY` is available, otherwise it will fall back to HTTPS with `UPSTREAM_SYNC_TOKEN`. You only need to configure one method.

### Manual Trigger

To manually trigger the sync:

1. Go to the "Actions" tab in your GitHub repository
2. Select "Sync Upstream Repository" workflow
3. Click "Run workflow"
4. Select the branch (usually `main`)
5. Click "Run workflow"

### Troubleshooting

**Issue: "Repository not found" error when fetching upstream**
- **Cause**: The upstream repository is private and requires authentication
- **Solution**: 
  - **If using SSH**: Ensure `UPSTREAM_SSH_KEY` secret is set and the public key is added as a deploy key to `tayawaaean/solar-x`
  - **If using HTTPS**: Ensure `UPSTREAM_SYNC_TOKEN` secret is set with a valid Personal Access Token that has `repo` scope
  - See Setup Instructions #3 above for detailed steps

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

