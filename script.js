document.addEventListener("DOMContentLoaded", () => {

  const MAX_SLOTS = 5;

  const FLASK_API_URL = "https://od-booker.onrender.com";

  const API_URL = "https://script.google.com/macros/s/AKfycbz8JBmEGJGqKuz3rEZfkPQsyndPaVcAN4K-zmJUaTdk5l4WFvgNyHLfEWML2chY9J3g9w/exec";

  const nameInput  = document.getElementById("name-input");
  const eventInput = document.getElementById("event-input");
  const saveBtn    = document.getElementById("save-btn");
  const printBtn   = document.getElementById("print-btn");

  const daysContainer = document.querySelector(".days");
  const nextBtn       = document.querySelector(".next-btn");
  const prevBtn       = document.querySelector(".prev-btn");
  const month         = document.querySelector(".month");
  const todayBtn      = document.querySelector(".today-btn");

  const popup        = document.getElementById("popup");
  const selectedDate = document.getElementById("selected-date");
  const closeBtn     = document.querySelector(".close-btn");
  const popupList    = document.getElementById("popup-list");

  // Print Dropdown Elements
  const printDropdown = document.getElementById("print-dropdown");
  const generatePdfBtn = document.getElementById("generate-pdf-btn");
  const printFilterSelect = document.getElementById("print-filter-select");
  
  const printDateInputs = document.getElementById("print-date-inputs");
  const printNameInputs = document.getElementById("print-name-inputs");
  const printMonthlyInputs = document.getElementById("print-monthly-inputs");

  const printSingleDate = document.getElementById("print-single-date");
  const printName = document.getElementById("print-name");
  const printDateFrom = document.getElementById("print-date-from");
  const printDateTo = document.getElementById("print-date-to");
  const printMonth = document.getElementById("print-month");

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  let selectedDay = null;
  let events = {};

  const date = new Date();
  let currentMonth = date.getMonth();
  let currentYear  = date.getFullYear();

  
  function toDateKey(rawDate) {
    // Handle "DD-M-YYYY" or "D-M-YYYY" string format
    if (typeof rawDate === "string" && /^\d{1,2}-\d{1,2}-\d{4}$/.test(rawDate)) {
      const [day, month, year] = rawDate.split("-").map(Number);
      return `${day}-${month - 1}-${year}`;   // month is 0-indexed in keys
    }
    const d = new Date(rawDate);
    if (isNaN(d)) return null;
    // Use LOCAL time so IST dates match the calendar keys
    return `${d.getDate()}-${d.getMonth()}-${d.getFullYear()}`;
  }

  // Build zero-padded "YYYY-MM-DD" to send to sheet
  function toSheetDate(day, month, year) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${dd}-${mm}-${year}`;
  }

  // ─────────────────────────────────────────────
  // 🔧 FIX 2: convertData uses toDateKey()
  //    so key always matches what renderCalendar builds
  // ─────────────────────────────────────────────
  function convertData(data) {
    const obj = {};
    data.forEach(item => {
      const key = toDateKey(item.date);
      if (!key) return;
      if (!obj[key]) obj[key] = [];
      obj[key].push({ name: item.name, event: item.event });
    });
    return obj;
  }

  // ─────────────────────────────────────────────
  // 🔧 FIX 3: loadEvents with cache-busting
  // ─────────────────────────────────────────────
  async function loadEvents() {
    try {
      const res  = await fetch(API_URL + "?t=" + Date.now());
      const data = await res.json();
      events = convertData(data);
    } catch (err) {
      console.error("Load error:", err);
    }
    renderCalendar();
  }

  // ─────────────────────────────────────────────
  // RENDER CALENDAR
  // ─────────────────────────────────────────────
  function renderCalendar() {
    const firstDay        = new Date(currentYear, currentMonth, 1);
    const lastDay         = new Date(currentYear, currentMonth + 1, 0);
    const lastDayIndex    = lastDay.getDay();
    const lastDayDate     = lastDay.getDate();
    const prevLastDay     = new Date(currentYear, currentMonth, 0);
    const prevLastDayDate = prevLastDay.getDate();
    const nextDays        = 7 - lastDayIndex - 1;

    month.innerHTML = `${months[currentMonth]} ${currentYear}`;

    let days = "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let x = firstDay.getDay(); x > 0; x--) {
      days += `<div class="day prev">${prevLastDayDate - x + 1}</div>`;
    }

    for (let i = 1; i <= lastDayDate; i++) {
      const key            = `${i}-${currentMonth}-${currentYear}`;
      const currentDateObj = new Date(currentYear, currentMonth, i);

      let dayClass = "day";
      let count    = events[key] ? events[key].length : 0;

      if (currentDateObj < today) {
        dayClass += " disabled-day";
        if (count > 0) dayClass += " past-booked";
      } else if (count >= MAX_SLOTS) {
        dayClass += " full-day";
      } else if (count > 0) {
        dayClass += " partial-day";
      }

      if (
        i === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear  === today.getFullYear()
      ) dayClass += " today";

      let namesHTML = "";
      if (events[key]) {
        const names = events[key].map(e => e.name).join(", ");
        namesHTML  += `<div class="name-row">${names}</div>`;
        namesHTML  += `<small>${count}/${MAX_SLOTS}</small>`;
      }

      days += `<div class="${dayClass}"><div>${i}</div>${namesHTML}</div>`;
    }

    for (let j = 1; j <= nextDays; j++) {
      days += `<div class="day next">${j}</div>`;
    }

    daysContainer.innerHTML = days;
    hideTodayBtn();
  }

  // NAVIGATION
  nextBtn.onclick = () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
  };

  prevBtn.onclick = () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
  };

  todayBtn.onclick = () => {
    const now = new Date();
    currentMonth = now.getMonth();
    currentYear  = now.getFullYear();
    renderCalendar();
  };

  function hideTodayBtn() {
    const now = new Date();
    todayBtn.style.display =
      currentMonth === now.getMonth() && currentYear === now.getFullYear()
        ? "none" : "flex";
  }

  // ─────────────────────────────────────────────
  // CLICK DAY → OPEN POPUP
  // ─────────────────────────────────────────────
  daysContainer.addEventListener("click", (e) => {
    const dayElement = e.target.closest(".day");
    if (
      !dayElement ||
      dayElement.classList.contains("prev") ||
      dayElement.classList.contains("next")
    ) return;

    const dayValue        = parseInt(dayElement.querySelector("div").innerText);
    const selectedDateObj = new Date(currentYear, currentMonth, dayValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDateObj < today) { alert("Cannot book past dates"); return; }

    selectedDay = `${dayValue}-${currentMonth}-${currentYear}`;
    selectedDate.innerText = `${dayValue} ${months[currentMonth]} ${currentYear}`;

    // Refresh popup list
    popupList.innerHTML = "";
    if (events[selectedDay] && events[selectedDay].length > 0) {
      events[selectedDay].forEach(item => {
        popupList.innerHTML +=
          `<div class="popup-entry"><b>${item.name}</b> — ${item.event}</div>`;
      });
      popupList.innerHTML +=
        `<p class="slot-count">${events[selectedDay].length}/${MAX_SLOTS} slots filled</p>`;
    } else {
      popupList.innerHTML = `<p class="slot-count">0/${MAX_SLOTS} — Be the first to book!</p>`;
    }

    // Always clear inputs when popup opens
    nameInput.value  = "";
    eventInput.value = "";

    popup.style.display = "flex";
  });

  // ─────────────────────────────────────────────
  // 🔧 FIX 4: SAVE — use mode:'no-cors'
  //
  //  Google Apps Script deployed as a web app
  //  does NOT return CORS headers for POST requests
  //  from browsers. Using mode:'no-cors' means the
  //  browser sends the request without blocking it,
  //  but we can't read the response. That's fine —
  //  we wait 1.5s then re-fetch (GET) to confirm.
  // ─────────────────────────────────────────────
  saveBtn.onclick = async () => {
    const name      = nameInput.value.trim();
    const eventText = eventInput.value.trim();

    if (!name || !eventText) { alert("Please fill in both fields."); return; }
    if (!selectedDay)        { alert("Select a date first.");        return; }

    // Frontend duplicate / full check
    if (events[selectedDay]) {
      const exists = events[selectedDay].some(
        e => e.name.toLowerCase() === name.toLowerCase()
      );
      if (exists) { alert("You are already booked on this date!"); return; }
      if (events[selectedDay].length >= MAX_SLOTS) { alert("This day is fully booked!"); return; }
    }

    saveBtn.disabled    = true;
    saveBtn.textContent = "Saving…";

    const [d, m, y] = selectedDay.split("-");
    const dateStr   = toSheetDate(parseInt(d), parseInt(m), parseInt(y));

    try {
      // ✅ FIX: Use GET with query parameters instead of POST.
      //    Google Apps Script supports CORS for GET (the redirect
      //    to googleusercontent.com includes CORS headers) but
      //    NOT for POST — which is why POST saves were failing.
      const saveUrl = `${API_URL}?action=save`
        + `&date=${encodeURIComponent(dateStr)}`
        + `&name=${encodeURIComponent(name)}`
        + `&event=${encodeURIComponent(eventText)}`
        + `&month=${encodeURIComponent(months[parseInt(m)])}`
        + `&year=${encodeURIComponent(y)}`;

      const res    = await fetch(saveUrl);
      const result = await res.json();

      if (result.status === "duplicate") {
        alert("You are already booked on this date!");
        saveBtn.disabled    = false;
        saveBtn.textContent = "Save";
        return;
      }

      // ✅ Optimistic UI update — add entry locally so it appears
      //    on the calendar immediately without waiting for a re-fetch
      if (!events[selectedDay]) events[selectedDay] = [];
      events[selectedDay].push({ name, event: eventText });
      renderCalendar();

      popup.style.display = "none";

      // Background sync to confirm the sheet write succeeded
      setTimeout(() => loadEvents(), 3000);

    } catch (err) {
      console.error("Save error:", err);
      alert("Network error — check your Apps Script URL or deployment settings.");
    }

    saveBtn.disabled    = false;
    saveBtn.textContent = "Save";
  };

  // ─────────────────────────────────────────────
  // PRINT DROPDOWN & PDF GENERATION
  // ─────────────────────────────────────────────
  printBtn.onclick = (e) => {
    e.stopPropagation();
    
    // Toggle dropdown
    const isVisible = printDropdown.style.display === "flex";
    if (isVisible) {
      printDropdown.style.display = "none";
      return;
    }

    // Set defaults: today's date for 'date', current month for 'monthly'
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const yyyy = today.getFullYear();
    
    printSingleDate.value = `${yyyy}-${mm}-${dd}`;
    
    // Set current month currently displayed in calendar calendar
    const calMonth = String(currentMonth + 1).padStart(2, "0");
    printMonth.value = `${currentYear}-${calMonth}`;
    
    // Reset date range
    printDateFrom.value = "";
    printDateTo.value = "";
    printName.value = "";
    
    // Reset selection to default (date)
    printFilterSelect.value = "date";
    printDateInputs.style.display = "block";
    printNameInputs.style.display = "none";
    printMonthlyInputs.style.display = "none";

    printDropdown.style.display = "flex";
  };

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".print-wrapper")) {
      printDropdown.style.display = "none";
    }
  });
  
  // Prevent closing when clicking inside dropdown
  printDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Toggle filter inputs visibility
  printFilterSelect.addEventListener("change", (e) => {
    printDateInputs.style.display = "none";
    printNameInputs.style.display = "none";
    printMonthlyInputs.style.display = "none";

    if (e.target.value === "date") {
      printDateInputs.style.display = "block";
    } else if (e.target.value === "name") {
      printNameInputs.style.display = "block";
    } else if (e.target.value === "monthly") {
      printMonthlyInputs.style.display = "block";
    }
  });

  generatePdfBtn.onclick = async () => {
    const filterType = printFilterSelect.value;
    let payload = { filter: filterType };

    if (filterType === "date") {
      if (!printSingleDate.value) return alert("Please select a date.");
      const [y, m, d] = printSingleDate.value.split("-");
      payload.date = `${d}-${m}-${y}`;
    } else if (filterType === "name") {
      if (!printName.value || !printDateFrom.value || !printDateTo.value) {
        return alert("Please enter name and select both From and To dates.");
      }
      const [fy, fm, fd] = printDateFrom.value.split("-");
      const [ty, tm, td] = printDateTo.value.split("-");
      payload.name = printName.value.trim();
      payload.from = `${fd}-${fm}-${fy}`;
      payload.to = `${td}-${tm}-${ty}`;
    } else if (filterType === "monthly") {
      if (!printMonth.value) return alert("Please select a month.");
      const [y, m] = printMonth.value.split("-");
      payload.month = months[parseInt(m) - 1];
      payload.year = y;
    }

    generatePdfBtn.disabled = true;
    generatePdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

    try {
      const response = await fetch(`${FLASK_API_URL}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `OD_Report_${filterType}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      printDropdown.style.display = "none";
    } catch (err) {
      console.error(err);
      alert("Error generating PDF. Make sure the backend API is running.");
    } finally {
      generatePdfBtn.disabled = false;
      generatePdfBtn.innerHTML = '<i class="fas fa-download"></i> Generate PDF';
    }
  };

  // AUTO SYNC every 10 seconds
  setInterval(loadEvents, 10000);

  // 🚀 INIT
  loadEvents();

  closeBtn.onclick = () => popup.style.display = "none";
});
