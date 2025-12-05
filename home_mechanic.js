  // =========================== INITIAL SETUP ===========================
  const mechanicId = localStorage.getItem("user_nid");

  if (!mechanicId) {
    alert("You are not logged in!");
    window.location.href = "/pages/login/login.html";
  }

  // =========================== LOAD PENDING REQUESTS ===========================
  async function loadPendingRequests() {
    try {
      const res = await fetch(`/pending/${mechanicId}`);
      if (!res.ok) throw new Error("Failed to fetch pending requests");
      const pending = await res.json();

      const container = document.getElementById("pending-requests");
      if (!pending.length) {
        container.innerHTML = "<p>No pending requests at the moment.</p>";
        return;
      }

      container.innerHTML = pending.map(r => `
        <div class="card">
          <strong>${r.user_name || "Unknown User"}</strong><br>
          Phone: ${r.user_phone || "N/A"}<br>
          Vehicle: ${r.vehicle || "N/A"}<br>
          Problem: ${r.problem || "N/A"}<br>
          Offered: ${r.offered_payment ? r.offered_payment + " SAR" : "Not specified"}<br><br>
          <button class="accept-btn" onclick="acceptRequest('${r.id}')">Accept</button>
          <button class="reject-btn" onclick="rejectRequest('${r.id}')">Reject</button>
        </div>
      `).join("");

    } catch (err) {
      console.error("Error loading pending requests:", err);
      document.getElementById("pending-requests").innerHTML = "<p>Error loading requests.</p>";
    }
  }

  // =========================== ACCEPT REQUEST ===========================
  async function acceptRequest(id) {
    try {
      const res = await fetch(`/request/accept/${id}`, { method: "POST" });
      if (res.ok) {
        loadPendingRequests();
        loadActiveRequests();
      } else {
        alert("Failed to accept request.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  }

  // =========================== REJECT REQUEST ===========================
  async function rejectRequest(id) {
    try {
      const res = await fetch(`/request/reject/${id}`, { method: "POST" });
      if (res.ok) {
        loadPendingRequests();
      } else {
        alert("Failed to reject request.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  }

  // =========================== LOAD ACTIVE REQUESTS ===========================
  async function loadActiveRequests() {
    try {
      const res = await fetch(`/active/${mechanicId}`);
      if (!res.ok) throw new Error("Failed to fetch active requests");
      const active = await res.json();

      const container = document.getElementById("active-request-list");
      if (!active.length) {
        container.innerHTML = "<p>No active (accepted) requests.</p>";
        return;
      }

      container.innerHTML = active.map(r => `
        <div class="card">
          <strong>${r.user_name || "Unknown User"}</strong><br>
          Phone: ${r.user_phone || "N/A"}<br>
          Vehicle: ${r.vehicle || "N/A"}<br>
          Problem: ${r.problem || "N/A"}<br><br>
          <button class="done-btn" onclick="finishRequest('${r.id}')">Mark as Done</button>
        </div>
      `).join("");

    } catch (err) {
      console.error("Error loading active requests:", err);
      document.getElementById("active-request-list").innerHTML = "<p>Error loading active requests.</p>";
    }
  }

  // =========================== MARK AS DONE ===========================
  async function finishRequest(id) {
    const review = prompt("Optional: Leave a review for the customer:");
    let rating = 5;
    const ratingInput = prompt("Rate the customer (1–5):", "5");

    if (ratingInput !== null) {
      rating = parseInt(ratingInput);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        alert("Invalid rating. Must be between 1 and 5.");
        return;
      }
    }

    try {
      const res = await fetch("/request/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, review: review?.trim() || "", rating })
      });

      if (res.ok) {
        loadActiveRequests();
        loadHistory();
      } else {
        alert("Failed to complete request.");
      }
    } catch (err) {
      console.error("Completion error:", err);
      alert("Network error while completing request.");
    }
  }

  // =========================== LOAD HISTORY ===========================
  async function loadHistory() {
    try {
      const res = await fetch(`/history/${mechanicId}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      const history = await res.json();

      const container = document.getElementById("history-requests");
      if (!history.length) {
        container.innerHTML = "<p>No completed requests yet.</p>";
        return;
      }

      container.innerHTML = history.map(r => `
        <div class="card">
          <strong>${r.user_name || "Unknown User"}</strong><br>
          Vehicle: ${r.vehicle || "N/A"}<br>
          Problem: ${r.problem || "N/A"}<br>
          Rating: ${r.rating || "No rating"} / 5<br>
          Review: ${r.review || "No review given"}<br>
          <small>Completed on: ${new Date(r.completed_at).toLocaleString()}</small>
        </div>
      `).join("");

    } catch (err) {
      console.error("Error loading history:", err);
      document.getElementById("history-requests").innerHTML = "<p>Error loading history.</p>";
    }
  }

  // =========================== LOAD PROFILE ===========================
  async function loadProfile() {
    try {
      const res = await fetch("/search/mechanics");
      if (!res.ok) throw new Error("Failed to load mechanics");
      const mechs = await res.json();

      const me = mechs.find(m => m.national_id === mechanicId);
      if (!me) return;

      document.getElementById("profile-name")?.setAttribute("value", me.name || "");
      document.getElementById("profile-age")?.setAttribute("value", me.age || "");
      document.getElementById("profile-email")?.setAttribute("value", me.email || "");
      document.getElementById("profile-phone")?.setAttribute("value", me.phone || "");
      document.getElementById("profile-address")?.setAttribute("value", me.location || "");

      const img = document.getElementById("profile-pic");
      if (img && me.photo) img.src = me.photo;

    } catch (err) {
      console.error("Error loading profile:", err);
    }
  }

  // =========================== TAB NAVIGATION ===========================
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(tab => tab.style.display = "none");
      const targetTab = document.getElementById(btn.dataset.tab + "-tab");
      if (targetTab) targetTab.style.display = "block";

      if (btn.dataset.tab === "home") loadPendingRequests();
      if (btn.dataset.tab === "active-requests") loadActiveRequests();
      if (btn.dataset.tab === "requests") loadHistory();
      if (btn.dataset.tab === "profile") loadProfile();
    });
  });

  // Auto-click the active tab on page load
  (document.querySelector(".nav-btn.active") || document.querySelector(".nav-btn"))?.click();
