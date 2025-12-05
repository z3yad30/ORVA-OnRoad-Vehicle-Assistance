// ==== home_user.js – FULLY CORRECTED & WORKING ====
let selectedMechanic = null;
let selectedRequestForReview = null;
let currentRating = 0;

// Globally available for button onclick
window.openRequestForm = (id, name) => {
  selectedMechanic = { id, name };
  document.getElementById("modal-mechanic-name").textContent = name;
  document.getElementById("issue-description").value = "";
  document.getElementById("payment-amount").value = "";
  document.getElementById("request-modal").style.display = "flex";
};

document.addEventListener("DOMContentLoaded", async () => {
  const userId = localStorage.getItem("user_nid");
  const userType = localStorage.getItem("user_type");
  if (!userId || userType !== "user") {
    alert("Access denied. Please log in as a user.");
    localStorage.clear();
    window.location.href = "/pages/login/login.html";
    return;
  }

  // ===== Helpers =====
  async function getCurrentUser() {
    try {
      const res = await fetch("/search/user");
      if (!res.ok) return null;
      const users = await res.json();
      return users.find(u => u.national_id === userId);
    } catch (err) {
      console.error("Failed to load user:", err);
      return null;
    }
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) *
              Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ===== Load Mechanics =====
  async function loadMechanics() {
    let mechanics = [];
    try {
      const res = await fetch("/search/mechanic");
      if (res.ok) mechanics = await res.json();
    } catch (err) {
      console.error("Failed to load mechanics:", err);
    }
    if (!Array.isArray(mechanics)) mechanics = [];

    const user = await getCurrentUser();
    if (!user || !user.location || user.location === "0,0") {
      document.getElementById("mechanic-list").innerHTML = `
        <p style="text-align:center; color:#e74c3c; padding:20px;">
          Please set your location in the Profile tab first.
        </p>`;
      return;
    }

    const [userLat, userLon] = user.location.split(",").map(Number);
    mechanics = mechanics.map(m => {
      const [mLat, mLon] = (m.location || "0,0").split(",").map(Number);
      const distance = calculateDistance(userLat, userLon, mLat, mLon);
      return { ...m, distance };
    });

    const searchValue = (document.getElementById("search")?.value || "").trim().toLowerCase();
    if (searchValue) {
      mechanics = mechanics.filter(m => m.name.toLowerCase().includes(searchValue));
    }

    mechanics.sort((a, b) => a.distance - b.distance);

    const container = document.getElementById("mechanic-list");
    container.innerHTML = mechanics.length === 0
      ? `<p style="text-align:center; color:#888; margin:40px;">No mechanics found nearby.</p>`
      : mechanics.map(m => `
        <div class="card">
          <img src="${m.photo || '/assets/default_mechanic.png'}" alt="Mechanic Photo" class="mechanic-photo">
          <div class="info">
            <strong>${m.name}</strong><br>
            <small>Phone: ${m.phone || 'N/A'}</small><br>
            <small>Specialty: ${m.vehicle_type || 'All Vehicles'}</small><br>
            <small style="color:#27ae60; font-weight:bold;">
              ≈ ${m.distance.toFixed(1)} km away
            </small>
          </div>
          <button class="request-btn"
                  data-id="${m.national_id}"
                  data-name="${m.name.replace(/'/g, "&#39;")}">
            Request Help
          </button>
        </div>
      `).join("");

    // Event delegation – re-attach every time content is refreshed
    container.onclick = (e) => {
      if (e.target.classList.contains("request-btn")) {
        const id = e.target.dataset.id;
        const name = e.target.dataset.name;
        window.openRequestForm(id, name);
      }
    };
  }

  // ===== Request Modal =====
  document.getElementById("modal-cancel")?.addEventListener("click", () => {
    document.getElementById("request-modal").style.display = "none";
  });

  document.getElementById("modal-send")?.addEventListener("click", async () => {
    const problem = document.getElementById("issue-description").value.trim();
    const payment = document.getElementById("payment-amount").value.trim();

    if (!problem || !payment || payment < 100) {
      return alert("Please describe the issue and offer a valid payment amount (min 100 EGP).");
    }

    const user = await getCurrentUser();
    const payload = {
      id: Date.now().toString(),
      user_id: user.national_id,
      user_name: user.name,
      user_phone: user.phone,
      vehicle: user.vehicle_type || "Not specified",
      user_location: user.location,
      mechanic_id: selectedMechanic.id,
      mechanic_name: selectedMechanic.name,
      problem,
      offered_payment: Number(payment),
      state: "pending",
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch("/request/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        document.getElementById("request-modal").style.display = "none";
        alert(`Request sent to ${selectedMechanic.name}!`);
        loadPendingRequests();
      } else {
        alert("Failed to send request.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Try again.");
    }
  });

  // ===== Pending Requests =====
  async function loadPendingRequests() {
    const div = document.getElementById("pending-list");
    let requests = [];
    try {
      requests = await fetch("/search/pending").then(r => r.json());
    } catch (err) {
      div.innerHTML = "<p>Failed to load.</p>";
      return;
    }
    const user = await getCurrentUser();
    const mine = requests.filter(r => r.user_id?.toString() === user.national_id.toString());

    div.innerHTML = mine.length === 0
      ? `<p style="text-align:center; color:#888;">No pending requests.</p>`
      : mine.map(r => `
        <div class="card">
          <strong>${r.mechanic_name}</strong><br>
          <small>Issue: ${r.problem}</small><br>
          <small>Offered: ${r.offered_payment} EGP</small><br>
          <small>Sent: ${new Date(r.created_at).toLocaleString()}</small><br>
          <button class="cancel-btn" data-id="${r.id}">Cancel</button>
        </div>
      `).join("");

    div.querySelectorAll(".cancel-btn").forEach(btn => {
      btn.onclick = async () => {
        if (confirm("Cancel this request?")) {
          await fetch("/request/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: btn.dataset.id })
          });
          loadPendingRequests();
        }
      };
    });
  }

  // ===== History & Reviews =====
  async function loadHistoryRequests() {
    const div = document.getElementById("request-list");
    if (!div) return;

    let history = [];
    try {
      history = await fetch("/search/history").then(r => r.json());
    } catch (err) {
      div.innerHTML = "<p>Failed to load history.</p>";
      return;
    }

    const user = await getCurrentUser();
    const mine = history.filter(r => r.user_id?.toString() === user.national_id.toString());

    if (mine.length === 0) {
      div.innerHTML = `<p style="text-align:center; color:#888;">No completed services yet.</p>`;
      return;
    }

    div.innerHTML = mine.map(r => {
      const hasReview = r.review && r.rating;
      return `
        <div class="card">
          <strong>${r.mechanic_name}</strong><br>
          <small>Issue: ${r.problem}</small><br>
          <small>Completed: ${new Date(r.completed_at).toLocaleString()}</small><br>
          ${hasReview
            ? `<strong>Review:</strong> "${r.review}"<br>Rating: ${"⭐".repeat(r.rating)}`
            : `<button class="review-btn" data-req='${JSON.stringify(r)}'>Add Review</button>`
          }
        </div>
      `;
    }).join("");

    div.querySelectorAll(".review-btn").forEach(btn => {
      btn.onclick = () => {
        selectedRequestForReview = JSON.parse(btn.dataset.req);
        document.getElementById("review-mechanic-name").textContent = selectedRequestForReview.mechanic_name;
        document.getElementById("review-text").value = "";
        currentRating = 0;
        document.querySelectorAll(".star").forEach(s => s.classList.remove("selected"));
        document.getElementById("review-modal").style.display = "flex";
      };
    });
  }

  // ===== Review Modal =====
  document.querySelectorAll(".star").forEach(star => {
    star.addEventListener("click", () => {
      currentRating = parseInt(star.dataset.value);
      document.querySelectorAll(".star").forEach((s, i) => {
        s.classList.toggle("selected", i + 1 <= currentRating);
      });
    });
  });

  document.getElementById("review-cancel")?.addEventListener("click", () => {
    document.getElementById("review-modal").style.display = "none";
  });

  document.getElementById("review-submit")?.addEventListener("click", async () => {
    const review = document.getElementById("review-text").value.trim();
    if (!review || currentRating === 0) {
      return alert("Please write a review and select a rating.");
    }

    await fetch("/request/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedRequestForReview.id,
        review,
        rating: currentRating
      })
    });

    document.getElementById("review-modal").style.display = "none";
    loadHistoryRequests();
  });

  // ===== Profile =====
  async function loadProfile() {
    const user = await getCurrentUser();
    if (!user) return;
    document.getElementById("profile-name").value = user.name || "";
    document.getElementById("profile-age").value = user.age || "";
    document.getElementById("profile-email").value = user.email || "";
    document.getElementById("profile-phone").value = user.phone || "";
    document.getElementById("profile-vehicle").value = user.vehicle_type || "";
  }

  // ===== Navigation =====
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".tab").forEach(t => t.style.display = "none");
      document.getElementById(btn.dataset.tab + "-tab").style.display = "block";

      if (btn.dataset.tab === "home") loadMechanics();
      if (btn.dataset.tab === "pending") loadPendingRequests();
      if (btn.dataset.tab === "requests") loadHistoryRequests();
      if (btn.dataset.tab === "profile") loadProfile();
    });
  });

  // Initial load
  document.querySelector(".nav-btn.active")?.click() || document.querySelector(".nav-btn")?.click();

  // Search with debounce
  document.getElementById("search")?.addEventListener("input", () => {
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(loadMechanics, 400);
  });
});