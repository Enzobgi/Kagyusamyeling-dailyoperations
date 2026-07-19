const state = {
  rooms: [
    { id: "zendo", name: "Main Zendo", capacity: 64, setup: ["cushions", "altar setup", "tea service"] },
    { id: "garden", name: "Garden Hall", capacity: 38, setup: ["chairs", "projector", "tea service"] },
    { id: "library", name: "Library Room", capacity: 18, setup: ["chairs", "projector"] },
    { id: "kitchen", name: "Community Kitchen", capacity: 24, setup: ["tea service", "cleaning required"] },
    { id: "studio", name: "Quiet Studio", capacity: 14, setup: ["cushions", "cleaning required"] }
  ],
  volunteers: [
    { id: "maya", name: "Maya Ortiz", contact: "maya@center.org", skills: "reception, Spanish, tea service", restrictions: "Leaves by 18:00" },
    { id: "jonah", name: "Jonah Reed", contact: "jonah@center.org", skills: "room setup, AV, maintenance", restrictions: "No Friday evenings" },
    { id: "sana", name: "Sana Iqbal", contact: "sana@center.org", skills: "kitchen, retreats, mentoring", restrictions: "Prefers mornings" },
    { id: "leo", name: "Leo Park", contact: "leo@center.org", skills: "cleaning, garden, reception", restrictions: "Limited lifting" },
    { id: "elena", name: "Elena Vos", contact: "elena@center.org", skills: "teacher assistant, ceremonies", restrictions: "Remote admin Mondays" },
    { id: "nora", name: "Nora Silva", contact: "nora@center.org", skills: "community meals, setup", restrictions: "Needs one week notice" }
  ],
  roles: ["Reception", "Kitchen", "Cleaning", "Room Setup", "Teacher Assistant", "Garden", "Maintenance", "Event Support"],
  eventTypes: ["Meditation Session", "Retreat", "Volunteer Meeting", "Workshop", "Ceremony", "Cleaning Day", "Community Meal"],
  setupNeeds: ["cushions", "chairs", "projector", "tea service", "altar setup", "cleaning required"],
  bookings: [],
  assignments: []
};

const today = new Date();
const isoDate = dateToInput(today);
const seedDate = isoDate;

state.bookings = [
  booking("b1", "zendo", "Dawn Sitting", "Mira Chen", `${seedDate}T06:30`, `${seedDate}T08:00`, 42, "Meditation Session", "Ananda Rao", ["cushions", "altar setup"], "Silence in hall until closing bell", true),
  booking("b2", "garden", "Mindful Work Circle", "Sana Iqbal", `${seedDate}T10:00`, `${seedDate}T11:30`, 28, "Volunteer Meeting", "Sana Iqbal", ["chairs", "tea service"], "Review retreat prep checklist", false),
  booking("b3", "library", "Intro to Practice", "Elena Vos", `${seedDate}T13:00`, `${seedDate}T15:00`, 22, "Workshop", "Elena Vos", ["chairs", "projector"], "Capacity watch: waitlist likely", false),
  booking("b4", "kitchen", "Community Meal Prep", "Nora Silva", `${seedDate}T16:00`, `${seedDate}T19:00`, 18, "Community Meal", "Nora Silva", ["tea service", "cleaning required"], "Use allergy cards", true),
  booking("b5", "studio", "Evening Metta Practice", "Mira Chen", `${seedDate}T19:30`, `${seedDate}T20:30`, 12, "Meditation Session", "Mira Chen", ["cushions"], "Open windows before session", false),
  booking("b6", "zendo", "Weekend Sesshin", "Ananda Rao", addDays(seedDate, 3, "09:00"), addDays(seedDate, 5, "16:00"), 58, "Retreat", "Ananda Rao", ["cushions", "altar setup", "tea service"], "Residential retreat begins Friday", true)
];

