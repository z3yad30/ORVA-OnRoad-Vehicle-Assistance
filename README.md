# ORVA-OnRoad-Vehicle-Assistance
README: |
  # ORVA – On Road Vehicle Breakdown Assistance

  ORVA is a desktop-style web application that connects vehicle owners with nearby mechanics for fast breakdown support.  
  The system includes three dashboards: **User**, **Mechanic**, and **Admin**, handling requests, approvals, tracking, and feedback.

  ---

  ## 🚀 Features

  ### 👤 User Module
  - Register & log in
  - Search mechanics by location
  - Send service requests
  - Track request status
  - Submit feedback after completion

  ### 🔧 Mechanic Module
  - Register & wait for admin approval
  - Log in when approved
  - View incoming requests
  - Accept / Reject / Complete requests
  - View request history

  ### 🛠️ Admin Module
  - Approve / reject mechanics
  - View all users & mechanics
  - Monitor system feedback
  - Manage blocked mechanics (if needed)

  ---

  ## 📂 Project Structure
```
ORVA-OnRoad-Vehicle-Assistance/
│
├── index.html
├── index.css
├── server.js
│
├── pages/
│ ├── login/
│ │ ├── login.html
│ │ ├── login.css
│ │ └── login.js
│ │
│ ├── register/
│ │ ├── register.html
│ │ ├── register.css
│ │ └── register.js
│ │
│ ├── home_user/
│ │ ├── home_user.html
│ │ ├── home_user.css
│ │ └── home_user.js
│ │
│ ├── home_mechanic/
│ │ ├── home_mechanic.html
│ │ ├── home_mechanic.css
│ │ └── home_mechanic.js
│ │
│ └── home_admin/
│ ├── home_admin.html
│ ├── home_admin.css
│ └── home_admin.js
│
├── images/
│ ├── users/
│ └── mechanics/
│
└── data/
├── wait_review.json
├── users.json
├── mechanics.json
├── admins.json
├── blocked.json
├── pending_requests.json
└── history_requests.json

```

---

## 🖥️ Tech Stack

### Frontend
- HTML5  
- CSS3  
- JavaScript (Vanilla)

### Backend
- Node.js  
- Express.js  
- Multer (Image Uploads)  
- JSON File-Based Storage  

---

## 🔗 Core Workflows

### 1️⃣ User → Mechanic Request Flow
- User searches available mechanics
- Sends a request with problem description
- Mechanic receives it in real-time
- Accepts / rejects / completes
- User adds rating & feedback

### 2️⃣ Mechanic Registration Flow
- Mechanic signs up
- Admin approves account
- Mechanic gains full access

### 3️⃣ Admin Control Flow
- Approves mechanics
- Manages system data
- Monitors all feedback

---

## 🧪 Run Project Locally

```bash
git clone https://github.com/z3yad30/ORVA-OnRoad-Vehicle-Assistance
cd ORVA-OnRoad-Vehicle-Assistance
npm install
node server.js
```

Then open:

http://localhost:3000

📸 Screenshots

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/080c2cf6-ae3e-4d89-acf0-36246a6a87c9" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/95aea1c4-449b-4b80-804c-9df99627337f" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/3f177f36-cae9-49f3-a09f-14353f986b7e" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/f0bc4551-4fef-453c-a375-c6cff3a38e7d" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/8469efb7-5ec3-4093-b17b-e0528be3406b" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/d18924d8-ed71-42d0-b55a-670ca64b6a94" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/debae9d4-c928-4709-9a2c-595c2bc4aeb5" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/29f9006e-1151-475b-a1d6-e698982d94fb" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/39b298f7-bb21-4f74-990b-df5e8450aac3" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/f11d3ef8-438e-428b-af97-50f8603b0b1e" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/519408e2-5d2e-4f96-ae98-6cb759f435e7" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/fde107ff-bef8-4d22-961f-5dd2348c5f29" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/c3b909fa-d6c7-40f3-8a76-20bb797c1e9f" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/523bac75-1d63-42e4-b94d-a99c6ad3d75a" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/ed5dc15b-711b-4eef-8353-872160acd57a" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/305408ed-7395-4205-b99f-4085fc78c4bf" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/45d0660a-400f-4205-b32c-b86a1f60f5a9" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/f44074e4-b258-4b40-8f08-8bfba02e030c" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/1420e0de-9594-4bdf-bd42-7230a23e9b13" />


📝 License

This project is open-source and free to improve, modify, or build upon.



