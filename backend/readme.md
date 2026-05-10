# 🚀 VideoTube Backend

Backend API for the VideoTube platform built using Node.js, Express.js, MongoDB, and JWT authentication.

This backend handles:
- User Authentication
- Access & Refresh Tokens
- Video APIs
- File Uploads
- Cloudinary Integration
- MongoDB Database Operations

---

# 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Cloudinary
- Multer
- Bcrypt
- Cookie Parser

---

# 📂 Folder Structure

```text
backend/
│
├── public/
├── src/
│   ├── controllers/
│   ├── db/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── app.js
│   └── index.js
│
├── package.json
├── .env.example
└── README.md
```

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/videotube.git
```

---

## 2️⃣ Move to backend folder

```bash
cd videotube/backend
```

---

## 3️⃣ Install dependencies

```bash
npm install
```

If dependency issues occur:

```bash
npm install --force
```

---

# ☁️ Environment Variables

Create a `.env` file inside the backend folder and add:

```env
PORT=8000

MONGODB_URL=

CORS_ORIGIN=http://localhost:5173

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

# ▶️ Run Backend Server

## Development Mode

```bash
npm run dev
```

---

## Production Mode

```bash
npm start
```

Backend will start on:

```text
http://localhost:8000
```

---

# 🔐 Authentication

This backend uses:
- JWT Access Tokens
- Refresh Tokens
- HTTP-only Cookies

---

# 📦 API Features

- User Registration
- User Login
- Logout
- Refresh Access Token
- Video Upload
- Video Fetching
- User Profile Management

---

# 📁 File Uploads

Media uploads are handled using:
- Multer
- Cloudinary Storage

---

# 🧪 Available Scripts

## Start Development Server

```bash
npm run dev
```

---

## Start Production Server

```bash
npm start
```

---

# 🌍 API Base URL

```text
http://localhost:8000/api/v1
```

---

# 🔒 Security Notes

- Never upload `.env`
- Keep JWT secrets private
- Use HTTPS in production
- Rotate secrets if exposed

---

# 📸 API Testing

You can test APIs using:
- Postman
- Thunder Client
- Insomnia

---

# ☁️ Deployment

Backend can be deployed on:
- Render
- Railway
- Cyclic
- AWS
- DigitalOcean

Database:
- MongoDB Atlas

---

# 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push branch
5. Open Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

Agrim Agrawal

GitHub: https://github.com/iagrimagrawal