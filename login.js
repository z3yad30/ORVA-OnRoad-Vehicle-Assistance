document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const type = document.getElementById("type").value;
  const national_id = document.getElementById("national_id").value;

  let location = "";
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        location = `${pos.coords.latitude},${pos.coords.longitude}`;
        login();
      },
      login
    );
  } else login();

  async function login() {
    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, national_id, location })
      });
      const data = await res.json();

      if(data.blocked) {
        alert("You are blocked from using this website.");
      } else if(data.error) {
        alert(data.error);
      } else if(data.redirect) {
        // ✅ store national_id so home pages know who’s logged in
        localStorage.setItem("user_nid", national_id);
        localStorage.setItem("user_type", type);
        window.location.href = data.redirect;
      }
    } catch(err) {
      console.error(err);
      document.getElementById("msg").textContent = "Error connecting to server.";
    }
  }
});
  