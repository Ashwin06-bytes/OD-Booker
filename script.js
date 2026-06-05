document.addEventListener("DOMContentLoaded", () => {

  const MAX_SLOTS = 5;

  const FLASK_API_URL = "https://od-booker.onrender.com";

  const API_URL = "https://script.google.com/macros/s/AKfycbxTniQxYW2rmGKWzGd06Z_yq3TX5TydfhhQaVuvTNHeBGOu8V1LGN-bYurKqLNPFQuung/exec";

  const nameInput  = document.getElementById("name-input");
  const regNoInput = document.getElementById("reg-no-input");
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
  const emailSection = document.getElementById("email-request-section");
  const emailBtn1    = document.getElementById("email-btn-1");
  const emailBtn2    = document.getElementById("email-btn-2");

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
  let pendingSave = false; // prevents auto-sync from wiping a fresh optimistic update

  const date = new Date();
  let currentMonth = date.getMonth();
  let currentYear  = date.getFullYear();

  
  function toDateKey(rawDate) {
    if (typeof rawDate === "string") {
      // Handle "DD-MM-YYYY" or "D-M-YYYY" (dash-separated, our storage format)
      if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(rawDate)) {
        const [day, month, year] = rawDate.split("-").map(Number);
        return `${day}-${month - 1}-${year}`; // month is 0-indexed in keys
      }
      // Handle "DD/MM/YYYY" or "D/M/YYYY" (slash-separated, some GAS locales)
      // ⚠️ Must NOT use new Date() here — browser treats "8/6/2026" as Aug 6 (MM/DD),
      //    but GAS may return it as D/M meaning June 8. Parse manually to be safe.
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawDate)) {
        const [day, month, year] = rawDate.split("/").map(Number);
        return `${day}-${month - 1}-${year}`;
      }
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
    if (pendingSave) return; // ✅ don't overwrite optimistic update mid-save
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
    const dateLabel = `${dayValue} ${months[currentMonth]} ${currentYear}`;
    selectedDate.innerText = dateLabel;

    // Refresh popup list
    popupList.innerHTML = "";
    const count = events[selectedDay] ? events[selectedDay].length : 0;

    if (count > 0) {
      events[selectedDay].forEach(item => {
        popupList.innerHTML +=
          `<div class="popup-entry"><b>${item.name}</b> — ${item.event}</div>`;
      });
      popupList.innerHTML +=
        `<p class="slot-count">${count}/${MAX_SLOTS} slots filled</p>`;
    } else {
      popupList.innerHTML = `<p class="slot-count">0/${MAX_SLOTS} — Be the first to book!</p>`;
    }

    // Always clear inputs when popup opens
    nameInput.value  = "";
    regNoInput.value = "";
    eventInput.value = "";

    // Show/hide email section based on whether day is fully booked
    const isFull = count >= MAX_SLOTS;
    emailSection.style.display = isFull ? "block" : "none";
    saveBtn.style.display      = isFull ? "none"  : "block";

    // Build mailto links (will update live as user types)
    updateEmailLinks(dateLabel);

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
  // ── REG NO: block non-digits at the keyboard level ─────────
  regNoInput.addEventListener("keydown", (e) => {
    // Allow: backspace, delete, tab, arrows, home, end
    const allowed = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End"];
    if (allowed.includes(e.key)) return;
    // Block anything that isn't a digit 0–9
    if (!/^\d$/.test(e.key)) e.preventDefault();
  });

  // Also strip on paste (in case user pastes text)
  regNoInput.addEventListener("input", () => {
    regNoInput.value = regNoInput.value.replace(/\D/g, "").slice(0, 11);
  });

  saveBtn.onclick = async () => {
    const name      = nameInput.value.trim();
    const regNo     = regNoInput.value.trim();
    const eventText = eventInput.value.trim();

    if (!name || !regNo || !eventText) { alert("Please fill in all fields."); return; }
    if (!/^\d{11}$/.test(regNo))       { alert("Register No must be exactly 11 digits."); return; }
    if (!selectedDay)                  { alert("Select a date first."); return; }

    // Frontend duplicate / full check
    if (events[selectedDay]) {
      const exists = events[selectedDay].some(
        e => e.name.toLowerCase() === name.toLowerCase()
      );
      if (exists) { alert("You are already booked on this date!"); return; }
      if (events[selectedDay].length >= MAX_SLOTS) { return; } // email section shown instead
    }

    saveBtn.disabled    = true;
    saveBtn.textContent = "Saving…";

    const [d, m, y] = selectedDay.split("-");
    const dateStr   = toSheetDate(parseInt(d), parseInt(m), parseInt(y));

    try {
      const saveUrl = `${API_URL}?action=save`
        + `&date=${encodeURIComponent(dateStr)}`
        + `&name=${encodeURIComponent(name)}`
        + `&reg_no=${encodeURIComponent(regNo)}`
        + `&event=${encodeURIComponent(eventText)}`
        + `&month=${encodeURIComponent(months[parseInt(m)])}`
        + `&year=${encodeURIComponent(y)}`;

      const res = await fetch(saveUrl);

      // Parse JSON separately — GAS sometimes returns an HTML error page
      // instead of JSON. We must NOT let a JSON parse failure block the
      // optimistic UI update (the data was likely saved despite the bad response).
      let result = null;
      try { result = await res.json(); } catch (_) { /* non-JSON response, ignore */ }

      if (result && result.status === "duplicate") {
        alert("You are already booked on this date!");
        saveBtn.disabled    = false;
        saveBtn.textContent = "Save";
        return;
      }

      // ✅ Optimistic UI update — always runs as long as the network
      //    request itself succeeded (no fetch-level error thrown above).
      if (!events[selectedDay]) events[selectedDay] = [];
      events[selectedDay].push({ name, event: eventText });
      renderCalendar();
      popup.style.display = "none";

      // Block auto-sync for 6s so it doesn't overwrite the optimistic update,
      // then do a single explicit reload to confirm the sheet write.
      pendingSave = true;
      setTimeout(() => {
        pendingSave = false;
        loadEvents();
      }, 6000);

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

  // 🚀 INIT — render calendar immediately so it's visible on load,
  // then load events from API (will re-render with booking data)
  renderCalendar();
  loadEvents();

  // ─────────────────────────────────────────────
  // 📧 BUILD MAILTO LINKS (Gmail with pre-filled subject + body)
  // ─────────────────────────────────────────────
  function updateEmailLinks(dateLabel) {
    const name  = nameInput.value.trim()  || "[Your Name]";
    const regNo = regNoInput.value.trim() || "[Your Register No]";
    const event = eventInput.value.trim() || "[Event Name]";

    const subject = encodeURIComponent(`OD Request for ${dateLabel}`);
    const body    = encodeURIComponent(
      `Name: ${name}\nRegister No: ${regNo}\nEvent: ${event}\nDate: ${dateLabel}\n\nPlease consider my request for OD on the above date. Thank you.`
    );

    emailBtn1.href = `mailto:25cb049@drngpit.ac.in?subject=${subject}&body=${body}`;
    emailBtn2.href = `mailto:25cb004@drngpit.ac.in?subject=${subject}&body=${body}`;

    // Remove target="_blank" so mailto doesn't leave an empty blank browser tab behind
    emailBtn1.removeAttribute("target");
    emailBtn2.removeAttribute("target");
  }

  // Update email links live as user types in the inputs
  [nameInput, regNoInput, eventInput].forEach(input => {
    input.addEventListener("input", () => {
      if (emailSection.style.display !== "none") {
        updateEmailLinks(selectedDate.innerText);
      }
    });
  });

  closeBtn.onclick = () => popup.style.display = "none";
});
