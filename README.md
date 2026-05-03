# 🚀 Task Management System

A full-stack **Role-Based Task Management Application** built using **FastAPI**, **PostgreSQL**, and **Vanilla JavaScript**, designed to simulate real-world team collaboration workflows.

---

## 🌐 Live Demo

👉 **Frontend (Vercel):**
https://team-task-manager-five-puce.vercel.app/

👉 **API Docs (FastAPI Swagger):**
`/docs` endpoint on backend

---

## ✨ Features

### 🔐 Authentication & Security

* User Signup & Login (JWT-based authentication)
* Password hashing using secure algorithms
* Protected API routes

---

### 🛡️ Role-Based Access Control (RBAC)

* **Admin**

  * Create projects
  * Assign tasks
  * Manage team members
* **Member**

  * View assigned tasks
  * Update task status

---

### 📊 Dashboard & Insights

* Total Tasks
* In Progress Tasks
* Completed Tasks
* Overdue Tasks (auto-detected)

---

### 📁 Project & Task Management

* Create and manage projects
* Assign tasks to specific users
* Track task status:

  * Todo
  * In Progress
  * Done

---

### ⚡ Real-Time Updates

* Dashboard updates dynamically after task changes
* Status changes reflect instantly

---

## 🏗️ Tech Stack

| Layer                     | Technology                    |
| ------------------------- | ----------------------------- |
| **Backend**               | FastAPI (Python)              |
| **Database**              | PostgreSQL (Railway)          |
| **ORM**                   | SQLAlchemy                    |
| **Frontend**              | HTML, CSS, Vanilla JavaScript |
| **Authentication**        | JWT                           |
| **Deployment (Frontend)** | Vercel                        |
| **Database Hosting**      | Railway                       |

---

## ⚙️ Architecture

```text
Frontend (Vercel)
        ↓
FastAPI Backend (REST APIs)
        ↓
PostgreSQL Database (Railway)
```

---

## 📂 Project Structure

```text
task-manager/
│
├── app/
│   ├── core/        # Auth & security
│   ├── models/      # Database models
│   ├── schemas/     # Pydantic validation
│   ├── routes/      # API endpoints
│   ├── utils/       # Dependencies & helpers
│   └── main.py      # Entry point
│
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── admin.html
│   ├── main.js
│   └── style.css
│
├── requirements.txt
└── README.md
```

---

## 🔄 Application Flow

### 👨‍💼 Admin Flow

1. Login as admin
2. Create project
3. Add members
4. Assign tasks

---

### 👨‍💻 Member Flow

1. Login as member
2. View assigned tasks
3. Update task status
4. Dashboard updates automatically

---

## 🧪 API Endpoints (Sample)

| Method | Endpoint              | Description    |
| ------ | --------------------- | -------------- |
| POST   | `/auth/register`      | Register user  |
| POST   | `/auth/login`         | Login          |
| POST   | `/projects/`          | Create project |
| POST   | `/tasks/`             | Create task    |
| PUT    | `/tasks/{id}`         | Update task    |
| GET    | `/dashboard/my-tasks` | Get user tasks |

---

## 🚀 Deployment Notes

* **Frontend deployed on Vercel** for fast and reliable hosting
* **PostgreSQL database hosted on Railway**
* Backend APIs connected to Railway DB

> Note: Due to limitations in Railway free tier deployment, frontend is hosted separately on Vercel.

---

## 🎯 Key Highlights

* Clean backend architecture (FastAPI + SQLAlchemy)
* Proper database relationships
* Role-based authorization implemented correctly
* Real-time dashboard calculations
* Fully working end-to-end system

---

## 📌 Future Improvements

* Add notifications system
* Add task priority levels
* Add file attachments
* Add AI-based task suggestions

---

## 👨‍💻 Author

**Rajveer Singhal**
Aspiring Data Scientist & Software Engineer

---

## 🏁 Conclusion

This project demonstrates:

* Full-stack development skills
* API design and integration
* Authentication & authorization
* Real-world application logic

---

⭐ If you like this project, feel free to star the repo!
