# Accessibility Analyzer by Janmejay Tiwari

A comprehensive web application for analyzing and improving website accessibility compliance with WCAG guidelines.

## 👨‍💻 About the Developer

**Janmejay Tiwari** - Full Stack Developer  
🔗 **LinkedIn**: (https://www.linkedin.com/in/janmejay-tiwari/)  
🌐 **Portfolio**: (https://janmejaytiwari.vercel.app/)

## 💡 Why I Built This Project

As a developer passionate about inclusive web design, I noticed that many websites still struggle with accessibility compliance. Small businesses and individual developers often lack the tools and knowledge to make their websites accessible to users with disabilities. 

I built the Accessibility Analyzer to bridge this gap - providing an easy-to-use tool that not only identifies accessibility issues but also educates users on how to fix them. Through this project, I deepened my understanding of WCAG guidelines, Firebase real-time databases, and the importance of building technology that serves everyone.

The goal is simple: **Make the web accessible for all users, regardless of their abilities.**

---

## 🚀 Project Overview

The Accessibility Analyzer is a full-stack web application that helps developers, designers, and content creators ensure their websites meet accessibility standards. It provides automated scanning, detailed reporting, and actionable recommendations for improving web accessibility.

### ✨ Key Features

- **🔍 Automated Accessibility Scanning**: Comprehensive analysis using axe-core engine
- **📊 Detailed Reporting**: In-depth reports with specific issues and solutions
- **👤 User Management**: Secure authentication with Google OAuth
- **📈 Dashboard Analytics**: Visual insights into accessibility metrics
- **🔌 API Integration**: RESTful API for programmatic access
- **⚡ Real-time Analysis**: Live scanning with immediate feedback
- **📱 Responsive Design**: Works perfectly on all devices

---

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js framework
- **Firebase/Firestore** for real-time database
- **Firebase Authentication** with Google OAuth
- **Axe-core** accessibility testing engine

### Frontend
- **React.js** with modern hooks and context
- **Material-UI/Tailwind CSS** for responsive design
- **Chart.js** for data visualization
- **Axios** for API communication

---

## 📁 Project Structure

```
accessibility-analyzer/
├── backend/                 # Node.js backend server
│   ├── controllers/        # API route handlers
│   ├── models/            # Data models for Firestore
│   ├── routes/            # API route definitions
│   ├── middleware/        # Authentication & validation
│   ├── config/           # Firebase configuration
│   └── utils/            # Helper functions
├── frontend/              # React.js frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Main application pages
│   │   ├── services/     # API communication
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Helper functions
│   └── public/           # Static assets
├── docs/                 # Documentation
└── scripts/              # Setup and utility scripts
```

---

## 🚨 Important: Firebase Setup Required

**⚠️ This project will NOT work without proper Firebase configuration!**

After cloning this repository, you'll need to set up your own Firebase project. Don't worry - I'll guide you through every step!

---

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Google account** (for Firebase)
- **Basic terminal/command line knowledge**

---

## 🔧 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/accessibility-analyzer.git
cd accessibility-analyzer
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 3: Create Firebase Project

1. **Go to Firebase Console**: [https://console.firebase.google.com](https://console.firebase.google.com)
2. **Click "Create a project"**
3. **Project name**: `accessibility-analyzer-[your-name]`
4. **Enable Google Analytics**: Yes (recommended)
5. **Click "Create project"**

### Step 4: Enable Firebase Services

#### Enable Authentication:
1. In Firebase Console → **Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **"Google"** provider
5. Add your email as authorized domain

#### Enable Firestore Database:
1. In Firebase Console → **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"**
4. Select your preferred location
5. Click **"Done"**

### Step 5: Get Firebase Configuration

#### For Backend (Service Account Key):
1. Go to **Project Settings** (⚙️ icon)
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Download the JSON file
5. **Rename it to**: `firebase-service-account-key.json`
6. **Move it to**: `backend/config/firebase-service-account-key.json`

#### For Frontend (Web App Config):
1. In **Project Settings** → **General** tab
2. Scroll to **"Your apps"** section
3. Click **"Add app"** → **Web** (🌐)
4. **App nickname**: `Accessibility Analyzer Web`
5. Click **"Register app"**
6. **Copy the config object** (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC-your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Step 6: Configure Environment Variables

#### Backend Configuration:
```bash
# Copy the example file
cp .env.example .env

# Edit .env file with your Firebase project ID
FIREBASE_PROJECT_ID=your-project-id-here
```

#### Frontend Configuration:
```bash
# Copy the example file
cp frontend/.env.example frontend/.env

# Edit frontend/.env with your Firebase config values
REACT_APP_FIREBASE_API_KEY=your-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Step 7: Deploy Firestore Security Rules

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore
# Select your existing project
# Use existing firestore.rules and firestore.indexes.json

# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Step 8: Test Your Setup

```bash
# Run the setup verification script
npm run setup:firebase
```

### Step 9: Start the Development Servers

```bash
# Start backend server (in one terminal)
npm run dev
# Should show:  Server running on http://localhost:5000

# Start frontend server (in another terminal)
cd frontend
npm start
# Should open: http://localhost:3000
```

---

## Testing Your Installation

### 1. Check Backend API
Open your browser and go to: `http://localhost:5000/api`
You should see: `{"message": "Accessibility Analyzer API is running"}`

### 2. Test Frontend
Go to: `http://localhost:3000`
You should see the Accessibility Analyzer homepage

### 3. Test Authentication
1. Click **"Sign In"** or go to: `http://localhost:3000/auth`
2. Try **"Sign in with Google"**
3. You should be able to authenticate successfully

### 4. Test Analysis (Once Implemented)
1. Go to the analysis page
2. Enter a website URL
3. Run an accessibility scan

---

## Troubleshooting Common Issues

### "Firebase configuration not found"
- ✅ Check that `firebase-service-account-key.json` is in `backend/config/`
- ✅ Verify your `.env` file has the correct `FIREBASE_PROJECT_ID`

### "API key not valid" error
- ✅ Double-check your `frontend/.env` file has correct Firebase config
- ✅ Make sure there are no extra spaces in the values
- ✅ Restart the frontend server after changing `.env`

### "Permission denied" errors
- ✅ Make sure you deployed Firestore security rules: `firebase deploy --only firestore:rules`
- ✅ Check that Firestore is enabled in Firebase Console

### Server won't start
- ✅ Run `npm run setup:firebase` to verify configuration
- ✅ Check that all dependencies are installed: `npm install`
- ✅ Make sure you're using Node.js version 16+

---

## API Documentation

### Authentication Endpoints
- `POST /api/auth/verify` - Verify Firebase token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Analysis Endpoints
- `POST /api/analysis` - Create new analysis request
- `GET /api/analysis/:id` - Get analysis by ID
- `GET /api/analysis/user/requests` - Get user's analyses
- `GET /api/analysis/dashboard/analytics` - Get analytics data

---

## Contributing

I welcome contributions! Here's how you can help:

### 1. Fork & Clone
```bash
git fork https://github.com/your-username/accessibility-analyzer
git clone https://github.com/your-username/accessibility-analyzer
```

### 2. Create Feature Branch
```bash
git checkout -b feature/amazing-new-feature
```

### 3. Make Changes & Test
```bash
# Make your changes
npm run dev  # Test backend
cd frontend && npm start  # Test frontend
```

### 4. Submit Pull Request
```bash
git add .
git commit -m "Add amazing new feature"
git push origin feature/amazing-new-feature
```

Then open a Pull Request on GitHub!

---

## Future Enhancements

- [ ] **Advanced WCAG Analysis** - Support for WCAG 2.2 guidelines
- [ ] **Batch URL Scanning** - Analyze multiple pages at once
- [ ] **PDF Reports** - Downloadable accessibility reports
- [ ] **Team Collaboration** - Share analyses with team members
- [ ] **API Rate Limiting** - Prevent abuse of the scanning service
- [ ] **Mobile App** - React Native mobile application
- [ ] **Browser Extension** - Quick accessibility checks while browsing

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **axe-core** team for the amazing accessibility testing engine
- **Firebase** for providing excellent backend-as-a-service
- **React** community for the fantastic frontend framework
- **Web Accessibility Initiative (WAI)** for WCAG guidelines
- All the developers working to make the web more accessible

---

## 📞 Contact & Support

**Janmejay Tiwari**  
📧 **Email**: okrtwr3108@gmail.com 
🔗 **LinkedIn**: [https://www.linkedin.com/in/janmejay-tiwari/](https://www.linkedin.com/in/janmejay-tiwari/)  
🌐 **Portfolio**: [https://janmejaytiwari.vercel.app/](https://janmejaytiwari.vercel.app/)


### Found a Bug?
Please open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Your environment details (OS, Node version, etc.)

---

## ⭐ Show Your Support

If this project helped you or you learned something from it, please give it a ⭐ on GitHub!

**Made with ❤️ by Janmejay Tiwari**

---

*Building accessible web experiences, one scan at a time.* 🌐♿

