document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("type", document.getElementById("type").value);
  formData.append("photo", document.getElementById("photo").files[0]);
  formData.append("national_id", document.getElementById("N_id").value);
  formData.append("name", document.getElementById("name").value);
  formData.append("age", document.getElementById("age").value);
  formData.append("email", document.getElementById("email").value);
  formData.append("password", document.getElementById("password").value);
  formData.append("phone", document.getElementById("phone").value);
  formData.append("vehicle_type", document.getElementById("vehicle").value);
  // Optional: default location 0,0 for now
  formData.append("location", "0,0");

  try {
    const res = await fetch("/register", {
      method: "POST",
      body: formData
    });

    if (res.redirected) {
      window.location.href = res.url;
    } else {
      const data = await res.json();
      document.getElementById("msg").textContent = data.error || "Something went wrong";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("msg").textContent = "Server error";
  }
});
