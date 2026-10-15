# HR Manager & Salary Analytics System
**Course:** Final Exam - Internet Programming (2026)  
**Student ID:** 6730202386  
**Repository Name:** `Std6730202386IPFinal2026`  
**Cloud Backend URL:** [http://119.59.102.161:3037](http://119.59.102.161:3037)  
**Database:** MySQL (`ip_std6730202386`) on phpMyAdmin  

---

## 📌 Project Overview
A full-stack enterprise workforce compensation and analytics suite featuring:
1. **Phase 1: Authentication & Employee Lifecycle Management (CRUD)**: Secure login, employee directory management, status toggling, in-place editing, and real-time deletion with client confirmation.
2. **Phase 2: Automated Salary Clustering (K-Means Analytics)**: 1D/2D K-Means clustering algorithm ($k=3$) grouping workforce salaries into Tiered compensation structures with a Matplotlib-style 2D Scatter Plot visualization.
3. **Cloud & Database Integration**: Deployed to the university cloud server (`119.59.102.161`) with live MySQL persistence in table `Raphiphat_6730202386`.

---

## 🏗️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React Native (Expo SDK 51) / React Native Web | Responsive modern SaaS dashboard with 2D Canvas-style Scatter Plot |
| **Backend** | Node.js & Express.js | RESTful API with async database routing and K-Means logic |
| **Database** | MySQL 8.0 / MariaDB (phpMyAdmin) | Persistent storage in table `Raphiphat_6730202386` |
| **Deployment** | Ubuntu Linux Cloud Server | Port `3037` with SSH remote interactive environment |

---

## 📂 Project Directory Structure

```text
Std6730202386IPFinal2026/
├── backend/
│   ├── auth.js                # Authentication logic (admin / password123)
│   ├── clustering.js          # K-Means algorithm (k=3)
│   ├── db.js                  # MySQL Connection Pool & Auto Table Seeder
│   ├── employees.js           # Database CRUD queries with in-memory fallback
│   ├── server.js              # Express REST API routes & middleware
│   ├── package.json           # Backend dependencies (express, cors, mysql2, dotenv)
│   └── .env.example           # Sample environment configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── KMeansScatterPlot.js  # Matplotlib-style 2D Scatter Plot
│   │   └── services/
│   │       └── api.js         # Centralized API HTTP client
│   ├── App.js                 # Main Application (Login, KPI Cards, Directory, Modals)
│   ├── package.json           # Frontend dependencies (expo, react-native-web)
│   └── .env                   # Cloud Backend API URL configuration
├── database/
│   └── Raphiphat_6730202386.sql  # SQL schema and seed data
└── README.md
```

---

## 🔑 Default Credentials

- **Username:** `admin`
- **Password:** `password123`

---

## 🚀 Getting Started Locally

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```
*The backend runs at `http://localhost:3000` (or the configured `PORT` in `.env`).*

### 2. Frontend Setup
```bash
cd frontend
npm install

# Run on Web Browser (Recommended)
npx expo start --web

# Or Run with Expo Go (Mobile)
npx expo start
```
*The frontend web app runs at `http://localhost:8081`.*

---

## ☁️ Cloud & Database Setup

### 1. Database Table: `Raphiphat_6730202386`
Import or execute the following SQL in phpMyAdmin (`ip_std6730202386`):

```sql
USE ip_std6730202386;

CREATE TABLE IF NOT EXISTS `Raphiphat_6730202386` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `position` VARCHAR(100) NOT NULL,
  `salary` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Active', 'On Leave') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Raphiphat_6730202386` (`name`, `position`, `salary`, `status`) VALUES
('John Doe', 'Software Engineer', 45000, 'Active'),
('Jane Smith', 'Product Designer', 38000, 'Active'),
('Mike Johnson', 'HR Specialist', 32000, 'On Leave'),
('Sara Wilson', 'Finance Analyst', 52000, 'Active'),
('David Brown', 'Marketing Manager', 68000, 'Active');
```

### 2. Backend Cloud Execution
```bash
ssh -p 2222 std6730202386@119.59.102.161
cd ~/Std6730202386IPFinal2026/backend
npm install
node server.js
```
*Backend is accessible at `http://119.59.102.161:3037`.*

---

## 📡 REST API Documentation

### Authentication
- `POST /api/login`
  - Body: `{ "username": "admin", "password": "password123" }`
  - Response `200 OK`: `{ "success": true, "token": "mock-jwt-token" }`

### Employee Management
- `GET /api/employees` - Retrieve all employees from MySQL database
- `POST /api/employees` - Add new employee (validates non-empty fields & numeric salary $\ge 0$)
- `PUT /api/employees/:id` - Edit employee details (name, position, salary, status)
- `PUT /api/employees/:id/status` - Toggle status between `Active` and `On Leave`
- `DELETE /api/employees/:id` - Permanently remove employee record (`204 No Content`)

### Analytics & Clustering
- `GET /api/employees/salary-clusters`
  - Calculates 1D K-Means ($k=3$) over active workforce salaries
  - Response:
    ```json
    {
      "success": true,
      "clusters": [
        { "group": "Tier 1", "centroid": 35000, "count": 2 },
        { "group": "Tier 2", "centroid": 48500, "count": 2 },
        { "group": "Tier 3", "centroid": 68000, "count": 1 }
      ]
    }
    ```

### Health Check
- `GET /api/health`
  - Returns server health status and real-time MySQL database connection verification.

---

## 🎯 Key Design & Architectural Highlights
- **Human-Crafted SaaS UX/UI**: Designed with a clean enterprise slate palette, KPI metric summary cards, real-time search filtering, and custom non-blocking confirmation dialogs.
- **Matplotlib-Style Scatter Visualization**: Interactive 2D scatter plot rendering cluster groupings with standard scientific palette colors, tick axes ($-30$ to $30$), cluster centroids, and hover tooltips.
- **Resilient Fallback Storage**: The backend automatically detects MySQL database health. If the cloud database is temporarily unreachable, it seamlessly falls back to in-memory state without crashing.
