const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname));
app.use("/images", express.static(path.join(__dirname, "images")));

// Ensure directories exist
const dataDir = path.join(__dirname, "data");
const imagesDir = path.join(__dirname, "images");
const userImgDir = path.join(imagesDir, "users");
const mechImgDir = path.join(imagesDir, "mechanics");

[dataDir, imagesDir, userImgDir, mechImgDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ================= Helper Functions =================
const readJSON = file => {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return [];
  }
};

const writeJSON = (file, data) => {
  const filePath = path.join(dataDir, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
};

// ================= Multer Config =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.body.type === "user" ? userImgDir : mechImgDir;
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, req.body.national_id + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(file.mimetype) && allowed.test(ext)) cb(null, true);
    else cb(new Error("Only image files allowed"));
  }
});

// ================= Registration =================
app.post("/register", upload.single("photo"), (req, res) => {
  if (!req.file) return res.status(400).send("Photo is required");

  const ext = path.extname(req.file.originalname) || ".jpg";
  const photoPath = `/images/${req.body.type === "user" ? "users" : "mechanics"}/${req.body.national_id}${ext}`;

  const newEntry = {
    name: req.body.name?.trim() || "",
    phone: req.body.phone?.trim() || "",
    national_id: req.body.national_id?.trim() || "",
    vehicle_type: req.body.vehicle_type?.trim() || "",
    type: req.body.type,
    age: req.body.age?.trim() || null,
    email: req.body.email?.trim() || null,
    password: req.body.password || null,
    location: req.body.location || "0,0",
    photo: photoPath,
    created_at: new Date().toISOString()
  };

  const waitList = readJSON("wait_review.json");
  waitList.push(newEntry);
  writeJSON("wait_review.json", waitList);

  res.redirect("/index.html?registered=true");
});

// ================= Login =================
app.post("/login", (req, res) => {
  const { type, national_id, location } = req.body;

  const admins = readJSON("admins.json");
  const blocked = readJSON("blocked.json");
  const file = type === "user" ? "users.json" : "mechanics.json";
  const db = readJSON(file);

  const user = db.find(u => u.national_id === national_id);

  if (user && location) {
    user.location = location;
    writeJSON(file, db);
  }

  if (blocked.some(b => b.national_id === national_id)) return res.json({ blocked: true });
  if (admins.some(a => a.national_id === national_id)) return res.json({ redirect: "/pages/home_admin/home_admin.html" });
  if (user) {
    const redirect = type === "mechanic"
      ? "/pages/home_mechanic/home_mechanic.html"
      : "/pages/home_user/home_user.html";
    return res.json({ redirect });
  }

  res.json({ error: "User not found or not approved yet" });
});

// ================= Search Endpoints =================
app.get("/search/:type", (req, res) => {
  const mapping = {
    wait: "wait_review.json",
    reviews: "history_requests.json",
    pending: "pending_requests.json",
    history: "history_requests.json",
    user: "users.json",
    mechanic: "mechanics.json",
    mechanics: "mechanics.json"
  };

  const file = mapping[req.params.type];
  if (!file) return res.status(400).json({ error: "Invalid type" });

  const data = readJSON(file);
  if (req.params.type === "mechanic" || req.params.type === "mechanics") {
    return res.json(data.filter(d => d.type === "mechanic"));
  }
  res.json(data);
});

// ================= Admin Actions (unchanged) =================
app.post("/admin/approve", (req, res) => {
  const { national_id } = req.body;
  let waitList = readJSON("wait_review.json");
  const person = waitList.find(p => p.national_id === national_id);
  if (!person) return res.json({ error: "Not found" });

  const targetFile = person.type === "user" ? "users.json" : "mechanics.json";
  const targetDb = readJSON(targetFile);
  targetDb.push(person);
  writeJSON(targetFile, targetDb);

  waitList = waitList.filter(p => p.national_id !== national_id);
  writeJSON("wait_review.json", waitList);
  res.json({ success: true });
});

// JavaScript// Block a user/mechanic from the waiting list
app.post("/admin/block", (req, res) => {
  const { national_id } = req.body;

  if (!national_id) {
    return res.status(400).json({ error: "national_id is required" });
  }

  let waitList = readJSON("wait_review.json");
  const personIndex = waitList.findIndex(p => p.national_id === national_id);

  if (personIndex === -1) {
    return res.json({ error: "Person not found in waiting list" });
  }

  const person = waitList[personIndex];

  // Add to blocked list
  const blocked = readJSON("blocked.json");
  blocked.push(person);
  writeJSON("blocked.json", blocked);

  // Remove from waiting list
  waitList.splice(personIndex, 1);
  writeJSON("wait_review.json", waitList);

  console.log(`Blocked and removed from waitlist: ${person.name} (${national_id})`);
  res.json({ success: true });
});

