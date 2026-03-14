
//  Base de données intégrée ──────────────────────────────────────────────────
const database = {
  users: [
    {
      id: "1",
      name: "Ali",
      email: "Ali@example.com",
      password: "1232",
      wallet: {
        balance: 12457,
        currency: "MAD",
        cards: [
          { numcards: "124847", type: "visa",       balance: "14712", expiry: "14-08-27", vcc: "147" },
          { numcards: "124478", type: "mastercard", balance: "1470",  expiry: "14-08-28", vcc: "257" },
        ],
        transactions: [
          { id: "1", type: "credit", amount: 140, date: "14-08-25", from: "Ahmed",  to: "124847" },
          { id: "2", type: "debit",  amount: 200, date: "13-08-25", from: "124847", to: "Amazon"  },
          { id: "3", type: "credit", amount: 250, date: "12-08-25", from: "Ahmed",  to: "124478" },
        ],
      },
    },
  ],
};

const findUserByMail = (mail, password) => {
  return database.users.find(
    (u) => u.email.toLowerCase() === mail.toLowerCase() && u.password === password
  );
};

// Utilitaire : afficher / effacer une erreur (sans dépendance Font Awesome)

function showError(container, msg) {
  if (!container) return;

  if (!msg) {
    container.innerHTML    = "";
    container.style.display = "none";
    return;
  }

  container.style.display = "block";
  container.innerHTML = `
    <div style="
      background: #fff0f0;
      border: 1px solid #fca5a5;
      color: #dc2626;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.88rem;
      margin-bottom: 10px;
    ">
      ⚠️ ${msg}
    </div>`;
}

// DOMContentLoaded

document.addEventListener("DOMContentLoaded", () => {

  const emailInput    = document.getElementById("mail");
  const passwordInput = document.getElementById("password");
  const submitBtn     = document.getElementById("submitbtn");
  const errorDiv      = document.getElementById("error");
  const resultP       = document.getElementById("result");
  const toggleEye     = document.getElementById("display");

  // Cacher le div erreur au départ
  if (errorDiv) errorDiv.style.display = "none";

  // Toggle affichage mot de passe 
  if (toggleEye) {
    toggleEye.addEventListener("click", () => {
      const hidden = passwordInput.type === "password";
      passwordInput.type    = hidden ? "text" : "password";
      toggleEye.textContent = hidden ? "🙈" : "👁";
    });
  }
  // Connexion au click 
  if (submitBtn) {
    submitBtn.addEventListener("click", handleLogin);
  }

  //  Connexion avec la touche Entrée 
  [emailInput, passwordInput].forEach(input => {
    if (!input) return;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleLogin();
    });
  });

  // Fonction principale de connexion

  function handleLogin() {
    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    // 1. Champs vides
    if (!email || !password) {
      showError(errorDiv, "Veuillez remplir tous les champs.");
      return;
    }

    // 2. Format email invalide
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError(errorDiv, "Adresse e-mail invalide.");
      return;
    }

    // 3. Recherche dans la base de données
    const user = findUserByMail(email, password);

    // 4. Identifiants incorrects
    if (!user) {
      showError(errorDiv, "Email ou mot de passe incorrect.");
      passwordInput.value = "";
      passwordInput.focus();
      return;
    }

    // 5. Connexion réussie ✓
    showError(errorDiv, "");

    sessionStorage.setItem("ewallet_user", JSON.stringify(user));

    if (resultP) {
      resultP.style.color    = "#16a34a";
      resultP.style.fontSize = "0.9rem";
      resultP.textContent    = "✓ Connexion réussie ! Redirection…";
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = "Connexion…";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 900);
  }

});