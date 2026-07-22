const today = new Date();
const isoDate = dateToInput(today);
const TRUE_DATA_KEY = "samye-ling-room-data-v2";
const DATA_MODE_KEY = "samye-ling-room-mode-v2";
const AUTH_SESSION_KEY = "samye-ling-neon-auth-session-v1";
const stayStatuses = ["confirmed", "checked-in", "checked-out", "cancelled"];

let dataMode = localStorage.getItem(DATA_MODE_KEY) || "true";
let state = dataMode === "demo" ? createDemoData() : loadTrueData();
let authSession = loadAuthSession();
let sharedDataTimer = null;
const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  hydrateControls();
  bindEvents();
  render();
  if (authSession) {
    loadSharedData();
  }
});

function createDemoData() {
  return normalizeData({
    rooms: [
      room("r1", "Chambre 1", "Simple", "Maison principale", 1, false, true, "Chambre calme pres de la salle de meditation"),
      room("r2", "Chambre 2", "Twin", "Maison principale", 2, false, true, "Pratique pour deux retraitants"),
      room("r3", "Chambre Jardin", "Double", "Aile jardin", 2, true, true, "Salle de bain privee, vue jardin"),
      room("r4", "Dortoir A", "Dortoir", "Maison de retraite", 6, false, true, "Chambre partagee pour retraites de groupe"),
      room("r5", "Chambre Famille", "Famille", "Maison d'accueil", 4, true, true, "Adaptee a une petite famille"),
      room("r6", "Chambre 6", "Simple", "Maison d'accueil", 1, false, false, "Temporairement indisponible")
    ],
    stays: [
      stay("s1", "r1", "Claire Martin", "claire@example.com", isoDate, addDays(isoDate, 3), 1, "checked-in", "Retraite de meditation du week-end"),
      stay("s2", "r3", "Jean Dupont", "+33 6 10 20 30 40", isoDate, addDays(isoDate, 2), 2, "confirmed", "Arrivee apres le souper"),
      stay("s3", "r4", "Groupe retraite lama", "group@example.com", addDays(isoDate, 1), addDays(isoDate, 6), 5, "confirmed", "Garder les lits ensemble"),
      stay("s4", "r2", "Sophie Bernard", "", addDays(isoDate, -2), isoDate, 1, "checked-out", "Don laisse au bureau")
    ]
  });
}

function createEmptyTrueData() {
  return normalizeData({ rooms: [], stays: [] });
}

function room(id, name, type, area, beds, bathroom, active, notes) {
  return { id, name, type, area, beds: Number(beds || 1), bathroom: Boolean(bathroom), active: Boolean(active), notes: notes || "" };
}

function stay(id, roomId, guestName, contact, checkIn, checkOut, guests, status, notes) {
  return { id, roomId, guestName, contact: contact || "", checkIn, checkOut, guests: Number(guests || 1), status, notes: notes || "" };
}

function normalizeData(data) {
  return {
    rooms: Array.isArray(data?.rooms) ? data.rooms.map((item) => room(
      item.id || uniqueId("room"),
      item.name || "Chambre sans nom",
      item.type || "Simple",
      item.area || "",
      item.beds || item.capacity || 1,
      item.bathroom || false,
      item.active !== false,
      item.notes || ""
    )) : [],
    stays: Array.isArray(data?.stays) ? data.stays.map((item) => stay(
      item.id || uniqueId("stay"),
      item.roomId || "",
      item.guestName || item.eventName || "Invite",
      item.contact || item.organizer || "",
      item.checkIn || dateOnly(item.start) || isoDate,
      item.checkOut || dateOnly(item.end) || addDays(isoDate, 1),
      item.guests || item.expected || 1,
      stayStatuses.includes(item.status) ? item.status : "confirmed",
      item.notes || ""
    )) : []
  };
}

function loadTrueData() {
  try {
    const saved = localStorage.getItem(TRUE_DATA_KEY);
    return saved ? normalizeData(JSON.parse(saved)) : createEmptyTrueData();
  } catch {
    return createEmptyTrueData();
  }
}

function persistTrueData() {
  if (dataMode === "true") {
    localStorage.setItem(TRUE_DATA_KEY, JSON.stringify(state));
    scheduleSharedDataSave();
  }
}

