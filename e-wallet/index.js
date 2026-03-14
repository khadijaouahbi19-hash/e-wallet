document.addEventListener("DOMContentLoaded", () => {
  // Bouton Login 
  const loginBtn = document.getElementById("Loginbtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = "login.html";
    });
  }

  // Bouton Sign in (inscription)
  const signinBtn = document.getElementById("Signinbtn");
  if (signinBtn) {
    signinBtn.addEventListener("click", () => {
      alert("Page d'inscription à venir !");
      // window.location.href = "signup.html";
    });
  }
});