state.assignments = [
  assignment("a1", "maya", "b1", "Reception", `${seedDate}T06:00`, `${seedDate}T08:15`, "Present", "06:05", "", "Greeted newcomers", true, 1),
  assignment("a2", "jonah", "b1", "Room Setup", `${seedDate}T06:00`, `${seedDate}T07:00`, "Present", "05:55", "07:05", "Extra cushions placed", true, 0),
  assignment("a3", "sana", "b2", "Event Support", `${seedDate}T09:45`, `${seedDate}T11:45`, "Pending", "", "", "Bring signup sheet", false, 0),
  assignment("a4", "leo", "b3", "Reception", `${seedDate}T12:30`, `${seedDate}T15:15`, "Absent", "", "", "No message yet", false, 3),
  assignment("a5", "elena", "b3", "Teacher Assistant", `${seedDate}T12:45`, `${seedDate}T15:15`, "Present", "12:40", "", "Participant questions after talk", false, 0),
  assignment("a6", "nora", "b4", "Kitchen", `${seedDate}T15:30`, `${seedDate}T19:30`, "Late", "15:52", "", "Traffic delay", true, 1),
  assignment("a7", "jonah", "b4", "Maintenance", `${seedDate}T16:30`, `${seedDate}T18:00`, "Pending", "", "", "Check dishwasher noise", false, 0),
  assignment("a8", "jonah", "b5", "Room Setup", `${seedDate}T19:00`, `${seedDate}T20:45`, "Pending", "", "", "Possible overlap with cleanup", false, 0)
];

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  hydrateControls();
  bindEvents();
  render();
});

function booking(id, roomId, eventName, organizer, start, end, expected, type, teacher, setup, notes, confirmed) {
  return { id, roomId, eventName, organizer, start, end, expected, type, teacher, setup, notes, confirmed };
}

function assignment(id, volunteerId, bookingId, role, start, end, status, checkIn, checkOut, notes, recurring, noShows) {
  return { id, volunteerId, bookingId, role, start, end, status, checkIn, checkOut, notes, recurring, noShows };
}

