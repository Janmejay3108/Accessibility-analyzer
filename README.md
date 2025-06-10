# Accessibility Analyzer

A comprehensive web application for analyzing and improving website accessibility compliance with WCAG guidelines.

## Overview

The Accessibility Analyzer is a full-stack web application designed to help developers, designers, and content creators ensure their websites meet accessibility standards. The application provides automated scanning, detailed reporting, and actionable recommendations for improving web accessibility.

## Features

- **Automated Accessibility Scanning**: Comprehensive analysis of web pages for WCAG compliance
- **Detailed Reporting**: In-depth reports with specific issues and recommendations
- **User Management**: Secure authentication and user account management
- **Dashboard Analytics**: Visual insights into accessibility metrics and trends
- **API Integration**: RESTful API for programmatic access to scanning capabilities
- **Real-time Analysis**: Live scanning and immediate feedback

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **Firebase/Firestore** for data storage and real-time capabilities
- **Firebase Authentication** for user authentication and Google OAuth integration
- **Axe-core** for accessibility testing engine

### Frontend
- **React.js** with modern hooks and context
- **Material-UI** or **Tailwind CSS** for responsive design
- **Chart.js** or **D3.js** for data visualization
- **Axios** for API communication

## Project Structure

```
accessibility-analyzer/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── utils/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── public/
├── docs/
└── tests/
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Firebase account and project setup
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd accessibility-analyzer
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Set up Firebase project:
```bash
# Create a Firebase project at https://console.firebase.google.com
# Enable Firestore Database and Authentication
# Download the service account key JSON file
# Place it in the backend/config/ directory
```

5. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Firebase configuration
```

6. Start the development servers:
```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm start
```

## Development Phases

### Phase 1: Foundation Setup
- [x] Project initialization and version control
- [x] Backend setup (Node.js & Express)
- [ ] Database setup (Firebase/Firestore)
- [ ] Firebase Authentication integration

### Phase 2: Core Functionality
- [ ] Accessibility scanning engine integration
- [ ] API development
- [ ] Frontend React application
- [ ] User interface components

### Phase 3: Advanced Features
- [ ] Dashboard and analytics
- [ ] Reporting system
- [ ] User management
- [ ] Testing and optimization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, please open an issue in the GitHub repository.