function loadAuthSession() {
  try {
    const saved = localStorage.getItem(AUTH_SESSION_KEY);
    if (!saved) return null;
    const session = JSON.parse(saved);
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function cacheElements() {
  [
    "activeDate", "demoMode", "trueDataMode", "dataModeLabel", "accountStatus", "quickAddStay", "quickAddRoom", "stayPanel", "roomPanel", "roomCount", "occupiedCount",
    "availableCount", "arrivalCount", "searchInput", "roomStatusFilter", "roomsList",
    "monthPicker", "prevMonth", "nextMonth", "monthlyOccupancy", "stayStatusFilter", "exportCsv", "printSheet", "staysBody", "stayForm", "stayId",
    "guestName", "stayRoom", "checkIn", "checkOut", "guestCount", "stayStatus", "guestContact",
    "stayNotes", "stayFeedback", "clearStay", "roomForm", "roomId", "roomName", "roomBeds",
    "roomType", "roomArea", "roomBathroom", "roomActive", "roomNotes", "roomFeedback",
    "clearRoom", "exportData", "importData", "resetTrueData", "importDataFile", "dataFeedback",
    "dataSummary", "accountForm", "accountEmail", "accountPassword", "signIn",
    "signUp", "signOut", "accountFeedback"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function hydrateControls() {
  if (!els.activeDate.value) els.activeDate.value = isoDate;
  if (!els.monthPicker.value) els.monthPicker.value = isoDate.slice(0, 7);
  if (!els.checkIn.value) els.checkIn.value = els.activeDate.value;
  if (!els.checkOut.value) els.checkOut.value = addDays(els.activeDate.value, 1);
  fillSelect(els.stayRoom, state.rooms.filter((roomItem) => roomItem.active).map((roomItem) => [roomItem.id, roomLabel(roomItem)]));
  hydrateAccountControls();
  updateModeButtons();
}

function bindEvents() {
  ["activeDate", "searchInput", "roomStatusFilter", "stayStatusFilter", "monthPicker"].forEach((id) => {
    els[id].addEventListener("input", render);
  });
  els.prevMonth.addEventListener("click", () => shiftMonth(-1));
  els.nextMonth.addEventListener("click", () => shiftMonth(1));
  els.demoMode.addEventListener("click", () => switchDataMode("demo"));
  els.trueDataMode.addEventListener("click", () => switchDataMode("true"));
  els.quickAddStay.addEventListener("click", () => openEntryPanel(els.stayPanel, els.guestName));
  els.quickAddRoom.addEventListener("click", () => openEntryPanel(els.roomPanel, els.roomName));
  els.roomForm.addEventListener("submit", saveRoom);
  els.stayForm.addEventListener("submit", saveStay);
  els.clearRoom.addEventListener("click", clearRoomForm);
  els.clearStay.addEventListener("click", clearStayForm);
  els.exportCsv.addEventListener("click", exportStaysCsv);
  els.printSheet.addEventListener("click", () => window.print());
  els.exportData.addEventListener("click", exportTrueData);
  els.importData.addEventListener("click", () => els.importDataFile.click());
  els.importDataFile.addEventListener("change", importTrueData);
  els.resetTrueData.addEventListener("click", resetTrueData);
  els.accountForm.addEventListener("submit", signInWithEmail);
  els.signUp.addEventListener("click", signUpWithEmail);
  els.signOut.addEventListener("click", signOut);
}

function render() {
  document.body.classList.toggle("demo-data", dataMode === "demo");
  updateModeButtons();
  hydrateControls();
  renderSummary();
  renderRooms();
  renderMonthlyOccupancy();
  renderStays();
  renderDataSummary();
}

function openEntryPanel(panel, focusTarget) {
  const details = panel?.querySelector("details");
  if (details) details.open = true;
  panel?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => focusTarget?.focus(), 180);
}

function renderSummary() {
  const rooms = activeRooms();
  const occupied = rooms.filter((roomItem) => stayForRoomOnDate(roomItem.id, els.activeDate.value)).length;
  const arrivals = state.stays.filter((stayItem) => stayItem.checkIn === els.activeDate.value && stayItem.status !== "cancelled").length;
  els.roomCount.textContent = rooms.length;
  els.occupiedCount.textContent = occupied;
  els.availableCount.textContent = Math.max(0, rooms.length - occupied);
  els.arrivalCount.textContent = arrivals;
}

function renderRooms() {
  const query = searchQuery();
  const status = els.roomStatusFilter.value;
  const rooms = state.rooms
    .filter((roomItem) => matchesRoomFilter(roomItem, status))
    .filter((roomItem) => roomMatchesSearch(roomItem, query));

  els.roomsList.innerHTML = "";
  if (!rooms.length) {
    els.roomsList.append(emptyState());
    return;
  }

  rooms.forEach((roomItem) => {
    const stayItem = stayForRoomOnDate(roomItem.id, els.activeDate.value);
    const canEdit = dataMode === "true";
    const card = document.createElement("article");
    card.className = "room-card";
    card.innerHTML = `
      <div class="room-card-head">
        <div>
          <h3>${escapeHtml(roomItem.name)}</h3>
          <p class="muted">${escapeHtml(roomItem.type)} | ${roomItem.beds} lit${roomItem.beds === 1 ? "" : "s"}${roomItem.area ? ` | ${escapeHtml(roomItem.area)}` : ""}</p>
        </div>
        <span class="pill ${stayItem ? "warning" : roomItem.active ? "" : "pending"}">${stayItem ? "Occupee" : roomItem.active ? "Libre" : "Fermee"}</span>
      </div>
      <div class="pill-row">
        ${roomItem.bathroom ? '<span class="pill">Salle de bain privee</span>' : '<span class="pill">Salle de bain partagee</span>'}
        ${stayItem ? `<span class="pill">${escapeHtml(stayItem.guestName)}</span>` : ""}
      </div>
      <p class="muted">${escapeHtml(roomItem.notes || "Aucune note")}</p>
      <div class="button-row" ${canEdit ? "" : "hidden"}>
        <button class="mini-button secondary-action" type="button" data-edit-room="${roomItem.id}">Modifier</button>
        <button class="mini-button secondary-action" type="button" data-toggle-room="${roomItem.id}">${roomItem.active ? "Fermer" : "Rouvrir"}</button>
      </div>
    `;
    els.roomsList.append(card);
  });

  els.roomsList.querySelectorAll("[data-edit-room]").forEach((button) => {
    button.addEventListener("click", () => editRoom(button.dataset.editRoom));
  });
  els.roomsList.querySelectorAll("[data-toggle-room]").forEach((button) => {
    button.addEventListener("click", () => toggleRoom(button.dataset.toggleRoom));
  });
}

function renderStays() {
  const query = searchQuery();
  const status = els.stayStatusFilter.value;
  const rows = state.stays
    .filter((stayItem) => status === "all" || stayItem.status === status)
    .filter((stayItem) => stayMatchesSearch(stayItem, query))
    .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));

  els.staysBody.innerHTML = "";
  if (!rows.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="8">${emptyState().outerHTML}</td>`;
    els.staysBody.append(row);
    return;
  }

  rows.forEach((stayItem) => {
    const roomItem = roomById(stayItem.roomId);
    const canEdit = dataMode === "true";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${escapeHtml(stayItem.guestName)}</strong></td>
      <td>${escapeHtml(roomItem?.name || "Chambre supprimee")}</td>
      <td>${formatDate(stayItem.checkIn)} - ${formatDate(stayItem.checkOut)}</td>
      <td>${stayItem.guests}</td>
      <td><span class="pill ${statusClass(stayItem.status)}">${escapeHtml(statusLabel(stayItem.status))}</span></td>
      <td>${escapeHtml(stayItem.contact || "-")}</td>
      <td>${escapeHtml(stayItem.notes || "-")}</td>
      <td>
        <div class="button-row" ${canEdit ? "" : "hidden"}>
          <button class="mini-button secondary-action" type="button" data-edit-stay="${stayItem.id}">Modifier</button>
          <button class="mini-button secondary-action" type="button" data-cancel-stay="${stayItem.id}">Annuler</button>
        </div>
      </td>
    `;
    els.staysBody.append(row);
  });

  els.staysBody.querySelectorAll("[data-edit-stay]").forEach((button) => {
    button.addEventListener("click", () => editStay(button.dataset.editStay));
  });
  els.staysBody.querySelectorAll("[data-cancel-stay]").forEach((button) => {
    button.addEventListener("click", () => cancelStay(button.dataset.cancelStay));
  });
}

