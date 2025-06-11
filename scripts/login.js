const form = document.querySelector("form");
const errorMsg = document.getElementById("login-error");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = event.target.querySelector("#email").value;
  const password = event.target.querySelector("#password").value;

  try {
    const response = await fetch("http://localhost:5678/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      window.location.href = "index.html";
    } else {
      errorMsg.textContent = "Identifiant ou mot de passe incorrect";
    }
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    errorMsg.textContent = "Erreur réseau ou serveur.";
  }
});
