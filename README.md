# Spotify Clone - Modern Full-Stack Music Streaming Web App

This is a premium, full-stack music streaming web application designed to replicate key Spotify player flows and features. The application includes a React SPA styled with Tailwind CSS, a Node.js/Express REST API backend, and a PostgreSQL database.

The app comes out of the box with seeded public royalty-free track URLs, enabling immediate playback, liking, and playlist management right after launch!

---

## 🚀 Key Features

* **Authentication (JWT)**: Secure user registration and login.
* **Music Player**: Play, pause, skip forward/backward controls, volume adjustment, and timeline scrubbing.
* **Interactive Waveform Visualizer**: Draws a real-time glowing canvas visualizer analyzing audio frequencies using the browser's Web Audio API.
* **Queue System**: Displays current tracks and upcoming selections, supporting queue insertions and song selection.
* **Playlists**: Create new playlists, add songs, delete songs, and play lists sequentially.
* **Likes & Favorites**: Instantly like or favorite tracks, tracking them under the dedicated "Liked Songs" library view.
* **Recently Played**: Track and display user's recently played history on the home feed.
* **Admin Upload Panel**: Full-featured panel for administrators to upload audio files (MP3/WAV) and cover art, which persist in the backend static uploads directory, and delete existing tracks.
* **Responsive Spotify Layout**: Premium dark-mode user interface adapting seamlessly across mobile, tablet, and desktop screens.
* **Docker Ready**: Setup for PostgreSQL database, Express backend, and React Vite frontend in containers.

---

## 🛠️ Tech Stack

* **Frontend**: React + Tailwind CSS v3.4 + Lucide Icons + Web Audio API.
* **Backend**: Node.js + Express + Multer for file uploads.
* **Database**: PostgreSQL (UUID keys, Cascading deletion rules).
* **Dockerization**: Docker multi-stage container structures and Docker Compose orchestration.

---

## 🏃 Running the Application

Ensure you have **Docker** and **Docker Compose** installed on your system.

### 1. Build and Run Containers
In the project root directory, run the following command:

```bash
docker compose up --build
```

This will automatically:
1. Spin up the **PostgreSQL** database and execute `init.sql` to initialize schemas and seed records.
2. Build and start the **Express backend** container on port `5000`.
3. Build and start the **Vite frontend** container on port `3000`.

### 2. View in Browser
Open your web browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

### 3. Demo Credentials
The database seeds two default users so you can test features immediately:

| Role | Email | Password |
|---|---|---|
| **Admin User** (can upload/delete songs) | `admin@spotify.com` | `password123` |
| **Standard Listener** | `user@spotify.com` | `password123` |

---

## 📂 Project Structure

```
├── docker-compose.yml       # Multi-container service definitions
├── init.sql                 # SQL script for schema definition and seed data
├── .env.example             # Local variables configuration template
├── README.md                # Documentation instructions
│
├── backend/
│   ├── src/
│   │   ├── db.js            # PG client connection pool
│   │   ├── server.js        # Express main entrypoint
│   │   ├── controllers/     # Controller handlers (auth, songs, playlists)
│   │   ├── middleware/      # Auth validation and Multer upload configurations
│   │   └── routes/          # API endpoint route registration
│   ├── uploads/             # Gitignored local media storage (audio/covers)
│   ├── Dockerfile
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/      # Player controls, Sidebar, Navbar, Modal dialogs
    │   ├── context/         # AuthSession and Audio playback global contexts
    │   ├── pages/           # Home, Search, Library, Login, Admin views
    │   ├── App.jsx          # Main layout router and favorites rendering
    │   ├── index.css        # Tailwind configurations and visualizer animation styles
    │   └── main.jsx
    ├── Dockerfile
    ├── tailwind.config.js   # Theme custom colors configurations
    ├── postcss.config.js
    ├── vite.config.js
    └── package.json
```

---

## 🔗 REST API Endpoints

### Auth Routes (`/api/auth`)
* `POST /register`: Registers a new user.
* `POST /login`: Logs in user and returns a JWT token.
* `GET /me`: Returns profile information for the authenticated user.

### Song Routes (`/api/songs`)
* `GET /`: Lists all songs.
* `GET /search?q=...`: Searches songs by title, artist, or album.
* `GET /trending`: Lists top tracks sorted by like count.
* `POST /`: Uploads audio and cover image files (Requires Admin role).
* `DELETE /:id`: Deletes track database record and corresponding media files (Requires Admin role).

### Playlist Routes (`/api/playlists`)
* `GET /`: Lists logged-in user's playlists.
* `POST /`: Creates a playlist.
* `GET /:id`: Gets details and tracks inside a specific playlist.
* `POST /:id/songs`: Adds a track to a playlist.
* `DELETE /:id/songs/:songId`: Removes a track from a playlist.
* `DELETE /:id`: Deletes the playlist.

### Library & Activity Routes (`/api/me`)
* `GET /favorites`: Lists liked tracks for the current user.
* `POST /favorites/:songId`: Likes a track.
* `DELETE /favorites/:songId`: Unlikes a track.
* `GET /recently-played`: Gets recently played history.
* `POST /recently-played/:songId`: Appends a play event record.

---

## ⚡ Swapping to S3-Compatible Storage
The file uploads currently write to the local directory `backend/uploads/` mounted via volume. To switch to AWS S3 or MinIO:
1. Update `backend/src/middleware/uploadMiddleware.js` to use `multer-s3` and `@aws-sdk/client-s3`.
2. Update the references in `audio_url` and `cover_url` to return S3 object locations.