function renderMonthlyOccupancy() {
  const rooms = state.rooms.filter((roomItem) => roomItem.active || monthHasStay(roomItem.id));
  const days = daysInSelectedMonth();
  els.monthlyOccupancy.innerHTML = "";
  if (!rooms.length) {
    els.monthlyOccupancy.append(emptyState());
    return;
  }

  const grid = document.createElement("div");
  grid.className = "month-grid";
  grid.style.setProperty("--days", days.length);
  grid.append(monthCell("Chambre", "month-head sticky-room"));
  days.forEach((day) => {
    grid.append(monthCell(String(new Date(`${day}T00:00`).getDate()), `month-head ${day === isoDate ? "today" : ""}`, shortWeekday(day)));
  });

  rooms.forEach((roomItem) => {
    grid.append(monthCell(roomItem.name, "month-room sticky-room", `${roomItem.type} | ${roomItem.beds} lit${roomItem.beds === 1 ? "" : "s"}`));
    days.forEach((day) => {
      const stayItem = stayForRoomOnDate(roomItem.id, day);
      const classes = ["month-cell"];
      if (stayItem) classes.push("occupied");
      if (day === isoDate) classes.push("today");
      const label = stayItem ? stayItem.guestName : "";
      const meta = stayItem ? `${statusLabel(stayItem.status)} | ${stayItem.guests} pers.` : "";
      grid.append(monthCell(label, classes.join(" "), meta, stayItem?.id));
    });
  });
  els.monthlyOccupancy.append(grid);

  els.monthlyOccupancy.querySelectorAll("[data-stay-id]").forEach((cell) => {
    cell.addEventListener("click", () => editStay(cell.dataset.stayId));
  });
}

