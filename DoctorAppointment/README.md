# Hospital Appointment Management System

A full-stack MERN application for managing hospital appointments with AI-based doctor availability and appointment slot allocation.

## Features

### Authentication System
- User registration with role-based access (Patient, Doctor, Admin)
- Email verification workflow
- Secure JWT authentication (access + refresh tokens)
- Password reset functionality
- Protected routes with role-based authorization
- Session management with auto-refresh

### User Roles

#### Patient
- Book appointments with doctors
- View appointment history
- Manage medical records
- Real-time doctor availability tracking

#### Doctor
- Manage appointments
- Set availability schedules
- View patient information
- Track consultation history

#### Admin
- Manage users (patients and doctors)
- System-wide analytics
- Configure AI scheduling parameters
- Oversee all appointments

### UI/UX Features
- Modern, responsive landing page
- Clean authentication pages (Login, Register, Password Reset)
- Role-specific dashboards
- Real-time form validation
- Loading states and error handling
- Mobile-first responsive design

## Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **Redux Toolkit** - State management
- **React Router v6** - Routing
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Nodemailer** - Email service

## Project Structure

```
Doctor Appointment/
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── auth/      # Auth-related components
│   │   │   └── common/    # Common components (Button, Input, etc.)
│   │   ├── pages/         # Page components
│   │   │   ├── auth/      # Authentication pages
│   │   │   └── dashboard/ # Dashboard pages
│   │   ├── redux/         # Redux store and slices
│   │   │   └── slices/
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx        # Main App component
│   │   └── main.jsx       # Entry point
│   └── package.json
│
└── server/                 # Backend Node.js application
    ├── src/
    │   ├── config/        # Configuration files (DB, Email)
    │   ├── models/        # Mongoose models
    │   ├── controllers/   # Route controllers
    │   ├── middleware/    # Custom middleware
    │   ├── routes/        # API routes
    │   ├── utils/         # Utility functions
    │   └── server.js      # Server entry point
    └── package.json
```

## Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or Atlas)
- npm
- Email service account (Gmail, SendGrid, or Mailtrap for testing)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Doctor Appointment"
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

#### Configure Server Environment Variables

Edit `server/.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database (MongoDB Atlas example)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hospital-appointment

# JWT Secrets (generate using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Client URL
CLIENT_URL=http://localhost:5173

# Email Configuration (Mailtrap for development)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_username
EMAIL_PASS=your_mailtrap_password
EMAIL_FROM=noreply@hospitalappointment.com
EMAIL_FROM_NAME=Hospital Appointment System
```

#### Generate JWT Secrets

```bash
# Run this in your terminal to generate secure secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Frontend Setup

```bash
# Navigate to client directory (from project root)
cd client

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

#### Configure Client Environment Variables

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Database Setup

#### Option 1: Local MongoDB

```bash
# Start MongoDB service
mongosh
```

#### Option 2: MongoDB Atlas (Cloud)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Add to `server/.env` as `MONGODB_URI`

### 5. Email Service Setup

#### For Development (Mailtrap)

1. Sign up at [mailtrap.io](https://mailtrap.io/)
2. Get SMTP credentials
3. Add to `server/.env`

#### For Production (Gmail)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Note: Use App Password, not regular password. [Generate here](https://myaccount.google.com/apppasswords)

## Running the Application

### Development Mode

#### Terminal 1: Start Backend Server

```bash
cd server
npm run dev
```

Server runs on [http://localhost:5000](http://localhost:5000)

#### Terminal 2: Start Frontend

```bash
cd client
npm run dev
```

Client runs on [http://localhost:5173](http://localhost:5173)

### Production Mode

#### Backend

```bash
cd server
npm start
```

#### Frontend

```bash
cd client
npm run build
npm run preview
```

## API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/verify-email/:token` | Verify email | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password/:token` | Reset password | No |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check API status |

## User Registration Workflow

1. User fills registration form with role selection
2. System validates input and creates user account
3. Email verification link sent to user's email
4. User clicks link to verify email
5. Account activated - user can now login

## Default Test Users

After setting up, you can create test users via the registration page for each role:

- Patient
- Doctor
- Admin

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT-based authentication
- HTTP-only cookies for refresh tokens
- CORS protection
- Rate limiting on auth endpoints
- XSS protection headers
- Input validation and sanitization
- Email verification required

## Future Features (Coming Soon)

- AI-based doctor availability prediction
- Smart appointment slot allocation
- Real-time notifications
- Appointment reminders
- Video consultation integration
- Patient medical history management
- Doctor availability calendar
- Payment integration
- Analytics dashboard for admins

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongosh

# Or check Atlas connection string format
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
```

### Email Not Sending

- Check SMTP credentials
- Verify firewall settings
- For Gmail, ensure "Less secure app access" is enabled or use App Password
- Check Mailtrap inbox for development

### Frontend Not Connecting to Backend

- Ensure `VITE_API_URL` in `client/.env` matches backend URL
- Check CORS settings in `server/src/server.js`
- Verify backend is running on correct port

### JWT Token Issues

- Ensure JWT secrets are set in `server/.env`
- Check token expiration times
- Clear browser localStorage and cookies

## Scripts

### Backend

```bash
npm start       # Start production server
npm run dev     # Start development server with nodemon
```

### Frontend

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
```

## Environment Variables Reference

### Server

| Variable | Description | Required |
|----------|-------------|----------|
| NODE_ENV | Environment (development/production) | Yes |
| PORT | Server port | Yes |
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_ACCESS_SECRET | Access token secret | Yes |
| JWT_REFRESH_SECRET | Refresh token secret | Yes |
| CLIENT_URL | Frontend URL for CORS | Yes |
| EMAIL_HOST | SMTP host | Yes |
| EMAIL_PORT | SMTP port | Yes |
| EMAIL_USER | SMTP username | Yes |
| EMAIL_PASS | SMTP password | Yes |
| EMAIL_FROM | Sender email | Yes |
| EMAIL_FROM_NAME | Sender name | Yes |

### Client

| Variable | Description | Required |
|----------|-------------|----------|
| VITE_API_URL | Backend API URL | Yes |

## License

ISC

## Author

Muhammed Hisham A

## Support

For issues and questions, please create an issue in the repository.
