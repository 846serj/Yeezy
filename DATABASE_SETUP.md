# Database Setup Guide

This guide explains how to set up Vercel Postgres for the WordPress Article Editor.

## 🚀 Quick Setup

### 1. Add Vercel Postgres to Your Project

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to the **Storage** tab
4. Click **Create Database** → **Postgres**
5. Choose a name for your database (e.g., `wordpress-editor-db`)
6. Select a region close to your users
7. Click **Create**

### 2. Environment Variables

Vercel will automatically add these environment variables to your project:

```env
POSTGRES_URL=postgres://username:password@host:port/database
POSTGRES_PRISMA_URL=postgres://username:password@host:port/database?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=postgres://username:password@host:port/database
POSTGRES_USER=username
POSTGRES_HOST=host
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=database
```

### 3. Deploy Your Changes

```bash
git add .
git commit -m "feat: add Vercel Postgres database support"
git push origin main
```

Vercel will automatically deploy your changes and the database will be initialized.

## 🏗️ Database Schema

The database includes two main tables:

### Users Table
- `id` - Primary key (auto-increment)
- `email` - User email (unique)
- `password_hash` - Hashed password
- `created_at` - Timestamp
- `updated_at` - Timestamp

### User Sites Table
- `id` - Primary key (auto-increment)
- `user_id` - Foreign key to users table
- `site_url` - WordPress site URL
- `username` - WordPress username
- `app_password` - WordPress application password
- `site_name` - Optional site name
- `created_at` - Timestamp
- `updated_at` - Timestamp

## 🔧 Development vs Production

### Development
- Uses **in-memory storage** (Map objects)
- Data is lost when server restarts
- Perfect for testing and development

### Production
- Uses **Vercel Postgres** database
- Data persists across deployments
- Automatic scaling and backups

## 🧪 Testing

### Test Database Locally
```bash
# The app will automatically use in-memory storage in development
npm run dev
```

### Test Database in Production
1. Deploy to Vercel
2. Check the Vercel dashboard for database logs
3. Test user registration and site management

## 📊 Monitoring

### Vercel Dashboard
- Go to your project → **Storage** tab
- View database usage and performance
- Monitor connection counts

### Database Logs
- Check Vercel function logs for database errors
- Look for "✅ Database schema initialized successfully" message

## 🔒 Security

- All passwords are hashed using bcrypt
- Database connections use SSL
- Environment variables are encrypted
- No sensitive data in client-side code

## 🚨 Troubleshooting

### Common Issues

1. **Database not initialized**
   - Check if `POSTGRES_URL` environment variable is set
   - Look for initialization errors in logs

2. **Connection errors**
   - Verify database is created in Vercel
   - Check if database is in the same region as your functions

3. **Schema errors**
   - The app automatically creates tables on first run
   - Check for SQL syntax errors in logs

### Getting Help

- Check Vercel documentation: https://vercel.com/docs/storage/vercel-postgres
- Review function logs in Vercel dashboard
- Test with the provided test script

## 🎯 Next Steps

1. **Add Vercel Postgres** to your project
2. **Deploy** your changes
3. **Test** user registration and site management
4. **Monitor** database usage in Vercel dashboard

Your WordPress Article Editor is now ready for production! 🚀