function monthCell(label, className, meta = "", stayId = "") {
  const node = document.createElement("div");
  node.className = className;
  if (stayId && dataMode === "true") node.dataset.stayId = stayId;
  node.innerHTML = `<strong>${escapeHtml(label)}</strong>${meta ? `<span>${escapeHtml(meta)}</span>` : ""}`;
  return node;
}

function daysInSelectedMonth() {
  const [year, month] = els.monthPicker.value.split("-").map(Number);
  const total = new Date(year, month, 0).getDate();
  return Array.from({ length: total }, (_, index) => `${els.monthPicker.value}-${String(index + 1).padStart(2, "0")}`);
}

function monthHasStay(roomId) {
  const days = daysInSelectedMonth();
  return days.some((day) => stayForRoomOnDate(roomId, day));
}

function shiftMonth(amount) {
  const [year, month] = els.monthPicker.value.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  els.monthPicker.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  render();
}

function shortWeekday(day) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(`${day}T00:00`));
}

function renderDataSummary() {
  els.dataSummary.innerHTML = "";
  [
    ["Chambres", `${state.rooms.length} au total, ${activeRooms().length} ouvertes`],
    ["Sejours", `${state.stays.length} enregistres`],
    ["Mode", dataMode === "true" ? "Donnees reelles" : "Demo fictive"],
    ["Compte", authSession?.user?.email || "Non connecte"]
  ].forEach(([title, body]) => {
    const card = document.createElement("article");
    card.className = "report-card";
    card.innerHTML = `<strong>${escapeHtml(title)}</strong><p class="muted">${escapeHtml(body)}</p>`;
  els.dataSummary.append(card);
  });
}

function hydrateAccountControls() {
  els.accountEmail.value = authSession?.user?.email || els.accountEmail.value || "";
  els.signOut.disabled = !authSession;
  els.accountStatus.textContent = authSession ? "Connecte" : "Non connecte";
  els.accountFeedback.textContent = authSession?.user?.email ? `Connecte : ${authSession.user.email}.` : "Connexion requise pour retrouver les donnees sur plusieurs appareils.";
}

async function loadSharedData() {
  if (!authSession) {
    els.accountFeedback.textContent = "Connectez-vous pour charger les donnees.";
    return;
  }
  try {
    const response = await fetch("/api/data", {
      headers: authHeaders()
    });
    if (!response.ok) throw new Error(await responseMessage(response, "Chargement impossible."));
    const result = await response.json();
    if (!result.data) {
      els.accountFeedback.textContent = "Aucune donnee en ligne pour ce compte.";
      return;
    }
    state = normalizeData(result.data);
    dataMode = "true";
    localStorage.setItem(DATA_MODE_KEY, "true");
    localStorage.setItem(TRUE_DATA_KEY, JSON.stringify(state));
    render();
    els.accountFeedback.textContent = `Donnees chargees pour ${authSession.user.email}.`;
  } catch (error) {
    els.accountFeedback.textContent = error.message || "Chargement impossible.";
  }
}

