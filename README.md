# CampusCare – Smart Campus Complaint and Grievance Management System

CampusCare is a web-based smart campus complaint and grievance management system designed to make complaint registration, tracking, and resolution easier within a college environment.

The platform provides a centralized system where students can submit complaints, faculty can review and manage grievances, and administrators can monitor the complaint management process.

## 🎯 Project Objectives

- Provide an easy platform for students to register complaints.
- Improve communication between students, faculty, and administration.
- Make complaint tracking and resolution more transparent.
- Reduce manual paperwork and simplify grievance management.
- Maintain complaint records in a centralized database.

## ✨ Key Features

- **User Authentication:** Login and registration functionality.
- **Role-Based Access:** Separate access for students, faculty, and administrators.
- **Complaint Management:** Submit and manage campus complaints.
- **Complaint Tracking:** Monitor complaint progress and status.
- **Centralized Management:** Organize grievance-related information.
- **User-Friendly Interface:** Simple and accessible web interface.

## 🛠️ Technologies Used

| Component | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js |
| Database | PostgreSQL |
| Programming Languages | JavaScript, SQL |
| Development Tools | Visual Studio Code, Git, GitHub |
| Database Management | pgAdmin 4 |

*Note: Ensure PostgreSQL is the actual database connected to your application before presenting it as the database technology.*

## 📁 Project Structure

```text
reva-hackathon-portal/
│
├── backend/
│   ├── db/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Navigate to the Project

```bash
cd reva-hackathon-portal
```

### 3. Setup Backend

```bash
cd backend
npm install
```

Configure your PostgreSQL database connection using your backend's required environment variables.

Create your `.env` file using the configuration expected by the backend.

Start the backend using the start command defined in `backend/package.json`.

### 4. Setup Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

### 5. Open the Application

Open the local URL displayed in your frontend terminal, usually:

```text
http://localhost:5173
```

## 🗄️ Database

CampusCare is designed to use PostgreSQL for storing application data.

The database can be managed and inspected using pgAdmin 4.

Database operations should include user management and complaint-related records, according to the implemented application schema.

## 🔐 Security

- Keep database credentials in environment variables.
- Never upload `.env` files or passwords to GitHub.
- Use secure password hashing for user authentication.
- Apply role-based authorization to protected operations.

## 🚀 Future Enhancements

- Email notifications for complaint updates.
- Complaint priority classification.
- Analytics dashboard for administrators.
- AI-based complaint categorization.
- Improved complaint resolution tracking.

## 🎓 Project Information

**Project Name:** CampusCare – Smart Campus Complaint and Grievance Management System

**Domain:** Full Stack Web Development

**Purpose:** College Hackathon / Academic Project

**Institution:** REVA University, Bengaluru

---

⭐ If you find this project useful, consider giving the repository a star!
