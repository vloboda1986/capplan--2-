# MongoDB Setup Guide

The application backend requires a MongoDB database connection. You have two options:

## Option 1: MongoDB Atlas (Cloud - Recommended for Quick Start)

1. **Create a free account** at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. **Create a cluster** (free tier available)
3. **Get your connection string**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/capplan`)
4. **Add to `.env.local`** in the project root:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/capplan
   ```
   Replace `username` and `password` with your credentials

## Option 2: Local MongoDB Installation

### Windows:
1. Download MongoDB Community Server from [mongodb.com/download-center/community](https://www.mongodb.com/try/download/community)
2. Run the installer (choose "Complete" installation)
3. MongoDB will run as a Windows service automatically
4. Default connection: `mongodb://localhost:27017/capplan`

### Verify Installation:
```bash
mongod --version
```

## After MongoDB is Ready

1. **Update `.env.local`** (create if it doesn't exist):
   ```
   MONGODB_URI=mongodb://localhost:27017/capplan
   # OR your Atlas connection string
   ```

2. **Seed the database** with initial data:
   ```bash
   cd server
   node seed.js
   ```

3. **Start the backend server**:
   ```bash
   cd server
   npm start
   ```

4. **Start the frontend** (in a separate terminal):
   ```bash
   npm run dev
   ```

5. **Access the app** at `http://localhost:3000` (or the port shown)

## Current Status

✅ Backend server created (`server/`)
✅ MongoDB models defined
✅ API routes implemented
✅ Frontend updated to use API
⏳ **MongoDB connection needed** - Please set up MongoDB using one of the options above
