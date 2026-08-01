# VidyaUday — Rise of Knowledge

**VidyaUday** is a free student empowerment platform designed to support rural 10th and Intermediate students in Andhra Pradesh, India. The application provides centralized access to free learning resources, career roadmaps, scholarship searches, coding platforms, digital skills training, and contains a built-in AI Study Assistant named **Uday the Owl** to answer student queries in English, Telugu, and Hindi.

---

## Project Structure

```
VidyaUday/
├── README.md
├── index.html        # Main Frontend Application & Chatbot UI
├── .gitignore        # Git ignore rules
└── backend/          # Backend Server Files
    ├── server.js     # Express.js + Mongoose server
    ├── package.json  # Backend package dependencies & scripts
    └── .env.example  # Configuration variables template
```

---

## Getting Started

### 1. Prerequisites

- **Node.js** (v16 or higher recommended)
- **MongoDB** (running locally or a remote MongoDB Atlas URI)

---

### 2. Backend Setup & Run

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install the Node package dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and set your configuration details:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/digitaluday
   JWT_SECRET=your_jwt_secret_key
   SETUP_KEY=your_admin_setup_key
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
   The backend API will run on `http://localhost:5000`.

---

### 3. Frontend Setup

1. The frontend is a static page located in the root of the project (`index.html`).
2. You can open `index.html` directly in any web browser to view the application, or serve it using a local static file server like `http-server` or Live Server in VS Code.
3. Make sure the backend server is running if you want to connect database integrations like survey submissions.

---

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript, CSS Flexbox & Grid, responsive animations.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (via Mongoose ORM).
- **Authentication**: JSON Web Token (JWT) & bcryptjs hashing for secure admin dashboards.
- **AI Integrations**: Gemini API (model `gemini-1.5-flash`) for multi-lingual assistant chatbot operations, with browser Web Speech API for voice synthesis and recognition.
