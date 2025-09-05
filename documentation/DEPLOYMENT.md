# Deployment Guide

This guide will walk you through deploying your Report Repository System to production using Netlify, GitHub, and your existing Supabase setup.

## Prerequisites

- ✅ GitHub account
- ✅ Netlify account (free)
- ✅ Supabase project (already configured)
- ✅ Your application code

## Step 1: Prepare Your Repository

### 1.1 Clean Up Your Code

Remove test files and unnecessary content:

```bash
# Files to remove (optional - for cleaner deployment)
rm test-*.html
rm *test*.html
rm *.md (except README.md and DEPLOYMENT.md)
rm *.sql
rm *.txt
rm integration-fix.js
rm fix-data-loading.js
rm kpi-refresh-fix.js
rm auth-integration-manager.js
rm supabase-auth-manager.js
```

### 1.2 Verify Essential Files

Ensure these files are present:
- ✅ `index.html` (main entry point)
- ✅ `assets/js/supabase/config.js` (Supabase configuration)
- ✅ `netlify.toml` (Netlify configuration)
- ✅ `.gitignore` (Git ignore rules)
- ✅ `README.md` (Documentation)

## Step 2: Push to GitHub

### 2.1 Initialize Git Repository

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Report Repository System"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### 2.2 Repository Structure

Your GitHub repository should look like this:

```
report-repository-system/
├── index.html
├── reports.html
├── kpi-data-entry.html
├── scorecard-designer.html
├── calendar.html
├── users.html
├── settings.html
├── login.html
├── signup.html
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
├── netlify.toml
├── .gitignore
├── README.md
└── DEPLOYMENT.md
```

## Step 3: Deploy to Netlify

### 3.1 Connect GitHub to Netlify

1. **Go to [Netlify](https://netlify.com)** and sign in
2. **Click "New site from Git"**
3. **Choose GitHub** as your Git provider
4. **Authorize Netlify** to access your GitHub account
5. **Select your repository** from the list

### 3.2 Configure Build Settings

Netlify will auto-detect your settings, but verify:

- **Build command**: Leave empty (not needed for static sites)
- **Publish directory**: `.` (root directory)
- **Base directory**: Leave empty

### 3.3 Deploy Settings

Click **"Deploy site"** and wait for the build to complete.

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Custom Domain

1. **Go to Site settings** → **Domain management**
2. **Click "Add custom domain"**
3. **Enter your domain** (e.g., `reports.yourcompany.com`)
4. **Follow DNS setup instructions**

### 4.2 SSL Certificate

Netlify automatically provides SSL certificates for all sites.

## Step 5: Environment Configuration

### 5.1 Verify Supabase Configuration

Your Supabase configuration is already in `assets/js/supabase/config.js`:

```javascript
const SUPABASE_CONFIG = {
  URL: 'https://pvfmdczitmjtvbgewurc.supabase.co',
  ANON_KEY: 'your-anon-key',
  SERVICE_KEY: 'your-service-key',
  // ...
};
```

### 5.2 Environment Variables (Optional)

If you want to use environment variables instead of hardcoded values:

1. **Go to Site settings** → **Environment variables**
2. **Add variables**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`

Then update your config.js to use them:

```javascript
const SUPABASE_CONFIG = {
  URL: process.env.SUPABASE_URL || 'https://pvfmdczitmjtvbgewurc.supabase.co',
  ANON_KEY: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
  // ...
};
```

## Step 6: Test Your Deployment

### 6.1 Basic Functionality Test

1. **Visit your Netlify URL**
2. **Test login/signup** functionality
3. **Verify all pages load** correctly
4. **Test file uploads** and data operations
5. **Check console for errors**

### 6.2 Common Issues & Solutions

#### Issue: CORS Errors
**Solution**: Your Supabase project should already be configured correctly.

#### Issue: Authentication Not Working
**Solution**: Verify your Supabase auth settings in the Supabase dashboard.

#### Issue: File Uploads Failing
**Solution**: Check your Supabase storage bucket permissions.

## Step 7: Continuous Deployment

### 7.1 Automatic Deployments

Netlify automatically deploys when you push to your main branch:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main
# Netlify automatically deploys!
```

### 7.2 Preview Deployments

Netlify creates preview deployments for pull requests, allowing you to test changes before merging.

## Step 8: Monitoring & Analytics

### 8.1 Netlify Analytics

- **Go to Site settings** → **Analytics**
- **Enable analytics** (free tier available)
- **Monitor site performance** and user behavior

### 8.2 Error Monitoring

- **Check Netlify function logs** in the Functions tab
- **Monitor browser console errors** in your application
- **Set up error tracking** (optional: Sentry, LogRocket, etc.)

## Step 9: Security Considerations

### 9.1 Environment Variables

- ✅ **Never commit sensitive keys** to Git
- ✅ **Use environment variables** for production secrets
- ✅ **Rotate keys regularly**

### 9.2 Supabase Security

- ✅ **Enable Row Level Security (RLS)** on all tables
- ✅ **Configure proper policies** for each table
- ✅ **Use service role key** only for admin operations

## Step 10: Performance Optimization

### 10.1 Netlify Optimizations

- ✅ **Enable asset optimization** in Site settings
- ✅ **Configure caching headers** in netlify.toml
- ✅ **Use CDN** (automatically provided by Netlify)

### 10.2 Application Optimizations

- ✅ **Minify CSS and JavaScript** (optional)
- ✅ **Optimize images** before uploading
- ✅ **Use lazy loading** for large components

## Troubleshooting

### Common Deployment Issues

1. **Build fails**: Check your netlify.toml configuration
2. **404 errors**: Verify your redirect rules in netlify.toml
3. **CORS issues**: Check your Supabase project settings
4. **Authentication problems**: Verify your Supabase auth configuration

### Getting Help

- **Netlify Docs**: https://docs.netlify.com
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Issues**: Create an issue in your repository

## Next Steps

After successful deployment:

1. **Set up monitoring** and analytics
2. **Configure backup strategies** for your data
3. **Plan for scaling** as your user base grows
4. **Consider adding CI/CD** pipelines for more complex workflows

---

🎉 **Congratulations!** Your Report Repository System is now live and accessible to users worldwide! 