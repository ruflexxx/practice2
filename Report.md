# TaskFlow - Industry Practice Project

## 1. Project Overview
TaskFlow is a comprehensive, modern Task Management application designed to help users efficiently organize, track, and manage their daily activities. Built with a full-stack architecture, the application addresses the real-world problem of personal and professional productivity by offering robust features such as task categorization, prioritization, progress tracking, and filtering.

**Key Features:**
- **User Authentication:** Secure signup, login, and JWT-based session management.
- **Dashboard:** A personalized profile dashboard displaying real-time task statistics (total, pending, in-progress, completed, overdue).
- **Task Management (CRUD):** Users can create, read, update, and delete tasks.
- **Categorization & Tagging:** Group tasks by custom categories and tags.
- **Search & Filtering:** Advanced filtering by status, priority, category, and keyword search.
- **Local Storage:** User preferences (like light/dark mode and recent filters) are saved locally.
- **Responsive Design:** Fully functional across desktop, tablet, and mobile devices with a professional aesthetic and theme support.

**Technology Stack:**
- **Frontend:** HTML5, Vanilla CSS (with CSS Variables for theming), Vanilla JavaScript.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB with Mongoose ORM.
- **Security:** bcryptjs (password hashing), jsonwebtoken (JWT authentication), Joi (input validation).

---

## 2. Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or a MongoDB Atlas URI)

### Local Development Setup

1. **Clone or Extract the Repository:**
   Navigate into the project directory:
   ```bash
   cd taskflow
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   *Configuration:* Ensure the `.env` file is present in the `backend` directory. Example:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/taskflow
   JWT_SECRET
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```
   *Start the Backend Server:*
   ```bash
   npm run dev
   ```
   The API will run on `http://localhost:5000`.

3. **Frontend Setup:**
   The frontend is built with vanilla web technologies. You can serve it using any simple static server, for example using `serve` or `live-server`.
   ```bash
   cd ../frontend
   npx serve .
   ```
   Access the application in your browser (usually `http://localhost:3000`).

---

## 3. API Documentation

### Authentication Endpoints
- **POST `/api/auth/register`**
  - **Body:** `{ name, email, password, phone (optional) }`
  - **Description:** Registers a new user and returns a JWT.
- **POST `/api/auth/login`**
  - **Body:** `{ email, password }`
  - **Description:** Authenticates a user and returns a JWT.

### User Endpoints
- **GET `/api/users/profile`**
  - **Headers:** `Authorization: Bearer <token>`
  - **Description:** Retrieves the authenticated user's profile and their task statistics.

### Task Endpoints (Protected)
- **GET `/api/tasks`**
  - **Query Params:** `search`, `status`, `priority`, `category`, `page`, `limit`, `sort`, `dueBefore`, `dueAfter`
  - **Description:** Retrieves a paginated list of tasks matching the filters.
- **GET `/api/tasks/:id`**
  - **Description:** Retrieves a specific task by ID.
- **POST `/api/tasks`**
  - **Body:** `{ title, description, status, priority, dueDate, tags, category }`
  - **Description:** Creates a new task.
- **PUT `/api/tasks/:id`**
  - **Body:** `{ title, description, status, priority, dueDate, tags, category }`
  - **Description:** Updates an existing task.
- **PATCH `/api/tasks/:id/status`**
  - **Body:** `{ status }`
  - **Description:** Quickly toggles or updates the task status.
- **DELETE `/api/tasks/:id`**
  - **Description:** Deletes a task.

### Category Endpoints (Protected)
- **GET `/api/categories`**
  - **Description:** Retrieves all categories for the authenticated user.
- **POST `/api/categories`**
  - **Body:** `{ name, color, icon, description }`
  - **Description:** Creates a new category.
- **DELETE `/api/categories/:id`**
  - **Description:** Deletes a category.

---

## 4. Screenshots of Key Features

> **Note:** As this is a text-based report, placeholder slots are provided below. During actual submission, replace these with real screenshots of the running application.

1. **Dashboard & Statistics**
   *(Insert screenshot showing the dark/light mode dashboard with task statistics and recent tasks)*

2. **All Tasks & Filtering**
   *(Insert screenshot showing the tasks list with the active search bar, status dropdowns, and pagination)*

3. **Task Creation Modal**
   *(Insert screenshot showing the "New Task" form with validation, tags input, and priority selection)*

4. **Responsive Mobile View**
   *(Insert screenshot showing the collapsed sidebar and responsive grid on a mobile viewport)*

---

## 5. Deployment Link

The application is configured for deployment on Render.
- **Frontend / Live App URL:** `https://taskflow-ui.onrender.com`
- **Backend API URL:** `https://taskflow-api.onrender.com`

> *To deploy this project to Render:*
> 1. Connect this repository to your Render account.
> 2. The provided `render.yaml` blueprint will automatically create both the Backend API (Node.js) and Frontend Static Site services.
> 3. Add your `MONGODB_URI` environment variable in the Render Dashboard for the API service.
