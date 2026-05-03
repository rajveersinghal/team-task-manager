# TasklyAI 

TasklyAI is a high-performance, full-stack Task Management ecosystem designed for high-velocity teams. It combines a robust **FastAPI** backend with a high-fidelity **Vanilla JS** frontend to deliver a premium enterprise-grade experience with zero framework overhead.

![Railway Deployment](https://img.shields.io/badge/Deploy-Railway-blueviolet?style=for-the-badge&logo=railway)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Modern CSS](https://img.shields.io/badge/UI-Midnight_Luxe-indigo?style=for-the-badge)

---

## ✨ Executive Highlights

TasklyAI isn't just a todo list—it's a technical demonstration of modern web engineering:

*   **📊 Intelligence Dashboard**: Real-time project health metrics with automated overdue detection and rose-red alerts.
*   **🛡️ Enterprise RBAC**: Strict Role-Based Access Control. Admins orchestrate; Members execute.
*   **🔐 Industrial-Grade Security**: JWT session management with SHA-256 hashing and Pydantic v2 data validation.
*   **🌑 Midnight Luxe Design**: A custom-built CSS design system featuring glassmorphism, fluid animations, and a mobile-first grid.

---

## 🛠️ Technical Architecture

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Engine** | Python 3.10 / FastAPI | Asynchronous performance & type-safe development. |
| **Logic** | ES6+ Vanilla JavaScript | Maximum performance with zero heavy-framework overhead. |
| **Design** | CSS3 Custom Tokens | Full control over the "Midnight Luxe" aesthetic. |
| **Storage** | PostgreSQL / SQLAlchemy | Relational integrity & production-grade scalability. |
| **Build** | Vite + Nixpacks | Lightning-fast builds & seamless Railway integration. |

---

## 📂 Project Structure
```text
├── app/
│   ├── core/           # Security & Auth Logic
│   ├── models/         # SQLAlchemy Database Entities
│   ├── routes/         # REST API Controllers
│   ├── schemas/        # Pydantic Input/Output Validators
│   └── main.py         # Entry Point & Frontend Mounter
├── frontend/
│   ├── main.js         # Core Application Driver
│   ├── style.css       # Custom Design Tokens & Tokens
│   └── index.html      # SPA Entry Point
└── nixpacks.toml       # Railway Unified Build Config
```

---

## 🚢 Direct Deployment to Railway

This project is pre-configured for a **unified deployment** (Backend + Frontend in one service).

### Step 1: Connect your Repository
1. Log in to [Railway.app](https://railway.app/).
2. Click **New Project** > **Deploy from GitHub**.
3. Select this repository.

### Step 2: Configure Environment Variables
In the **Variables** tab of your service, add the following (copy from your existing Railway DB if needed):
- `DATABASE_URL`: `postgresql://...` (Your Railway DB URL)
- `SECRET_KEY`: `your-random-string-here`
- `ALGORITHM`: `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES`: `60`

### Step 3: Automatic Build & Launch
Railway will automatically detect the `nixpacks.toml` file and perform the following:
1. Initialize a **Python** & **Node.js** environment.
2. Build the frontend into a production-ready `dist/` folder.
3. Start the FastAPI server to serve both the **API** and the **Frontend** assets.

---

## 📋 API Documentation
Explore the technical interface once deployed:
- **Interactive Swagger**: `https://your-app-url.up.railway.app/docs`
- **Clean ReDoc**: `https://your-app-url.up.railway.app/redoc`

---
*Created with a focus on **Performance**, **Security**, and **Visual Excellence**.*
