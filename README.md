# Application de Gestion du Pointage Numerique

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?logo=tailwindcss&logoColor=white)

## Overview

**Application de Gestion du Pointage Numerique** is a web application for managing employee attendance digitally. It supports secure authentication, role-based access, QR code attendance validation, GPS verification, leave management, reporting, and an analytics dashboard.

The project is designed for a professional portfolio and school project defense, with a focus on security, traceability, responsive design, and automated quality checks.

## Key Features

- Secure authentication with email and password.
- JWT-based sessions stored in `httpOnly` cookies.
- Role-based access control for `admin` and `employee` users.
- Smart attendance tracking with GPS verification.
- QR code scanning for attendance validation.
- QR code auto-regeneration every 5 minutes to reduce fraud.
- Entry and exit tracking with a dynamic clock-in/clock-out button.
- Leave management: request, validate, refuse, and comment.
- Admin dashboard with KPIs: present employees, absent employees, late arrivals, and hours worked.
- Anomaly detection for late arrivals, early departures, and insufficient hours.
- Advanced filters by day, week, month, year, and employee.
- Export reports to Excel and PDF.
- PWA support for mobile installation.
- Mobile-first responsive design.

## Actors

### Admin

The administrator can manage employees, generate QR codes, validate or refuse leave requests, and view the global analytics dashboard.

### Employee

The employee can clock in and out using QR code scanning with GPS verification, request leave, and view personal attendance history.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | MongoDB Atlas with Mongoose |
| Authentication | JWT stored in `httpOnly` cookies |
| QR Code Generation | `qrcode.react` |
| QR Code Scanning | `html5-qrcode` |
| Charts | Recharts |
| Deployment | Vercel |

## Architecture

```text
app/
+-- admin/
|   +-- dashboard/
|   +-- employes/
|   +-- qr-display/
|   +-- conges/
+-- employe/
|   +-- pointage/
|   +-- historique/
|   +-- conges/
+-- api/
    +-- auth/
    +-- pointage/
    +-- employes/
    +-- conges/
    +-- stats/
    +-- qrcode/
```

### Application Flow

1. Users authenticate with email and password.
2. The server creates a JWT session stored in an `httpOnly` cookie.
3. Role-based access separates admin workflows from employee workflows.
4. Employees scan a time-limited QR code and validate attendance with GPS.
5. Attendance, leave requests, statistics, and reports are managed through API routes backed by MongoDB Atlas.

## Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB Atlas database

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file at the project root and configure the following variables:

```env
MONGODB_URI=mongodb://localhost:27017/pfa_pointage
JWT_SECRET=votre_secret_jwt
```

For production, `MONGODB_URI` should point to the MongoDB Atlas connection string.

### Development Server

```bash
npm run dev
```

Open the application in your browser:

```text
http://localhost:3000
```

### Quality Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## CI/CD

The project includes a GitHub Actions CI pipeline focused on quality, security, and production readiness.

Pipeline steps:

- Install dependencies with `npm ci`.
- Run TypeScript type checking.
- Run ESLint.
- Build the application.
- Run dependency vulnerability checks with NPM Audit.
- Run secret scanning with TruffleHog.
- Run CodeQL security analysis.
- Deploy automatically on Vercel.
- Analyze code quality with SonarCloud.

## Security

Security is integrated into both the application design and the CI pipeline.

Application security:

- JWT authentication stored in `httpOnly` cookies.
- Role-based access control for admin and employee areas.
- QR code regeneration every 5 minutes to reduce attendance fraud.
- GPS verification for attendance validation.

CI security:

- NPM Audit for dependency vulnerabilities.
- CodeQL for static security analysis.
- TruffleHog for secret detection.
- SonarCloud for code quality analysis.

## Screenshots

Add screenshots of the main application screens here:

- Login page
- Admin dashboard
- Employee attendance page
- QR code display page
- Leave management page
- Attendance history page

## Conception

### Class Diagram

<img src="conception/class.png" alt="Class Diagram" width="500">

### Use Case Diagram

<img src="conception/usecase.png" alt="Use Case Diagram" width="500">

## Deployment

The application is designed to be deployed on Vercel.

Required production environment variables:

```env
MONGODB_URI=
JWT_SECRET=
```

## License

No license information has been provided for this project.
