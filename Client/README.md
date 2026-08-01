# Trends Bird Limited — Admin Dashboard (Client)

This is the frontend React application for the Trends Bird Limited E-Commerce Admin System. It is a single-page application (SPA) built with Vite, React 18, and standard CSS.

## ⚡ Technology Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (CSS Modules & Global Tokens)
- **Icons**: Lucide React
- **HTTP Client**: Axios (configured with credentials for secure HttpOnly cookie handling)

## 🚀 Local Development Setup

### 1. Install Dependencies
Make sure you have Node.js v20+ installed, then run:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root of the `Client` directory:
```env
# Point this to your backend server URL
VITE_API_URL=http://localhost:3000/api
```

### 3. Start Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## 📦 Cloud Deployment (Vercel)

This frontend is configured to be seamlessly deployed on **Vercel**. 

1. Push this directory to your GitHub repository.
2. Import the project into Vercel.
3. Vercel will automatically detect the **Vite** framework.
4. **Important**: Ensure your `vercel.json` file is correctly configured with your backend's deployment URL (e.g., Render) to correctly proxy `/api` and `/uploads` requests and avoid CORS issues.

Example `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/api/:match*",
      "destination": "https://your-backend-app.onrender.com/api/:match*"
    },
    {
      "source": "/uploads/:match*",
      "destination": "https://your-backend-app.onrender.com/uploads/:match*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 🔒 Security Features
- **Double-Submit Cookie Verification**: Intercepts `csrf_token` from cookies and appends it to headers automatically.
- **Single-In-Flight Token Refresh**: Automatically intercepts `401 Unauthorized` errors and queues pending requests while silently refreshing the access token in the background.
