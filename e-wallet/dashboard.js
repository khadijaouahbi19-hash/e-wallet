
document.addEventListener("DOMContentLoaded", () => {

  // 0. RÉCUPÉRER L'UTILISATEUR CONNECTÉ

  const raw = sessionStorage.getItem("ewallet_user");
  if (!raw) {
    window.location.href = "login.html";
    return;
  }
  const user = JSON.parse(raw);
  const wallet = user.wallet;

  // 1. NAVIGATION SIDEBAR
 
  const allSections   = document.querySelectorAll(".dashboard-section");
  const transferSection = document.getElementById("transfer-section");

  // 2. VUE D'ENSEMBLE

  // Nom d'accueil
  const greetEl = document.getElementById("greetingName");
  if (greetEl) greetEl.textContent = user.name;

  // Date du jour
  const dateEl = document.getElementById("currentDate");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }

  // Solde + calculs revenus/dépenses depuis les transactions
  const credits = wallet.transactions
    .filter(t => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const debits = wallet.transactions
    .filter(t => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  animateCount(document.getElementById("availableBalance"), wallet.balance, true);
  animateCount(document.getElementById("monthlyIncome"),    credits,         true);
  animateCount(document.getElementById("monthlyExpenses"),  debits,          true);

  const cardsEl = document.getElementById("activeCards");
  if (cardsEl) cardsEl.textContent = wallet.cards.length;

  // Transactions récentes
  renderRecentTransactions();

  // 4. ACTIONS RAPIDES
  document.getElementById("quickTransfer")?.addEventListener("click", openTransfer);
  document.getElementById("quickTopup")?.addEventListener("click",    () => alert("Recharge à venir !"));
  document.getElementById("quickRequest")?.addEventListener("click",  () => alert("Demande à venir !"));

  // 5. SECTION TRANSFERT
  
  populateTransferForm();

  document.getElementById("closeTransferBtn")?.addEventListener("click",  closeTransfer);
  document.getElementById("cancelTransferBtn")?.addEventListener("click", closeTransfer);
  document.getElementById("transferForm")?.addEventListener("submit",      handleTransfer);

  // FONCTIONS

  //  Rendu des transactions récentes (5 dernières) 
  function renderRecentTransactions() {
    const list = document.getElementById("recentTransactionsList");
    if (!list) return;
    // Trier par date décroissante et prendre les 5 premières
    const sorted = [...wallet.transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
    //si aucune transaction, afficher message sinon afficher les transactions
    list.innerHTML = sorted.length === 0
      ? `<p style="text-align:center;color:#8a8a9a;padding:20px;">Aucune transaction.</p>`
      : sorted.map(tx => transactionHTML(tx)).join("");
    // Recalculer revenus et dépenses
      const newCredits = wallet.transactions
        .filter(t => t.type === "credit")
        .reduce((sum, t) => sum + t.amount, 0);

      const newDebits = wallet.transactions
        .filter(t => t.type === "debit")
        .reduce((sum, t) => sum + t.amount, 0);

      animateCount(document.getElementById("monthlyIncome"),   newCredits, true);
      animateCount(document.getElementById("monthlyExpenses"), newDebits,  true);
      // Mettre à jour le solde disponible
      animateCount(document.getElementById("availableBalance"), wallet.balance, true);
  }

  // Rendu de toutes les transactions (section Transactions)
  function renderAllTransactions() {
    const section = document.getElementById("transactions");
    if (!section) return;

    section.classList.add("active");
    // Vérifier si le conteneur existe déjà, sinon le créer
    let container = section.querySelector(".transactions-list");
    if (!container) {
      container = document.createElement("div");
      container.className = "transactions-list";
      section.appendChild(container);
    }

    const sorted = [...wallet.transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = `
      <div class="section-header" style="margin-bottom:16px;">
        <h2>Toutes les transactions</h2>
      </div>
      ${sorted.length === 0
        ? `<p style="text-align:center;color:#8a8a9a;padding:20px;">Aucune transaction.</p>`
        : sorted.map(tx => transactionHTML(tx)).join("")}
    `;
  }

  // ── HTML d'un élément transaction ──
  function transactionHTML(tx) {
    const isCredit = tx.type === "credit";
    const icon     = isCredit ? "fas fa-arrow-down" : "fas fa-arrow-up";
    const color    = isCredit ? "#16a34a" : "#dc2626";
    const bgColor  = isCredit ? "#ecfdf5"  : "#fff5f5";
    const sign     = isCredit ? "+" : "-";
    const label    = isCredit
      ? `De : <strong>${tx.from}</strong> → carte ${tx.to}`
      : `Carte ${tx.from} → <strong>${tx.to}</strong>`;

    return `
      <div class="transaction-item" style="
        display:flex; align-items:center; gap:14px;
        padding:14px 0; border-bottom:1px solid rgba(10,10,15,0.07);
      ">
        <div style="
          width:44px; height:44px; border-radius:12px; flex-shrink:0;
          background:${bgColor}; display:flex; align-items:center;
          justify-content:center; color:${color}; font-size:1rem;
        ">
          <i class="${icon}"></i>
        </div>
        <div style="flex:1; min-width:0;">
          <div style="font-weight:600; font-size:0.92rem; color:#0a0a0f;">${label}</div>
          <div style="font-size:0.8rem; color:#8a8a9a; margin-top:2px;">${formatDate(tx.date)}</div>
        </div>
        <div style="font-weight:700; font-size:1rem; color:${color}; white-space:nowrap;">
          ${sign}${tx.amount} ${wallet.currency}
        </div>
      </div>`;
  }

  // ── Ouvrir le formulaire de transfert ──
  function openTransfer() {
    if (!transferSection) return;
    transferSection.classList.remove("hidden");
    // Désactiver toutes les autres sections visuellement
    allSections.forEach(s => s.classList.remove("active"));
  }

  // ── Fermer le formulaire de transfert ──
  function closeTransfer() {
    if (!transferSection) return;
    transferSection.classList.add("hidden");
    // Remettre vue d'ensemble
    document.getElementById("overview")?.classList.add("active");
    document.querySelector('.sidebar-nav li')?.classList.add("active");
    document.getElementById("transferForm")?.reset();
    clearTransferMsg();
  }

  //  Remplir le formulaire de transfert 
  function populateTransferForm() {
    // Bénéficiaires simulés
    const beneficiarySelect = document.getElementById("beneficiary");
    if (beneficiarySelect) {
      beneficiarySelect.innerHTML = `<option value="" disabled selected>Choisir un bénéficiaire</option>`;
      const contacts = ["Khadija", "Sara", "Mohamed", "Ahmed"];
      contacts.forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        beneficiarySelect.appendChild(opt);
      });
    }

    // Cartes source depuis le wallet
    const cardSelect = document.getElementById("sourceCard");
    if (cardSelect) {
      cardSelect.innerHTML = `<option value="" disabled selected>Sélectionner une carte</option>`;
      wallet.cards.forEach(card => {
        const opt = document.createElement("option");
        opt.value = card.numcards;
        opt.textContent = ` ${card.numcards}`;
        cardSelect.appendChild(opt);
      });
    }
  }

  //  Traitement du transfert
  function handleTransfer(e) {
    e.preventDefault();
    clearTransferMsg();
    // Récupérer les valeurs du formulaire
    const beneficiary = document.getElementById("beneficiary").value;
    const sourceCard  = document.getElementById("sourceCard").value;
    const amount      = parseFloat(document.getElementById("amount").value);
    const instant     = document.getElementById("instantTransfer")?.checked;

    // Validations
    if (!beneficiary) { showTransferMsg("Choisissez un bénéficiaire.", "error"); return; }
    if (!sourceCard)  { showTransferMsg("Sélectionnez une carte source.", "error"); return; }
    if (!amount || amount <= 0) { showTransferMsg("Entrez un montant valide.", "error"); return; }
  
    // Vérifier le solde de la carte sélectionnée
    const card = wallet.cards.find(c => c.numcards === sourceCard);
    const totalAmount = instant ? amount + 13.4 : amount;//frais de 13.4 MAD pour transfert instantané
    // Si transfert instantané, vérifier que le montant + frais ne dépasse pas le solde
    if (card && Number(card.balance) < totalAmount) {
      showTransferMsg(`Solde insuffisant sur cette carte (${Number(card.balance).toLocaleString("fr-MA")} MAD).`, "error");
      return;
    }
 
    // Simuler le transfert
    const submitBtn = document.getElementById("submitTransferBtn");
    submitBtn.disabled    = true;
    submitBtn.textContent = "Traitement…";

    setTimeout(() => {
      // Déduire du solde (simulation en mémoire)
      if (card) card.balance = String(Number(card.balance) - totalAmount);
      wallet.balance -= totalAmount;

      // Ajouter la transaction
      const newTx = {
        id:     String(wallet.transactions.length + 1),
        type:   "debit",
        amount: totalAmount,
        date:   new Date().toLocaleDateString("fr-FR"),
        from:   sourceCard,
        to:     beneficiary,
      };
      wallet.transactions.unshift(newTx);

      // Mettre à jour la session
      sessionStorage.setItem("ewallet_user", JSON.stringify(user));

      showTransferMsg(
        `✓ Transfert de ${totalAmount.toLocaleString("fr-MA")} MAD vers ${beneficiary} effectué !`,
        "success"
      );
     renderRecentTransactions();
      submitBtn.disabled    = false;
      submitBtn.innerHTML   = '<i class="fas fa-paper-plane"></i> Transférer';

      document.getElementById("transferForm").reset();

      // Fermer après 2 secondes
      setTimeout(closeTransfer, 2000);
    }, 1200);
  }

  // ── Messages transfert ──
  function showTransferMsg(msg, type) {
    let el = document.getElementById("transferMsg");
    if (!el) {
      el = document.createElement("div");
      el.id = "transferMsg";
      document.getElementById("transferForm")?.prepend(el);
    }
    const isSuccess = type === "success";
    el.style.cssText = `
      padding:10px 14px; border-radius:8px; font-size:0.88rem;
      margin-bottom:14px; display:flex; align-items:center; gap:8px;
      background:${isSuccess ? "#ecfdf5" : "#fff0f0"};
      border:1px solid ${isSuccess ? "#86efac" : "#fca5a5"};
      color:${isSuccess ? "#16a34a" : "#dc2626"};
    `;
    el.innerHTML = `<i class="fas fa-${isSuccess ? "check-circle" : "exclamation-circle"}"></i> ${msg}`;
  }

  function clearTransferMsg() {
    document.getElementById("transferMsg")?.remove();
  }
  // UTILITAIRES

  //  Compteur animé 
  function animateCount(el, target, isMoney = false) {
    if (!el) return;
    const duration = 900;
    const start    = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const value    = eased * target;
      el.textContent = isMoney
        ? value.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " MAD"
        : Math.round(value);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ── Format date ──
  function formatDate(dateStr) {
    if (!dateStr) return "";
    // Gère "14-08-25" ou "2025-08-14"
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const full = `20${y}-${m}-${d}`;
      const date = new Date(full);
      if (!isNaN(date)) {
        return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
      }
    }
    return dateStr;
  }

});