async function saveSharedData(showMessage = false) {
  if (dataMode !== "true") {
    if (showMessage) els.accountFeedback.textContent = "Passez en mode Reel avant de sauvegarder.";
    return;
  }
  if (!authSession) {
    if (showMessage) els.accountFeedback.textContent = "Connectez-vous avant de sauvegarder.";
    return;
  }
  try {
    const response = await fetch("/api/data", {
      method: "PUT",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ data: normalizeData(state) })
    });
    if (!response.ok) throw new Error(await responseMessage(response, "Sauvegarde impossible."));
    els.accountFeedback.textContent = `Sauvegarde faite a ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`;
  } catch (error) {
    els.accountFeedback.textContent = error.message || "Sauvegarde impossible.";
  }
}

function scheduleSharedDataSave() {
  if (!authSession) return;
  window.clearTimeout(sharedDataTimer);
  sharedDataTimer = window.setTimeout(() => saveSharedData(false), 900);
}

function authHeaders() {
  return {
    Authorization: `Bearer ${authSession.token}`
  };
}

async function signInWithEmail(event) {
  event.preventDefault();
  const email = els.accountEmail.value.trim();
  const password = els.accountPassword.value;
  if (!email || !password) {
    els.accountFeedback.textContent = "Email et mot de passe requis.";
    return;
  }
  try {
    const session = await authRequest("signin", { email, password });
    setAuthSession(session);
    els.accountPassword.value = "";
    els.accountFeedback.textContent = `Connecte : ${session.user.email}.`;
    await loadSharedData();
    render();
  } catch (error) {
    els.accountFeedback.textContent = error.message || "Connexion impossible.";
  }
}

async function signUpWithEmail() {
  const email = els.accountEmail.value.trim();
  const password = els.accountPassword.value;
  if (!email || !password) {
    els.accountFeedback.textContent = "Email et mot de passe requis.";
    return;
  }
  try {
    const session = await authRequest("signup", { email, password });
    setAuthSession(session);
    els.accountPassword.value = "";
    els.accountFeedback.textContent = `Compte cree : ${session.user.email}.`;
    await saveSharedData(false);
    render();
  } catch (error) {
    els.accountFeedback.textContent = error.message || "Creation impossible.";
  }
}

function signOut() {
  authSession = null;
  localStorage.removeItem(AUTH_SESSION_KEY);
  els.accountPassword.value = "";
  els.accountFeedback.textContent = "Deconnecte.";
  render();
}

function setAuthSession(session) {
  authSession = session;
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

async function authRequest(action, body) {
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action, ...body })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || `Connexion impossible (${response.status})`);
  }
  return result;
}

async function responseMessage(response, fallback) {
  const result = await response.json().catch(() => ({}));
  return result.message || `${fallback} (${response.status})`;
}

function saveRoom(event) {
  event.preventDefault();
  if (!canEditTrueData(els.roomFeedback)) return;
  const current = room(
    els.roomId.value || uniqueId("room"),
    els.roomName.value.trim(),
    els.roomType.value,
    els.roomArea.value.trim(),
    els.roomBeds.value,
    els.roomBathroom.checked,
    els.roomActive.checked,
    els.roomNotes.value.trim()
  );
  if (!current.name) {
    els.roomFeedback.textContent = "Le nom ou numero de chambre est requis.";
    return;
  }
  state.rooms = state.rooms.filter((item) => item.id !== current.id);
  state.rooms.push(current);
  persistTrueData();
  clearRoomForm();
  render();
  els.roomFeedback.textContent = "Chambre enregistree.";
}

