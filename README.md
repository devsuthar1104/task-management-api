
## 🚀 Live Demo

- **Base URL**: http://localhost:3000
- **Health Check**: GET /health

## 📋 Features Implemented

- ✅ JWT Authentication (Register/Login)
- ✅ User Management 
- ✅ Project CRUD Operations
- ✅ Task Management with Status Tracking
- ✅ Team Collaboration
- ✅ Comments System
- ✅ Advanced Filtering & Pagination
- ✅ Rate Limiting & Security
- ✅ Input Validation
- ✅ Error Handling

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, bcrypt, rate-limiting
- **Validation**: express-validator

## 📊 API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/updatepassword` - Update password

### Projects
- GET `/api/projects` - Get all projects
- POST `/api/projects` - Create project
- GET `/api/projects/:id` - Get single project
- PUT `/api/projects/:id` - Update project
- DELETE `/api/projects/:id` - Delete project

### Tasks
- GET `/api/tasks` - Get all tasks
- POST `/api/tasks` - Create task
- GET `/api/tasks/:id` - Get single task
- PUT `/api/tasks/:id` - Update task
- PATCH `/api/tasks/:id/status` - Update task status
- POST `/api/tasks/:id/comments` - Add comment

## 👨‍💻 Author

Developed by Dev Suthar

## 📄 License

MIT
