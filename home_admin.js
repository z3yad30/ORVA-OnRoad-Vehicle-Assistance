// ----------- Load Waiting Approvals -----------
async function loadApproval() {
  const waitList = await fetch("/search/wait").then(r => r.json());
  const container = document.getElementById("approval-list");
  container.innerHTML = "";

  waitList.forEach(u => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <strong>${u.name}</strong> (${u.type})<br>
      <small>${u.email} | ${u.phone}</small><br>
      Vehicle: ${u.vehicle_type}<br>
      <button class="approve-btn">Approve</button>
      <button class="block-btn">Block</button>
    `;

    // approve
    card.querySelector(".approve-btn").onclick = async () => {
      await fetch("/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ national_id: u.national_id })
      });
      loadApproval();
    };

    // block
    card.querySelector(".block-btn").onclick = async () => {
      if (confirm(`Block ${u.name}?`)) {
        await fetch("/admin/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ national_id: u.national_id })
        });
        loadApproval();
      }
    };

    container.appendChild(card);
  });
}


// ----------- Load All Users & Mechanics -----------
async function loadUsers() {
  const users = await fetch("/search/user").then(r => r.json());
  const mechanics = await fetch("/search/mechanic").then(r => r.json());
  const container = document.getElementById("users-list");
  container.innerHTML = "";

  const all = [...users, ...mechanics];

  all.forEach(u => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <strong>${u.name}</strong> (${u.type})<br>
      <small>${u.email} | ${u.phone}</small><br>
      Location: ${u.location || "N/A"}<br>
      Vehicle: ${u.vehicle_type || "N/A"}<br>
      <button class="block-btn">Block</button>
    `;

    // block approved user/mechanic
    card.querySelector(".block-btn").onclick = async () => {
      if (confirm(`Block ${u.name}?`)) {
        await fetch("/admin/blockApproved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ national_id: u.national_id, type: u.type })
        });
        loadUsers();
      }
    };

    container.appendChild(card);
  });

  if (all.length === 0) container.innerHTML = "<p>No users or mechanics yet.</p>";
}


// ----------- Load Mechanic Reviews -----------
async function loadReviews() {
  const reviews = await fetch("/search/reviews").then(r => r.json());
  const container = document.getElementById("reviews-list");
  container.innerHTML = "";

  if (!reviews.length) {
    container.innerHTML = "<p>No reviews yet.</p>";
    return;
  }

  reviews.forEach(r => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <strong>${r.mechanic}</strong> ← review by <em>${r.reviewer}</em><br>
      Rating: ${"⭐".repeat(r.rating)} (${r.rating}/5)<br>
      <p>"${r.comment}"</p>
      <small>${r.date}</small>
    `;

    container.appendChild(card);
  });
}


// ----------- Navigation Tabs -----------
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => (t.style.display = "none"));

    document.getElementById(btn.dataset.tab + "-tab").style.display = "block";

    if (btn.dataset.tab === "approval") loadApproval();
    if (btn.dataset.tab === "users") loadUsers();
    if (btn.dataset.tab === "reviews") loadReviews();
  });
});

// load first tab
document.querySelector(".nav-btn.active").click();