function saveStay(event) {
  event.preventDefault();
  if (!canEditTrueData(els.stayFeedback)) return;
  if (!activeRooms().length) {
    els.stayFeedback.textContent = "Ajoutez d'abord une chambre disponible.";
    return;
  }
  const current = stay(
    els.stayId.value || uniqueId("stay"),
    els.stayRoom.value,
    els.guestName.value.trim(),
    els.guestContact.value.trim(),
    els.checkIn.value,
    els.checkOut.value,
    els.guestCount.value,
    els.stayStatus.value,
    els.stayNotes.value.trim()
  );
  if (!current.guestName) {
    els.stayFeedback.textContent = "Le nom est requis.";
    return;
  }
  if (new Date(current.checkOut) <= new Date(current.checkIn)) {
    els.stayFeedback.textContent = "Le depart doit etre apres l'arrivee.";
    return;
  }
  if (hasRoomConflict(current, state.stays.filter((item) => item.id !== current.id))) {
    els.stayFeedback.textContent = "Cette chambre est deja reservee sur ces dates.";
    return;
  }
  state.stays = state.stays.filter((item) => item.id !== current.id);
  state.stays.push(current);
  persistTrueData();
  clearStayForm();
  render();
  els.stayFeedback.textContent = "Sejour enregistre.";
}

function editRoom(id) {
  if (!canEditTrueData(els.roomFeedback)) return;
  const roomItem = roomById(id);
  if (!roomItem) return;
  els.roomId.value = roomItem.id;
  els.roomName.value = roomItem.name;
  els.roomBeds.value = roomItem.beds;
  els.roomType.value = roomItem.type;
  els.roomArea.value = roomItem.area;
  els.roomBathroom.checked = roomItem.bathroom;
  els.roomActive.checked = roomItem.active;
  els.roomNotes.value = roomItem.notes;
  openEntryPanel(els.roomPanel, els.roomName);
  els.roomName.focus();
}

function editStay(id) {
  if (!canEditTrueData(els.stayFeedback)) return;
  const stayItem = stayById(id);
  if (!stayItem) return;
  els.stayId.value = stayItem.id;
  els.guestName.value = stayItem.guestName;
  els.stayRoom.value = stayItem.roomId;
  els.checkIn.value = stayItem.checkIn;
  els.checkOut.value = stayItem.checkOut;
  els.guestCount.value = stayItem.guests;
  els.stayStatus.value = stayItem.status;
  els.guestContact.value = stayItem.contact;
  els.stayNotes.value = stayItem.notes;
  openEntryPanel(els.stayPanel, els.guestName);
  els.guestName.focus();
}

function toggleRoom(id) {
  if (!canEditTrueData(els.roomFeedback)) return;
  const roomItem = roomById(id);
  if (!roomItem) return;
  roomItem.active = !roomItem.active;
  persistTrueData();
  render();
}

function cancelStay(id) {
  if (!canEditTrueData(els.stayFeedback)) return;
  const stayItem = stayById(id);
  if (!stayItem) return;
  stayItem.status = "cancelled";
  persistTrueData();
  render();
}

function clearRoomForm() {
  els.roomForm.reset();
  els.roomId.value = "";
  els.roomBeds.value = "1";
  els.roomActive.checked = true;
  els.roomFeedback.textContent = "";
}

function clearStayForm() {
  els.stayForm.reset();
  els.stayId.value = "";
  els.checkIn.value = els.activeDate.value;
  els.checkOut.value = addDays(els.activeDate.value, 1);
  els.guestCount.value = "1";
  els.stayStatus.value = "confirmed";
  els.stayFeedback.textContent = "";
}

function switchDataMode(mode) {
  dataMode = mode;
  localStorage.setItem(DATA_MODE_KEY, mode);
  state = mode === "demo" ? createDemoData() : loadTrueData();
  clearRoomForm();
  clearStayForm();
  render();
  els.dataFeedback.textContent = mode === "demo" ? "Mode demo : donnees fictives." : "Mode reel : les changements sont sauvegardes.";
}

function updateModeButtons() {
  const isDemo = dataMode === "demo";
  els.demoMode.classList.toggle("active", isDemo);
  els.trueDataMode.classList.toggle("active", !isDemo);
  els.demoMode.classList.toggle("secondary-action", !isDemo);
  els.trueDataMode.classList.toggle("secondary-action", isDemo);
  els.dataModeLabel.textContent = isDemo ? "Demo" : "Reel";
}

function exportTrueData() {
  const data = dataMode === "true" ? state : loadTrueData();
  download("kagyu-samye-ling-room-data.json", JSON.stringify(normalizeData(data), null, 2), "application/json");
  els.dataFeedback.textContent = "Export termine.";
}

