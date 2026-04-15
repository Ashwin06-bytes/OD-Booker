document.addEventListener("DOMContentLoaded", () => {

  const MAX_SLOTS = 5;

  const nameInput = document.getElementById("name-input");
  const eventInput = document.getElementById("event-input");
  const saveBtn = document.getElementById("save-btn");

  const daysContainer = document.querySelector(".days"),
    nextBtn = document.querySelector(".next-btn"),
    prevBtn = document.querySelector(".prev-btn"),
    month = document.querySelector(".month"),
    todayBtn = document.querySelector(".today-btn");

  const popup = document.getElementById("popup");
  const selectedDate = document.getElementById("selected-date");
  const closeBtn = document.querySelector(".close-btn");
  const popupList = document.getElementById("popup-list");

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  let selectedDay = null;
  let events = JSON.parse(localStorage.getItem("events")) || {};

  const date = new Date();
  let currentMonth = date.getMonth();
  let currentYear = date.getFullYear();

  // 🔥 RENDER CALENDAR
  function renderCalendar() {
    date.setDate(1);

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const lastDayIndex = lastDay.getDay();
    const lastDayDate = lastDay.getDate();
    const prevLastDay = new Date(currentYear, currentMonth, 0);
    const prevLastDayDate = prevLastDay.getDate();
    const nextDays = 7 - lastDayIndex - 1;

    month.innerHTML = `${months[currentMonth]} ${currentYear}`;

    let days = "";

    // 📅 TODAY OBJECT
    const today = new Date();
    today.setHours(0,0,0,0);

    // prev days
    for (let x = firstDay.getDay(); x > 0; x--) {
      days += `<div class="day prev">${prevLastDayDate - x + 1}</div>`;
    }

    // current days
    for (let i = 1; i <= lastDayDate; i++) {

      const key = `${i}-${currentMonth}-${currentYear}`;
      let dayClass = "day";

      const currentDateObj = new Date(currentYear, currentMonth, i);

      // ❌ PAST DATE DISABLE
      if (currentDateObj < today) {
        dayClass += " disabled-day";
      }

      let count = events[key] ? events[key].length : 0;

      // 🎨 COLOR
      if (count >= MAX_SLOTS) {
        dayClass += " full-day";
      } else if (count > 0) {
        dayClass += " partial-day";
      }

      // TODAY highlight
      if (
        i === new Date().getDate() &&
        currentMonth === new Date().getMonth() &&
        currentYear === new Date().getFullYear()
      ) {
        dayClass += " today";
      }

      let namesHTML = "";

      // ✅ NAMES WITH COMMA
      if (events[key]) {
        const names = events[key].map(item => item.name).join(", ");
        namesHTML += `<div class="name-row">${names}</div>`;
        namesHTML += `<small>${count}/${MAX_SLOTS} slots</small>`;
      }

      days += `
        <div class="${dayClass}">
          <div>${i}</div>
          ${namesHTML}
        </div>
      `;
    }

    // next days
    for (let j = 1; j <= nextDays; j++) {
      days += `<div class="day next">${j}</div>`;
    }

    hideTodayBtn();
    daysContainer.innerHTML = days;
  }

  renderCalendar();

  // 🔁 NAVIGATION
  nextBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });

  prevBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });

  todayBtn.addEventListener("click", () => {
    currentMonth = date.getMonth();
    currentYear = date.getFullYear();
    renderCalendar();
  });

  function hideTodayBtn() {
    todayBtn.style.display =
      currentMonth === new Date().getMonth() &&
      currentYear === new Date().getFullYear()
        ? "none"
        : "flex";
  }

  // 📅 CLICK DAY
  daysContainer.addEventListener("click", (e) => {

    const dayElement = e.target.closest(".day");

    if (
      dayElement &&
      !dayElement.classList.contains("prev") &&
      !dayElement.classList.contains("next")
    ) {

      const dayValue = parseInt(dayElement.querySelector("div").innerText);

      const selectedDateObj = new Date(currentYear, currentMonth, dayValue);

      const today = new Date();
      today.setHours(0,0,0,0);

      // ❌ BLOCK PAST
      if (selectedDateObj < today) {
        alert("Cannot book past dates");
        return;
      }

      selectedDay = `${dayValue}-${currentMonth}-${currentYear}`;

      selectedDate.innerText = `${dayValue} ${months[currentMonth]} ${currentYear}`;

      nameInput.value = "";
      eventInput.value = "";

      popupList.innerHTML = "";

      if (events[selectedDay]) {
        events[selectedDay].forEach((item, index) => {
          popupList.innerHTML += `
            <div class="name-row">
              ${item.name}
              <span class="delete-mark" data-index="${index}">×</span>
            </div>
          `;
        });

        popupList.innerHTML += `<p>${events[selectedDay].length}/${MAX_SLOTS} filled</p>`;
      }

      popup.style.display = "flex";
    }
  });

  // ❌ DELETE
  popupList.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-mark")) {

      const index = e.target.getAttribute("data-index");

      events[selectedDay].splice(index, 1);

      if (events[selectedDay].length === 0) {
        delete events[selectedDay];
      }

      localStorage.setItem("events", JSON.stringify(events));

      renderCalendar();
      popup.style.display = "none";
    }
  });

  // 💾 SAVE
  saveBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const eventText = eventInput.value.trim();

    if (!name || !eventText) {
      alert("Enter name and event");
      return;
    }

    if (!events[selectedDay]) {
      events[selectedDay] = [];
    }

    // 🚫 DUPLICATE
    const exists = events[selectedDay].some(
      item => item.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      alert("Name already exists!");
      return;
    }

    // 🚫 LIMIT
    if (events[selectedDay].length >= MAX_SLOTS) {
      alert("Slot full!");
      return;
    }

    events[selectedDay].push({
      name: name,
      event: eventText
    });

    localStorage.setItem("events", JSON.stringify(events));

    popup.style.display = "none";
    nameInput.value = "";
    eventInput.value = "";

    renderCalendar();
  });

  // ❌ CLOSE
  closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.style.display = "none";
    }
  });

});