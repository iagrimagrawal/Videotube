# 🎥 VideoTube

A full-stack video sharing platform built using the MERN stack where users can upload videos, authenticate securely, manage profiles, and interact with content.

---

# 🚀 Features

- User Authentication (JWT)
- Access & Refresh Tokens
- Video Uploads
- Cloudinary Media Storage
- User Profiles
- Responsive Frontend
- REST API Backend
- MongoDB Database Integration

---

# 🛠️ Tech Stack

## Frontend
- React.js
- Vite
- Tailwind CSS
- Axios

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Cloudinary

---

# 📂 Project Structure

```text
videotube/
│
├── backend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── .env.example
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│
├── README.md
└── .gitignore
```

---

# ⚙️ Installation

## 1️⃣ Clone the repository

```bash
git clone https://github.com/yourusername/videotube.git
```

---

## 2️⃣ Move into the project directory

```bash
cd videotube
```

---

# 🔧 Backend Setup

## 1️⃣ Go to backend folder

```bash
cd backend
```

---

## 2️⃣ Install dependencies

```bash
npm install
```

If dependency issues occur:

```bash
npm install --force
```

---

## 3️⃣ Create `.env` file

Create a `.env` file inside the `backend` folder and add:

```env
PORT=

MONGODB_URL=

CORS_ORIGIN=

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 4️⃣ Run backend server

```bash
npm run dev
```

Backend will start on:

```text
http://localhost:8000
```

---

# 💻 Frontend Setup

## 1️⃣ Open a new terminal

Move to frontend folder:

```bash
cd frontend
```

---

## 2️⃣ Install dependencies

```bash
npm install
```

---

## 3️⃣ Run frontend

```bash
npm run dev
```

Frontend will start on:

```text
http://localhost:5173
```

---

# ☁️ Environment Variables

| Variable | Description |
|----------|-------------|
| PORT | Server Port |
| MONGODB_URL | MongoDB Connection String |
| CORS_ORIGIN | Frontend URL |
| ACCESS_TOKEN_SECRET | JWT Access Token Secret |
| REFRESH_TOKEN_SECRET | JWT Refresh Token Secret |
| CLOUDINARY_CLOUD_NAME | Cloudinary Cloud Name |
| CLOUDINARY_API_KEY | Cloudinary API Key |
| CLOUDINARY_API_SECRET | Cloudinary API Secret |

---

# 🔐 Security Notes

- Never upload `.env` file to GitHub
- Keep API keys private
- Rotate secrets if exposed publicly

---

# 🧪 Scripts

## Backend

```bash
npm run dev
npm start
```

## Frontend

```bash
npm run dev
npm run build
```

---

---

# 🌍 Deployment

You can deploy:

- Frontend → Vercel / Netlify
- Backend → Render / Railway
- Database → MongoDB Atlas

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Push the branch
5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

Agrim Agrawal

GitHub: https://github.com/iagrimagrawal