function importTrueData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = normalizeData(JSON.parse(String(reader.result)));
      localStorage.setItem(TRUE_DATA_KEY, JSON.stringify(imported));
      dataMode = "true";
      localStorage.setItem(DATA_MODE_KEY, "true");
      state = imported;
      render();
      els.dataFeedback.textContent = "Import termine.";
    } catch {
      els.dataFeedback.textContent = "Import impossible. Utilisez un export JSON de cette app.";
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function resetTrueData() {
  const emptyData = createEmptyTrueData();
  localStorage.setItem(TRUE_DATA_KEY, JSON.stringify(emptyData));
  if (dataMode === "true") {
    state = emptyData;
    clearRoomForm();
    clearStayForm();
    render();
  }
  els.dataFeedback.textContent = "Donnees reinitialisees.";
}

function exportStaysCsv() {
  const rows = state.stays.map((stayItem) => {
    const roomItem = roomById(stayItem.roomId);
    return {
      Nom: stayItem.guestName,
      Chambre: roomItem?.name || "Chambre supprimee",
      Arrivee: stayItem.checkIn,
      Depart: stayItem.checkOut,
      Personnes: stayItem.guests,
      Statut: statusLabel(stayItem.status),
      Contact: stayItem.contact,
      Notes: stayItem.notes
    };
  });
  download(`sejours-${els.activeDate.value}.csv`, toCsv(rows), "text/csv");
}

function canEditTrueData(feedbackEl) {
  if (dataMode === "true") return true;
  feedbackEl.textContent = "Passez en mode Reel pour modifier.";
  return false;
}

function activeRooms() {
  return state.rooms.filter((roomItem) => roomItem.active);
}

function matchesRoomFilter(roomItem, filter) {
  const occupied = Boolean(stayForRoomOnDate(roomItem.id, els.activeDate.value));
  if (filter === "available") return roomItem.active && !occupied;
  if (filter === "occupied") return occupied;
  return true;
}

function stayForRoomOnDate(roomId, date) {
  return state.stays.find((stayItem) => stayItem.roomId === roomId && stayItem.status !== "cancelled" && date >= stayItem.checkIn && date < stayItem.checkOut);
}

function hasRoomConflict(candidate, stays) {
  if (candidate.status === "cancelled") return false;
  return stays.some((stayItem) => stayItem.status !== "cancelled" && stayItem.roomId === candidate.roomId && candidate.checkIn < stayItem.checkOut && candidate.checkOut > stayItem.checkIn);
}

function roomMatchesSearch(roomItem, query) {
  if (!query) return true;
  const stayItem = stayForRoomOnDate(roomItem.id, els.activeDate.value);
  return [roomItem.name, roomItem.type, roomItem.area, roomItem.notes, stayItem?.guestName].join(" ").toLowerCase().includes(query);
}

function stayMatchesSearch(stayItem, query) {
  if (!query) return true;
  const roomItem = roomById(stayItem.roomId);
  return [stayItem.guestName, stayItem.contact, stayItem.notes, stayItem.status, roomItem?.name].join(" ").toLowerCase().includes(query);
}

function searchQuery() {
  return els.searchInput.value.trim().toLowerCase();
}

function roomById(id) {
  return state.rooms.find((roomItem) => roomItem.id === id);
}

function stayById(id) {
  return state.stays.find((stayItem) => stayItem.id === id);
}

function fillSelect(select, options) {
  const previous = select.value;
  select.innerHTML = "";
  options.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  });
  if (options.some(([value]) => value === previous)) select.value = previous;
}

function roomLabel(roomItem) {
  return `${roomItem.name} (${roomItem.type}, ${roomItem.beds} bed${roomItem.beds === 1 ? "" : "s"})`;
}

function statusLabel(status) {
  return {
    "confirmed": "Confirme",
    "checked-in": "Arrive",
    "checked-out": "Parti",
    "cancelled": "Annule"
  }[status] || titleCase(status);
}

function statusClass(status) {
  if (status === "checked-in") return "ok";
  if (status === "cancelled") return "danger";
  if (status === "checked-out") return "pending";
  return "";
}

function dateToInput(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function dateOnly(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function addDays(dateString, amount) {
  const date = new Date(`${dateString}T00:00`);
  date.setDate(date.getDate() + amount);
  return dateToInput(date);
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${value}T00:00`));
}

function titleCase(value) {
  return String(value).replace(/\b\w/g, (char) => char.toUpperCase());
}

function uniqueId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n");
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function emptyState() {
  return document.getElementById("emptyStateTemplate").content.firstElementChild.cloneNode(true);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}