function cacheElements() {
  [
    "activeDate", "roleView", "todayEventCount", "presentCount", "openRoomsCount", "alertCount", "alerts",
    "printOps", "globalSearch", "periodFilter", "eventTypeFilter", "statusFilter", "eventsList",
    "attendanceBody", "exportCsv", "exportExcel", "bookingForm", "bookingId", "bookingRoom",
    "bookingEvent", "bookingOrganizer", "bookingStart", "bookingEnd", "bookingExpected", "bookingRecurring",
    "bookingSetup", "bookingNotes", "bookingFeedback", "clearBooking", "roomFilter", "roomsList",
    "assignmentForm", "assignmentVolunteer", "assignmentEvent", "assignmentRole", "assignmentStart",
    "assignmentEnd", "assignmentRecurring", "assignmentFeedback", "reports", "adminForm", "adminRoomName",
    "adminRoomCapacity", "adminVolunteerName", "adminVolunteerContact", "adminSummary"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function hydrateControls() {
  els.activeDate.value = isoDate;
  fillSelect(els.bookingRoom, state.rooms.map((room) => [room.id, `${room.name} (${room.capacity})`]));
  fillSelect(els.roomFilter, [["all", "All rooms"], ...state.rooms.map((room) => [room.id, room.name])]);
  fillSelect(els.eventTypeFilter, [["all", "All event types"], ...state.eventTypes.map((type) => [type, type])]);
  fillSelect(els.bookingSetup, state.setupNeeds.map((need) => [need, titleCase(need)]));
  fillSelect(els.assignmentVolunteer, state.volunteers.map((volunteer) => [volunteer.id, volunteer.name]));
  fillSelect(els.assignmentRole, state.roles.map((role) => [role, role]));
  syncAssignmentEvents();
  els.bookingStart.value = `${isoDate}T09:00`;
  els.bookingEnd.value = `${isoDate}T10:00`;
  els.assignmentStart.value = `${isoDate}T09:00`;
  els.assignmentEnd.value = `${isoDate}T11:00`;
}

function bindEvents() {
  ["activeDate", "roleView", "globalSearch", "periodFilter", "eventTypeFilter", "statusFilter", "roomFilter"].forEach((id) => {
    els[id].addEventListener("input", render);
  });
  els.bookingForm.addEventListener("submit", saveBooking);
  els.clearBooking.addEventListener("click", clearBookingForm);
  els.assignmentForm.addEventListener("submit", saveAssignment);
  els.adminForm.addEventListener("submit", saveAdminRecord);
  els.exportCsv.addEventListener("click", () => exportAttendance("csv"));
  els.exportExcel.addEventListener("click", () => exportAttendance("xls"));
  els.printOps.addEventListener("click", () => window.print());
}

function render() {
  document.body.classList.toggle("viewer", els.roleView.value === "Viewer");
  document.body.classList.toggle("volunteer", els.roleView.value === "Volunteer");
  document.body.classList.toggle("coordinator", els.roleView.value === "Coordinator");
  syncAssignmentEvents();
  renderSummary();
  renderAlerts();
  renderEvents();
  renderAttendance();
  renderRooms();
  renderReports();
  renderAdminSummary();
}

function renderSummary() {
  const dayBookings = bookingsInPeriod("day");
  const assignments = attendanceRows();
  els.todayEventCount.textContent = dayBookings.length;
  els.presentCount.textContent = assignments.filter((row) => row.status === "Present" || row.status === "Late").length;
  els.openRoomsCount.textContent = roomsOpenNow();
  els.alertCount.textContent = collectAlerts().filter((alert) => alert.level !== "ok").length;
}

function renderAlerts() {
  const alerts = collectAlerts();
  els.alerts.innerHTML = "";
  if (!alerts.length) {
    els.alerts.append(emptyState());
    return;
  }
  alerts.forEach((alert) => {
    const node = document.createElement("article");
    node.className = `alert ${alert.level}`;
    node.innerHTML = `<strong>${escapeHtml(alert.title)}</strong><p>${escapeHtml(alert.detail)}</p>`;
    els.alerts.append(node);
  });
}

function renderEvents() {
  const search = queryText();
  const selectedRoom = els.roomFilter.value;
  const selectedType = els.eventTypeFilter.value;
  const period = els.periodFilter.value;
  const events = bookingsInPeriod(period)
    .filter((item) => selectedRoom === "all" || item.roomId === selectedRoom)
    .filter((item) => selectedType === "all" || item.type === selectedType)
    .filter((item) => matchesSearch(item, search));

  els.eventsList.innerHTML = "";
  if (!events.length) {
    els.eventsList.append(emptyState());
    return;
  }

  events.sort((a, b) => new Date(a.start) - new Date(b.start)).forEach((event) => {
    const room = roomById(event.roomId);
    const assigned = state.assignments.filter((item) => item.bookingId === event.id);
    const overCapacity = event.expected > room.capacity;
    const canManage = els.roleView.value === "Admin" || els.roleView.value === "Coordinator";
    const node = document.createElement("article");
    node.className = "event-card";
    node.innerHTML = `
      <div>
        <div class="event-title-row">
          <h3>${escapeHtml(event.eventName)}</h3>
          <span class="pill">${escapeHtml(event.type)}</span>
          ${event.confirmed ? "" : '<span class="pill pending">Unconfirmed</span>'}
          ${overCapacity ? '<span class="pill danger">Over capacity</span>' : ""}
        </div>
        <p class="muted">${formatDateTime(event.start)} - ${formatTime(event.end)} | ${escapeHtml(room.name)} | ${escapeHtml(event.teacher)}</p>
        <div class="pill-row">
          <span class="pill">${event.expected}/${room.capacity} participants</span>
          <span class="pill">${assigned.length} volunteers assigned</span>
          ${event.setup.map((need) => `<span class="pill">${escapeHtml(titleCase(need))}</span>`).join("")}
        </div>
      </div>
      <div class="button-row" ${canManage ? "" : 'hidden'}>
        <button class="mini-button secondary-action" type="button" data-edit-booking="${event.id}">Edit</button>
        <button class="mini-button secondary-action" type="button" data-cancel-booking="${event.id}">Cancel</button>
      </div>
    `;
    els.eventsList.append(node);
  });

  els.eventsList.querySelectorAll("[data-edit-booking]").forEach((button) => {
    button.addEventListener("click", () => editBooking(button.dataset.editBooking));
  });
  els.eventsList.querySelectorAll("[data-cancel-booking]").forEach((button) => {
    button.addEventListener("click", () => cancelBooking(button.dataset.cancelBooking));
  });
}

function renderAttendance() {
  const rows = attendanceRows().filter((row) => {
    const statusMatch = els.statusFilter.value === "all" || row.status === els.statusFilter.value;
    const volunteerMatch = els.roleView.value !== "Volunteer" || row.volunteerId === "maya";
    return statusMatch && volunteerMatch && matchesAttendanceSearch(row, queryText());
  });

  els.attendanceBody.innerHTML = "";
  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="10">${emptyState().outerHTML}</td>`;
    els.attendanceBody.append(tr);
    return;
  }

  const canEditAttendance = els.roleView.value === "Admin" || els.roleView.value === "Coordinator" || els.roleView.value === "Volunteer";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHtml(row.volunteer.name)}</strong><br><span class="muted">${escapeHtml(row.volunteer.skills)}</span></td>
      <td>${escapeHtml(row.role)}</td>
      <td>${escapeHtml(row.volunteer.contact)}</td>
      <td>${dateToInput(new Date(row.start))}</td>
      <td>${formatTime(row.start)} - ${formatTime(row.end)}<br><span class="muted">${escapeHtml(row.booking.eventName)}</span></td>
      <td>
        <div class="presence">
          <button class="mini-button" type="button" data-check-in="${row.id}" ${canEditAttendance ? "" : "disabled"}>In</button>
          <button class="mini-button secondary-action" type="button" data-check-out="${row.id}" ${canEditAttendance ? "" : "disabled"}>Out</button>
        </div>
      </td>
      <td><input value="${escapeAttr(row.checkIn)}" data-field="checkIn" data-id="${row.id}" placeholder="--:--" ${canEditAttendance ? "" : "disabled"}></td>
      <td><input value="${escapeAttr(row.checkOut)}" data-field="checkOut" data-id="${row.id}" placeholder="--:--" ${canEditAttendance ? "" : "disabled"}></td>
      <td><input value="${escapeAttr(row.notes)}" data-field="notes" data-id="${row.id}" ${canEditAttendance ? "" : "disabled"}></td>
      <td>
        <select data-field="status" data-id="${row.id}" ${canEditAttendance ? "" : "disabled"}>
          ${["Present", "Absent", "Late", "Excused", "Pending", "Not Scheduled"].map((status) => `<option ${status === row.status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </td>
    `;
    els.attendanceBody.append(tr);
  });

  els.attendanceBody.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", updateAttendanceField);
  });
  els.attendanceBody.querySelectorAll("[data-check-in]").forEach((button) => {
    button.addEventListener("click", () => checkVolunteer(button.dataset.checkIn, "in"));
  });
  els.attendanceBody.querySelectorAll("[data-check-out]").forEach((button) => {
    button.addEventListener("click", () => checkVolunteer(button.dataset.checkOut, "out"));
  });
}

function renderAdminSummary() {
  els.adminSummary.innerHTML = "";
  [
    ["Rooms", state.rooms.map((room) => `${room.name} (${room.capacity})`).join(" | ")],
    ["Volunteers", state.volunteers.map((volunteer) => volunteer.name).join(" | ")],
    ["Event types", state.eventTypes.join(" | ")],
    ["Permissions", "Admin full access | Coordinator operations | Volunteer own schedule | Viewer public calendar and room usage"]
  ].forEach(([title, body]) => {
    const node = document.createElement("article");
    node.className = "report-card";
    node.innerHTML = `<strong>${escapeHtml(title)}</strong><p class="muted">${escapeHtml(body)}</p>`;
    els.adminSummary.append(node);
  });
}

function renderRooms() {
  const selectedRoom = els.roomFilter.value;
  const rooms = state.rooms.filter((room) => selectedRoom === "all" || room.id === selectedRoom);
  const dayBookings = bookingsInPeriod("day");
  els.roomsList.innerHTML = "";
  rooms.forEach((room) => {
    const roomBookings = dayBookings.filter((bookingItem) => bookingItem.roomId === room.id);
    const maxExpected = Math.max(0, ...roomBookings.map((bookingItem) => bookingItem.expected));
    const fill = Math.min(100, Math.round((maxExpected / room.capacity) * 100));
    const node = document.createElement("article");
    node.className = "room-card";
    node.innerHTML = `
      <div class="room-meta"><h3>${escapeHtml(room.name)}</h3><span>${room.capacity} capacity</span></div>
      <div class="capacity-bar ${maxExpected > room.capacity ? "over" : ""}" style="--fill: ${fill}%"><span></span></div>
      <p class="muted">${roomBookings.length ? roomBookings.map((item) => `${formatTime(item.start)} ${item.eventName}`).join(" | ") : "Available all selected day"}</p>
      <div class="pill-row">${room.setup.map((need) => `<span class="pill">${escapeHtml(titleCase(need))}</span>`).join("")}</div>
    `;
    els.roomsList.append(node);
  });
}

function renderReports() {
  const rows = attendanceRows();
  const missed = rows.filter((row) => row.status === "Absent").length;
  const noShowNames = state.assignments
    .filter((item) => item.noShows > 0)
    .sort((a, b) => b.noShows - a.noShows)
    .map((item) => `${volunteerById(item.volunteerId).name}: ${item.noShows}`)
    .slice(0, 3);
  const roomUse = state.rooms.map((room) => ({
    name: room.name,
    count: state.bookings.filter((item) => item.roomId === room.id).length
  })).sort((a, b) => b.count - a.count)[0];
  const participation = bookingsInPeriod(els.periodFilter.value).reduce((sum, item) => sum + Number(item.expected || 0), 0);

  els.reports.innerHTML = "";
  [
    ["Volunteer attendance history", `${rows.filter((row) => row.status === "Present").length} present, ${rows.filter((row) => row.status === "Late").length} late, ${missed} absent in this view.`],
    ["Room usage", `${roomUse.name} is the most used room across current bookings.`],
    ["No-show history", noShowNames.length ? noShowNames.join(" | ") : "No repeated no-shows recorded."],
    ["Event participation", `${participation} expected participants for the selected ${els.periodFilter.value}.`]
  ].forEach(([title, body]) => {
    const node = document.createElement("article");
    node.className = "report-card";
    node.innerHTML = `<strong>${escapeHtml(title)}</strong><p class="muted">${escapeHtml(body)}</p>`;
    els.reports.append(node);
  });
}

function collectAlerts() {
  const alerts = [];
  const periodBookings = bookingsInPeriod(els.periodFilter.value);

  findRoomConflicts(state.bookings).forEach(([a, b]) => {
    alerts.push({
      level: "danger",
      title: "Room conflict",
      detail: `${roomById(a.roomId).name} is double-booked for ${a.eventName} and ${b.eventName}.`
    });
  });

  findVolunteerConflicts(state.assignments).forEach(([a, b]) => {
    alerts.push({
      level: "warning",
      title: "Volunteer overlap",
      detail: `${volunteerById(a.volunteerId).name} overlaps between ${bookingById(a.bookingId).eventName} and ${bookingById(b.bookingId).eventName}.`
    });
  });

  periodBookings.forEach((bookingItem) => {
    const room = roomById(bookingItem.roomId);
    if (bookingItem.expected > room.capacity) {
      alerts.push({
        level: "warning",
        title: "Capacity warning",
        detail: `${bookingItem.eventName} expects ${bookingItem.expected}; ${room.name} holds ${room.capacity}.`
      });
    }
    if (!bookingItem.confirmed) {
      alerts.push({
        level: "warning",
        title: "Unconfirmed booking",
        detail: `${bookingItem.eventName} still needs confirmation from ${bookingItem.organizer}.`
      });
    }
  });

  attendanceRows().filter((row) => row.status === "Absent" || row.status === "Pending").forEach((row) => {
    alerts.push({
      level: row.status === "Absent" ? "danger" : "warning",
      title: row.status === "Absent" ? "Missing volunteer" : "Pending volunteer",
      detail: `${row.volunteer.name} is ${row.status.toLowerCase()} for ${row.booking.eventName}.`
    });
  });

  if (!alerts.length) {
    alerts.push({ level: "ok", title: "No active issues", detail: "Rooms, bookings, and volunteer attendance are clear for this view." });
  }

  return alerts.slice(0, 9);
}

function saveBooking(event) {
  event.preventDefault();
  const current = {
    id: els.bookingId.value || uniqueId("b"),
    roomId: els.bookingRoom.value,
    eventName: els.bookingEvent.value.trim(),
    organizer: els.bookingOrganizer.value.trim(),
    start: els.bookingStart.value,
    end: els.bookingEnd.value,
    expected: Number(els.bookingExpected.value),
    type: "Meditation Session",
    teacher: els.bookingOrganizer.value.trim(),
    setup: selectedOptions(els.bookingSetup),
    notes: els.bookingNotes.value.trim(),
    confirmed: true
  };

  if (new Date(current.end) <= new Date(current.start)) {
    els.bookingFeedback.textContent = "End time must be after start time.";
    return;
  }

  const candidates = expandRecurringBooking(current, els.bookingRecurring.value);
  const conflicts = candidates.some((candidate) => hasRoomConflict(candidate, state.bookings.filter((item) => item.id !== current.id)));
  if (conflicts) {
    els.bookingFeedback.textContent = "This room is already booked during one of those times.";
    return;
  }

  state.bookings = state.bookings.filter((item) => item.id !== current.id);
  state.bookings.push(...candidates);
  clearBookingForm();
  render();
}

function clearBookingForm() {
  els.bookingForm.reset();
  els.bookingId.value = "";
  els.bookingStart.value = `${els.activeDate.value}T09:00`;
  els.bookingEnd.value = `${els.activeDate.value}T10:00`;
  els.bookingExpected.value = "18";
  els.bookingFeedback.textContent = "";
}

function editBooking(id) {
  const bookingItem = bookingById(id);
  if (!bookingItem) return;
  els.bookingId.value = bookingItem.id;
  els.bookingRoom.value = bookingItem.roomId;
  els.bookingEvent.value = bookingItem.eventName;
  els.bookingOrganizer.value = bookingItem.organizer;
  els.bookingStart.value = bookingItem.start;
  els.bookingEnd.value = bookingItem.end;
  els.bookingExpected.value = bookingItem.expected;
  Array.from(els.bookingSetup.options).forEach((option) => {
    option.selected = bookingItem.setup.includes(option.value);
  });
  els.bookingNotes.value = bookingItem.notes;
  els.bookingRecurring.value = "none";
  els.bookingFeedback.textContent = "";
  els.bookingEvent.focus();
}

function cancelBooking(id) {
  state.bookings = state.bookings.filter((item) => item.id !== id);
  state.assignments = state.assignments.filter((item) => item.bookingId !== id);
  render();
}

function saveAssignment(event) {
  event.preventDefault();
  const current = {
    id: uniqueId("a"),
    volunteerId: els.assignmentVolunteer.value,
    bookingId: els.assignmentEvent.value,
    role: els.assignmentRole.value,
    start: els.assignmentStart.value,
    end: els.assignmentEnd.value,
    status: "Pending",
    checkIn: "",
    checkOut: "",
    notes: "",
    recurring: els.assignmentRecurring.checked,
    noShows: 0
  };

  if (new Date(current.end) <= new Date(current.start)) {
    els.assignmentFeedback.textContent = "Shift end must be after shift start.";
    return;
  }
  if (hasVolunteerConflict(current, state.assignments)) {
    els.assignmentFeedback.textContent = "This volunteer already has an overlapping duty.";
    return;
  }
  state.assignments.push(current);
  els.assignmentFeedback.textContent = "";
  render();
}

function saveAdminRecord(event) {
  event.preventDefault();
  const roomName = els.adminRoomName.value.trim();
  const volunteerName = els.adminVolunteerName.value.trim();
  if (roomName) {
    state.rooms.push({
      id: uniqueId("room"),
      name: roomName,
      capacity: Number(els.adminRoomCapacity.value || 20),
      setup: ["cushions", "chairs"]
    });
  }
  if (volunteerName) {
    state.volunteers.push({
      id: uniqueId("vol"),
      name: volunteerName,
      contact: els.adminVolunteerContact.value.trim() || "contact pending",
      skills: "availability pending",
      restrictions: "None recorded"
    });
  }
  els.adminForm.reset();
  hydrateControls();
  render();
}

function updateAttendanceField(event) {
  const item = state.assignments.find((assignmentItem) => assignmentItem.id === event.target.dataset.id);
  if (!item) return;
  item[event.target.dataset.field] = event.target.value;
  if (event.target.dataset.field === "status" && event.target.value === "Absent") {
    item.noShows = Number(item.noShows || 0) + 1;
  }
  renderSummary();
  renderAlerts();
  renderReports();
}

function checkVolunteer(id, direction) {
  const item = state.assignments.find((assignmentItem) => assignmentItem.id === id);
  if (!item) return;
  const now = new Date();
  const stamp = now.toTimeString().slice(0, 5);
  if (direction === "in") {
    item.checkIn = stamp;
    item.status = new Date() > new Date(item.start) ? "Late" : "Present";
  } else {
    item.checkOut = stamp;
    if (item.status === "Pending") item.status = "Present";
  }
  render();
}

function exportAttendance(format) {
  const rows = attendanceRows().map((row) => ({
    Volunteer: row.volunteer.name,
    Role: row.role,
    Contact: row.volunteer.contact,
    Date: dateToInput(new Date(row.start)),
    "Scheduled Shift": `${formatTime(row.start)} - ${formatTime(row.end)}`,
    "Actual Presence": row.status,
    "Check-in": row.checkIn,
    "Check-out": row.checkOut,
    Notes: row.notes,
    Status: row.status
  }));
  const csv = toCsv(rows);
  const type = format === "xls" ? "application/vnd.ms-excel" : "text/csv";
  const extension = format === "xls" ? "xls" : "csv";
  download(`attendance-${els.activeDate.value}.${extension}`, csv, type);
}

function attendanceRows() {
  const active = els.activeDate.value;
  return state.assignments
    .map((item) => ({
      ...item,
      volunteer: volunteerById(item.volunteerId),
      booking: bookingById(item.bookingId)
    }))
    .filter((item) => item.volunteer && item.booking)
    .filter((item) => dateToInput(new Date(item.start)) === active || dateToInput(new Date(item.booking.start)) === active)
    .sort((a, b) => new Date(a.start) - new Date(b.start));
}

function bookingsInPeriod(period) {
  const anchor = new Date(`${els.activeDate.value}T00:00`);
  const start = new Date(anchor);
  const end = new Date(anchor);
  if (period === "day") {
    end.setDate(start.getDate() + 1);
  } else if (period === "week") {
    end.setDate(start.getDate() + 7);
  } else {
    end.setMonth(start.getMonth() + 1);
  }
  return state.bookings.filter((item) => overlapsRange(item.start, item.end, start, end));
}

function roomsOpenNow() {
  const now = new Date();
  const activeDay = els.activeDate.value === dateToInput(now);
  if (!activeDay) return state.rooms.length;
  const occupied = new Set(state.bookings.filter((item) => new Date(item.start) <= now && new Date(item.end) >= now).map((item) => item.roomId));
  return state.rooms.length - occupied.size;
}

function syncAssignmentEvents() {
  const options = bookingsInPeriod(els.periodFilter?.value || "day").map((item) => [item.id, `${item.eventName} | ${roomById(item.roomId).name}`]);
  fillSelect(els.assignmentEvent, options.length ? options : state.bookings.map((item) => [item.id, item.eventName]));
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

function findRoomConflicts(bookings) {
  const conflicts = [];
  bookings.forEach((item, index) => {
    bookings.slice(index + 1).forEach((other) => {
      if (item.roomId === other.roomId && overlapsRange(item.start, item.end, new Date(other.start), new Date(other.end))) {
        conflicts.push([item, other]);
      }
    });
  });
  return conflicts;
}

function findVolunteerConflicts(assignments) {
  const conflicts = [];
  assignments.forEach((item, index) => {
    assignments.slice(index + 1).forEach((other) => {
      if (item.volunteerId === other.volunteerId && overlapsRange(item.start, item.end, new Date(other.start), new Date(other.end))) {
        conflicts.push([item, other]);
      }
    });
  });
  return conflicts;
}

function hasRoomConflict(candidate, bookings) {
  return bookings.some((item) => item.roomId === candidate.roomId && overlapsRange(candidate.start, candidate.end, new Date(item.start), new Date(item.end)));
}

function hasVolunteerConflict(candidate, assignments) {
  return assignments.some((item) => item.volunteerId === candidate.volunteerId && overlapsRange(candidate.start, candidate.end, new Date(item.start), new Date(item.end)));
}

function overlapsRange(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
}

function expandRecurringBooking(source, recurrence) {
  const count = recurrence === "weekly" ? 6 : recurrence === "monthly" ? 3 : 1;
  return Array.from({ length: count }, (_, index) => {
    const next = { ...source, id: index === 0 ? source.id : uniqueId("b") };
    const start = new Date(source.start);
    const end = new Date(source.end);
    if (recurrence === "weekly") {
      start.setDate(start.getDate() + index * 7);
      end.setDate(end.getDate() + index * 7);
    }
    if (recurrence === "monthly") {
      start.setMonth(start.getMonth() + index);
      end.setMonth(end.getMonth() + index);
    }
    next.start = toLocalInput(start);
    next.end = toLocalInput(end);
    return next;
  });
}

function matchesSearch(item, search) {
  if (!search) return true;
  const room = roomById(item.roomId);
  return [item.eventName, item.organizer, item.teacher, item.type, room.name, item.notes, item.setup.join(" ")]
    .join(" ")
    .toLowerCase()
    .includes(search);
}

function matchesAttendanceSearch(row, search) {
  if (!search) return true;
  return [row.volunteer.name, row.volunteer.contact, row.volunteer.skills, row.role, row.booking.eventName, row.status, row.notes]
    .join(" ")
    .toLowerCase()
    .includes(search);
}

function queryText() {
  return els.globalSearch.value.trim().toLowerCase();
}

function roomById(id) {
  return state.rooms.find((room) => room.id === id);
}

function volunteerById(id) {
  return state.volunteers.find((volunteer) => volunteer.id === id);
}

function bookingById(id) {
  return state.bookings.find((item) => item.id === id);
}

function selectedOptions(select) {
  return Array.from(select.selectedOptions).map((option) => option.value);
}

function dateToInput(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function toLocalInput(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function addDays(dateString, amount, time) {
  const date = new Date(`${dateString}T${time}`);
  date.setDate(date.getDate() + amount);
  return toLocalInput(date);
}

function titleCase(value) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function uniqueId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((header) => csvCell(row[header])).join(","));
  });
  return lines.join("\n");
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

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
