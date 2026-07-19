const today = new Date();
const isoDate = dateToInput(today);
const TRUE_DATA_KEY = "samye-ling-room-data-v2";
const DATA_MODE_KEY = "samye-ling-room-mode-v2";
const SYNC_CONFIG_KEY = "samye-ling-room-sync-config-v1";
const AUTH_SESSION_KEY = "samye-ling-auth-session-v1";
const stayStatuses = ["confirmed", "checked-in", "checked-out", "cancelled"];

let dataMode = localStorage.getItem(DATA_MODE_KEY) || "true";
let state = dataMode === "demo" ? createDemoData() : loadTrueData();
let syncConfig = loadSyncConfig();
let authSession = loadAuthSession();
let syncTimer = null;
const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  hydrateControls();
  bindEvents();
  render();
  if (syncConfig.enabled && syncReady()) {
    loadCloudData();
  }
});

function createDemoData() {
  return normalizeData({
    rooms: [
      room("r1", "Room 1", "Single", "Main house", 1, false, true, "Quiet room near the meditation hall"),
      room("r2", "Room 2", "Twin", "Main house", 2, false, true, "Good for two retreatants"),
      room("r3", "Garden Room", "Double", "Garden wing", 2, true, true, "Private bathroom, garden view"),
      room("r4", "Dorm A", "Dormitory", "Retreat house", 6, false, true, "Shared room for group retreats"),
      room("r5", "Family Room", "Family", "Guest house", 4, true, true, "Best for a small family"),
      room("r6", "Room 6", "Single", "Guest house", 1, false, false, "Temporarily unavailable")
    ],
    stays: [
      stay("s1", "r1", "Claire Martin", "claire@example.com", isoDate, addDays(isoDate, 3), 1, "checked-in", "Weekend meditation retreat"),
      stay("s2", "r3", "Jean Dupont", "+33 6 10 20 30 40", isoDate, addDays(isoDate, 2), 2, "confirmed", "Arriving after supper"),
      stay("s3", "r4", "Lama retreat group", "group@example.com", addDays(isoDate, 1), addDays(isoDate, 6), 5, "confirmed", "Keep beds together"),
      stay("s4", "r2", "Sophie Bernard", "", addDays(isoDate, -2), isoDate, 1, "checked-out", "Left donation at office")
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
      item.name || "Unnamed room",
      item.type || "Single",
      item.area || "",
      item.beds || item.capacity || 1,
      item.bathroom || false,
      item.active !== false,
      item.notes || ""
    )) : [],
    stays: Array.isArray(data?.stays) ? data.stays.map((item) => stay(
      item.id || uniqueId("stay"),
      item.roomId || "",
      item.guestName || item.eventName || "Guest",
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
    scheduleCloudSave();
  }
}

function loadSyncConfig() {
  try {
    const saved = localStorage.getItem(SYNC_CONFIG_KEY);
    return saved ? JSON.parse(saved) : { url: "", key: "", record: "main", enabled: false };
  } catch {
    return { url: "", key: "", record: "main", enabled: false };
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
    "activeDate", "demoMode", "trueDataMode", "dataModeLabel", "roomCount", "occupiedCount",
    "availableCount", "arrivalCount", "searchInput", "roomStatusFilter", "roomsList",
    "stayStatusFilter", "exportCsv", "printSheet", "staysBody", "stayForm", "stayId",
    "guestName", "stayRoom", "checkIn", "checkOut", "guestCount", "stayStatus", "guestContact",
    "stayNotes", "stayFeedback", "clearStay", "roomForm", "roomId", "roomName", "roomBeds",
    "roomType", "roomArea", "roomBathroom", "roomActive", "roomNotes", "roomFeedback",
    "clearRoom", "exportData", "importData", "resetTrueData", "importDataFile", "dataFeedback",
    "dataSummary", "syncForm", "syncUrl", "syncKey", "syncRecord", "syncEnabled", "loadCloud",
    "saveCloud", "syncFeedback", "accountForm", "accountEmail", "accountPassword", "signIn",
    "signUp", "signOut", "accountFeedback"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function hydrateControls() {
  if (!els.activeDate.value) els.activeDate.value = isoDate;
  if (!els.checkIn.value) els.checkIn.value = els.activeDate.value;
  if (!els.checkOut.value) els.checkOut.value = addDays(els.activeDate.value, 1);
  fillSelect(els.stayRoom, state.rooms.filter((roomItem) => roomItem.active).map((roomItem) => [roomItem.id, roomLabel(roomItem)]));
  hydrateSyncControls();
  hydrateAccountControls();
  updateModeButtons();
}

function bindEvents() {
  ["activeDate", "searchInput", "roomStatusFilter", "stayStatusFilter"].forEach((id) => {
    els[id].addEventListener("input", render);
  });
  els.demoMode.addEventListener("click", () => switchDataMode("demo"));
  els.trueDataMode.addEventListener("click", () => switchDataMode("true"));
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
  els.syncForm.addEventListener("submit", saveSyncSettings);
  els.loadCloud.addEventListener("click", loadCloudData);
  els.saveCloud.addEventListener("click", () => saveCloudData(true));
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
  renderStays();
  renderDataSummary();
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
          <p class="muted">${escapeHtml(roomItem.type)} | ${roomItem.beds} bed${roomItem.beds === 1 ? "" : "s"}${roomItem.area ? ` | ${escapeHtml(roomItem.area)}` : ""}</p>
        </div>
        <span class="pill ${stayItem ? "warning" : roomItem.active ? "" : "pending"}">${stayItem ? "Occupied" : roomItem.active ? "Available" : "Inactive"}</span>
      </div>
      <div class="pill-row">
        ${roomItem.bathroom ? '<span class="pill">Private bathroom</span>' : '<span class="pill">Shared bathroom</span>'}
        ${stayItem ? `<span class="pill">${escapeHtml(stayItem.guestName)}</span>` : ""}
      </div>
      <p class="muted">${escapeHtml(roomItem.notes || "No room notes")}</p>
      <div class="button-row" ${canEdit ? "" : "hidden"}>
        <button class="mini-button secondary-action" type="button" data-edit-room="${roomItem.id}">Edit</button>
        <button class="mini-button secondary-action" type="button" data-toggle-room="${roomItem.id}">${roomItem.active ? "Set inactive" : "Set active"}</button>
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
      <td>${escapeHtml(roomItem?.name || "Room removed")}</td>
      <td>${formatDate(stayItem.checkIn)} - ${formatDate(stayItem.checkOut)}</td>
      <td>${stayItem.guests}</td>
      <td><span class="pill ${statusClass(stayItem.status)}">${escapeHtml(statusLabel(stayItem.status))}</span></td>
      <td>${escapeHtml(stayItem.contact || "-")}</td>
      <td>${escapeHtml(stayItem.notes || "-")}</td>
      <td>
        <div class="button-row" ${canEdit ? "" : "hidden"}>
          <button class="mini-button secondary-action" type="button" data-edit-stay="${stayItem.id}">Edit</button>
          <button class="mini-button secondary-action" type="button" data-cancel-stay="${stayItem.id}">Cancel</button>
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

function renderDataSummary() {
  els.dataSummary.innerHTML = "";
  [
    ["Rooms", `${state.rooms.length} total, ${activeRooms().length} bookable`],
    ["Stays", `${state.stays.length} saved stays`],
    ["Storage", dataMode === "true" ? "True data changes are saved in this browser" : "Demo data is fictive and view-only"],
    ["Cloud sync", syncReady() && syncConfig.enabled ? `On (${cloudRecordId()})` : "Off"],
    ["Account", authSession?.user?.email || "Not signed in"]
  ].forEach(([title, body]) => {
    const card = document.createElement("article");
    card.className = "report-card";
    card.innerHTML = `<strong>${escapeHtml(title)}</strong><p class="muted">${escapeHtml(body)}</p>`;
  els.dataSummary.append(card);
  });
}

function hydrateSyncControls() {
  els.syncUrl.value = syncConfig.url || "";
  els.syncKey.value = syncConfig.key || "";
  els.syncRecord.value = syncConfig.record || "main";
  els.syncEnabled.checked = Boolean(syncConfig.enabled);
}

function hydrateAccountControls() {
  els.accountEmail.value = authSession?.user?.email || els.accountEmail.value || "";
  els.signOut.disabled = !authSession;
  els.accountFeedback.textContent = authSession?.user?.email ? `Signed in as ${authSession.user.email}.` : "Sign in to sync private room data across devices.";
}

function saveSyncSettings(event) {
  event.preventDefault();
  syncConfig = {
    url: els.syncUrl.value.trim().replace(/\/$/, ""),
    key: els.syncKey.value.trim(),
    record: els.syncRecord.value.trim() || "main",
    enabled: els.syncEnabled.checked
  };
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(syncConfig));
  els.syncFeedback.textContent = syncReady() ? "Sync settings saved. Sign in, then use Load cloud or Save cloud." : "Add a Supabase URL and anon key to enable cloud sync.";
  renderDataSummary();
}

async function loadCloudData() {
  if (!syncReady()) {
    els.syncFeedback.textContent = "Add Supabase URL and anon key first.";
    return;
  }
  if (!authSession) {
    els.syncFeedback.textContent = "Sign in before loading cloud data.";
    return;
  }
  try {
    const response = await fetch(syncEndpoint(), {
      headers: syncHeaders()
    });
    if (!response.ok) throw new Error(`Load failed (${response.status})`);
    const rows = await response.json();
    if (!rows.length) {
      els.syncFeedback.textContent = "No cloud record yet. Save cloud once from this device to create it.";
      return;
    }
    state = normalizeData(rows[0].data);
    dataMode = "true";
    localStorage.setItem(DATA_MODE_KEY, "true");
    localStorage.setItem(TRUE_DATA_KEY, JSON.stringify(state));
    render();
    els.syncFeedback.textContent = `Loaded cloud data for ${authSession.user.email}.`;
  } catch (error) {
    els.syncFeedback.textContent = error.message || "Cloud load failed.";
  }
}

async function saveCloudData(showMessage = false) {
  if (dataMode !== "true" || !syncReady()) {
    if (showMessage) els.syncFeedback.textContent = "Switch to True data and save sync settings first.";
    return;
  }
  if (!authSession) {
    if (showMessage) els.syncFeedback.textContent = "Sign in before saving cloud data.";
    return;
  }
  try {
    const payload = {
      id: cloudRecordId(),
      data: normalizeData(state),
      user_id: authSession?.user?.id || null,
      updated_at: new Date().toISOString()
    };
    const response = await fetch(`${syncBaseUrl()}?on_conflict=id`, {
      method: "POST",
      headers: {
        ...syncHeaders(),
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Save failed (${response.status})`);
    els.syncFeedback.textContent = `Cloud saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`;
  } catch (error) {
    els.syncFeedback.textContent = error.message || "Cloud save failed.";
  }
}

function scheduleCloudSave() {
  if (!syncConfig.enabled || !syncReady()) return;
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => saveCloudData(false), 900);
}

function syncReady() {
  return Boolean(syncConfig.url && syncConfig.key && syncConfig.record);
}

function cloudRecordId() {
  const record = syncConfig.record || "main";
  return authSession?.user?.id ? `${authSession.user.id}:${record}` : record;
}

function syncBaseUrl() {
  return `${syncConfig.url}/rest/v1/room_data`;
}

function syncEndpoint() {
  return `${syncBaseUrl()}?id=eq.${encodeURIComponent(cloudRecordId())}&select=data,updated_at`;
}

function syncHeaders() {
  const token = authSession?.access_token || syncConfig.key;
  return {
    apikey: syncConfig.key,
    Authorization: `Bearer ${token}`
  };
}

async function signInWithEmail(event) {
  event.preventDefault();
  if (!syncReady()) {
    els.accountFeedback.textContent = "Add Supabase URL and anon key in Cloud Sync first.";
    return;
  }
  const email = els.accountEmail.value.trim();
  const password = els.accountPassword.value;
  if (!email || !password) {
    els.accountFeedback.textContent = "Email and password are required.";
    return;
  }
  try {
    const session = await authRequest("token?grant_type=password", { email, password });
    setAuthSession(session);
    els.accountPassword.value = "";
    els.accountFeedback.textContent = `Signed in as ${session.user.email}.`;
    if (syncConfig.enabled) await loadCloudData();
    render();
  } catch (error) {
    els.accountFeedback.textContent = error.message || "Sign in failed.";
  }
}

async function signUpWithEmail() {
  if (!syncReady()) {
    els.accountFeedback.textContent = "Add Supabase URL and anon key in Cloud Sync first.";
    return;
  }
  const email = els.accountEmail.value.trim();
  const password = els.accountPassword.value;
  if (!email || !password) {
    els.accountFeedback.textContent = "Email and password are required.";
    return;
  }
  try {
    const session = await authRequest("signup", { email, password });
    if (session.access_token) {
      setAuthSession(session);
      els.accountPassword.value = "";
      els.accountFeedback.textContent = `Account created for ${session.user.email}.`;
      if (syncConfig.enabled) await saveCloudData(false);
    } else {
      els.accountFeedback.textContent = "Account created. Check email if confirmation is required, then sign in.";
    }
    render();
  } catch (error) {
    els.accountFeedback.textContent = error.message || "Create account failed.";
  }
}

function signOut() {
  authSession = null;
  localStorage.removeItem(AUTH_SESSION_KEY);
  els.accountPassword.value = "";
  els.accountFeedback.textContent = "Signed out.";
  render();
}

function setAuthSession(session) {
  authSession = session;
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

async function authRequest(path, body) {
  const response = await fetch(`${syncConfig.url}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: syncConfig.key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error_description || result.msg || result.message || `Auth failed (${response.status})`);
  }
  return result;
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
    els.roomFeedback.textContent = "Room name is required.";
    return;
  }
  state.rooms = state.rooms.filter((item) => item.id !== current.id);
  state.rooms.push(current);
  persistTrueData();
  clearRoomForm();
  render();
}

function saveStay(event) {
  event.preventDefault();
  if (!canEditTrueData(els.stayFeedback)) return;
  if (!activeRooms().length) {
    els.stayFeedback.textContent = "Add at least one active room first.";
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
    els.stayFeedback.textContent = "Guest name is required.";
    return;
  }
  if (new Date(current.checkOut) <= new Date(current.checkIn)) {
    els.stayFeedback.textContent = "Check-out must be after check-in.";
    return;
  }
  if (hasRoomConflict(current, state.stays.filter((item) => item.id !== current.id))) {
    els.stayFeedback.textContent = "That room is already booked for these dates.";
    return;
  }
  state.stays = state.stays.filter((item) => item.id !== current.id);
  state.stays.push(current);
  persistTrueData();
  clearStayForm();
  render();
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
  els.dataFeedback.textContent = mode === "demo" ? "Demo mode shows fictive sample rooms and stays." : "True data mode is active. Add rooms and stays here.";
}

function updateModeButtons() {
  const isDemo = dataMode === "demo";
  els.demoMode.classList.toggle("active", isDemo);
  els.trueDataMode.classList.toggle("active", !isDemo);
  els.demoMode.classList.toggle("secondary-action", !isDemo);
  els.trueDataMode.classList.toggle("secondary-action", isDemo);
  els.dataModeLabel.textContent = isDemo ? "Demo data" : "True data";
}

function exportTrueData() {
  const data = dataMode === "true" ? state : loadTrueData();
  download("kagyu-samye-ling-room-data.json", JSON.stringify(normalizeData(data), null, 2), "application/json");
  els.dataFeedback.textContent = "True data exported.";
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
      els.dataFeedback.textContent = "True data imported.";
    } catch {
      els.dataFeedback.textContent = "Import failed. Please use a JSON export from this app.";
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
  els.dataFeedback.textContent = "True data reset. Demo data is unchanged.";
}

function exportStaysCsv() {
  const rows = state.stays.map((stayItem) => {
    const roomItem = roomById(stayItem.roomId);
    return {
      Guest: stayItem.guestName,
      Room: roomItem?.name || "Room removed",
      CheckIn: stayItem.checkIn,
      CheckOut: stayItem.checkOut,
      People: stayItem.guests,
      Status: statusLabel(stayItem.status),
      Contact: stayItem.contact,
      Notes: stayItem.notes
    };
  });
  download(`room-stays-${els.activeDate.value}.csv`, toCsv(rows), "text/csv");
}

function canEditTrueData(feedbackEl) {
  if (dataMode === "true") return true;
  feedbackEl.textContent = "Switch to True data to edit.";
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
  return status.split("-").map((part) => titleCase(part)).join(" ");
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