app.post("/admin/blockApproved", (req, res) => {
  const { national_id, type } = req.body;
  const file = type === "user" ? "users.json" : "mechanics.json";
  let db = readJSON(file);
  const person = db.find(p => p.national_id === national_id);
  if (!person) return res.json({ error: "Not found" });

  const blocked = readJSON("blocked.json");
  blocked.push(person);
  writeJSON("blocked.json", blocked);

  db = db.filter(p => p.national_id !== national_id);
  writeJSON(file, db);
  res.json({ success: true });
});

// ================= REQUESTS SYSTEM – FULLY FIXED & SAFE =================

// Create new request – NOW 100% SAFE FROM NUMBER .trim() ERROR
// CREATE NEW REQUEST – NOW SAVES MECHANIC NAME TOO
app.post("/request/new", (req, res) => {
  const requests = readJSON("pending_requests.json");

  const mechanicId = req.body.mechanic_id || req.body.mechanicId || req.body.mechanic_nid || req.body.national_id;
  const mechanicName = req.body.mechanic_name?.trim() || "Unknown Mechanic";

  if (!mechanicId) {
    return res.status(400).json({ error: "Mechanic ID is required" });
  }

  const newReq = {
    id: Date.now().toString(),
    user_id: String(req.body.user_id || "").trim(),
    user_name: String(req.body.user_name || "").trim(),
    user_phone: String(req.body.user_phone || "").trim(),
    mechanic_id: String(mechanicId).trim(),
    mechanic_name: mechanicName,                    // ← THIS IS THE FIX
    vehicle: String(req.body.vehicle || "").trim(),
    problem: String(req.body.problem || "").trim(),
    offered_payment: String(req.body.offered_payment || "").trim(),
    location: req.body.location || "0,0",
    created_at: new Date().toISOString(),
    state: "pending"
  };

  requests.push(newReq);
  writeJSON("pending_requests.json", requests);

  console.log("New request with mechanic name:", newReq.mechanic_name);
  res.json({ success: true, id: newReq.id });
});

// Cancel request
app.post("/request/cancel", (req, res) => {
  const { id } = req.body;
  let requests = readJSON("pending_requests.json");
  requests = requests.filter(r => r.id !== id);
  writeJSON("pending_requests.json", requests);
  res.json({ success: true });
});

// Accept request
app.post("/request/accept/:id", (req, res) => {
  const id = req.params.id;
  const pending = readJSON("pending_requests.json");
  const reqObj = pending.find(r => r.id === id);
  if (!reqObj) return res.json({ error: "Not found" });

  reqObj.state = "accepted";
  writeJSON("pending_requests.json", pending);
  console.log(`Request ${id} accepted`);
  res.json({ success: true });
});

// Reject request
app.post("/request/reject/:id", (req, res) => {
  const id = req.params.id;
  let pending = readJSON("pending_requests.json");
  pending = pending.filter(r => r.id !== id);
  writeJSON("pending_requests.json", pending);
  console.log(`Request ${id} rejected`);
  res.json({ success: true });
});

// Complete request → move to history
app.post("/request/complete", (req, res) => {
  const { id, review = "", rating = 0 } = req.body;

  let pending = readJSON("pending_requests.json");
  let history = readJSON("history_requests.json");

  const idx = pending.findIndex(r => r.id === id);
  if (idx === -1) return res.json({ error: "Request not found" });

  const completed = {
    ...pending[idx],
    review: String(review).trim(),
    rating: parseInt(rating) || 0,
    state: "ended",
    completed_at: new Date().toISOString()
  };

  history.push(completed);
  writeJSON("history_requests.json", history);

  pending.splice(idx, 1);
  writeJSON("pending_requests.json", pending);

  console.log(`Request ${id} completed`);
  res.json({ success: true });
});

// ================= MECHANIC DASHBOARD ENDPOINTS (SAFE STRING COMPARISON) =================
app.get("/pending/:mechanicId", (req, res) => {
  const { mechanicId } = req.params;
  const pending = readJSON("pending_requests.json");

  const filtered = pending.filter(r =>
    String(r.mechanic_id || "").trim() === String(mechanicId).trim() && r.state === "pending"
  );

  console.log(`[PENDING] Mechanic ${mechanicId} → ${filtered.length} requests`);
  res.json(filtered);
});

app.get("/active/:mechanicId", (req, res) => {
  const { mechanicId } = req.params;
  const pending = readJSON("pending_requests.json");

  const active = pending.filter(r =>
    String(r.mechanic_id || "").trim() === String(mechanicId).trim() && r.state === "accepted"
  );

  console.log(`[ACTIVE] Mechanic ${mechanicId} → ${active.length} jobs`);
  res.json(active);
});

app.get("/history/:mechanicId", (req, res) => {
  const { mechanicId } = req.params;
  const history = readJSON("history_requests.json");

  const filtered = history.filter(r =>
    String(r.mechanic_id || "").trim() === String(mechanicId).trim()
  );

  console.log(`[HISTORY] Mechanic ${mechanicId} → ${filtered.length} completed`);
  res.json(filtered);
});

// ================= Start Server =================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});