# OD Booker 📅

OD Booker is a premium, lightweight On-Duty (OD) slot booking application designed for college students and faculty. It streamlines the request, tracking, and reporting of On-Duty claims, allowing students to check slot availability, book slots, and generate structured PDF reports.

---

## 🏗️ Architecture & Stack

The application follows a modern serverless-hybrid architecture consisting of three main parts:

1. **Frontend (Client Web App)**: 
   - Built using standard semantic **HTML5**, custom **Vanilla CSS**, and **Vanilla Javascript**.
   - Interfaces with the Google Apps Script Web App for slot reading/booking, and the Python Flask backend for report generation.
   - Styled with custom gradients, dynamic state animations (hover/tap), Google Fonts (Poppins), and FontAwesome icons.

2. **Database & API Layer (Google Sheets + Apps Script)**:
   - Uses Google Sheets as a database to store student name, register number, and event details.
   - Google Apps Script (`appscript.txt`) acts as a serverless JSON Web App endpoint that processes `GET` and `POST` requests to list bookings, validate inputs, check duplicates, write records, and sort data.
   - Formats sheet tables automatically by month and year.

3. **Report Generation Service (Python Flask Microservice)**:
   - A Flask app located under [backend/app.py](file:///d:/vs%20code/OD_booker/backend/app.py) handles generation of official PDF reports.
   - Uses `pandas` to query and filter the Google Sheets data, and `reportlab` to render formatted tables, alternating row colors, total summaries, and branding in the PDF footer.

---

## ✨ Features

- **Visual Monthly Calendar**: A responsive grid showing the current month's dates, which can be navigated using next/prev buttons.
- **Dynamic Slot Indicators**:
  - 🟢 **Green (Partial Day)**: Slots are occupied but some of the 5 slots are still available.
  - 🔴 **Red (Full Day)**: All 5 slots are fully booked.
  - 🟡 **Yellow (Past Dates)**: Days that have already occurred and had active bookings.
- **Input Validation**: Strict browser-level checks including enforcing exactly an 11-digit register number and preventing duplicate submissions for the same user on the same day.
- **Optimistic UI Updates**: Immediately updates the frontend calendar upon successful submission and pauses automatic synchronization for 6 seconds to prevent network lag from wiping state updates.
- **Auto-Syncing**: Refreshes calendar slots every 10 seconds.
- **Email Request Fallback**: When a date reaches the maximum capacity (5 slots), the system hides the "Save" button and displays pre-filled `mailto:` request links to authorities (`25cb049@drngpit.ac.in` and `25cb004@drngpit.ac.in`).
- **Flexible PDF Exports**:
  - Filter by **Specific Date**
  - Filter by **Name + Date Range**
  - Filter by **Monthly Report**

---

## 📁 Repository Structure

```
OD_booker/
├── backend/
│   ├── app.py             # Flask PDF report generator
│   └── requirements.txt   # Python package dependencies
├── index.html             # UI layout and structure
├── style.css              # Custom styling, fonts, and responsiveness
├── script.js              # Calendar renderer, API handlers, validation
├── appscript.txt          # Google Apps Script code for spreadsheet syncing
├── logo.png               # Powered-by Branding logo
└── README.md              # Project Documentation
```

---

## 🚀 Setup & Deployment

### 1. Google Apps Script Setup
1. Create a Google Sheet to store data.
2. Open **Extensions > Apps Script** in the sheet.
3. Paste the contents of `appscript.txt` into the editor.
4. Deploy the script as a **Web App**:
   - **Execute as**: Me
   - **Who has access**: Anyone
5. Copy the deployment URL and replace `API_URL` in [script.js](file:///d:/vs%20code/OD_booker/script.js) and `API_URL` in [backend/app.py](file:///d:/vs%20code/OD_booker/backend/app.py).

### 2. Running the Python Backend Locally
1. Navigate to the `backend` directory.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows (Powershell/Cmd):
   venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   python app.py
   ```
   The API will listen at `http://localhost:5000`. Set `FLASK_API_URL` in [script.js](file:///d:/vs%20code/OD_booker/script.js) to point to this url or your hosted service (e.g. Render).

### 3. Running the Frontend
Simply open [index.html](file:///d:/vs%20code/OD_booker/index.html) in a modern web browser or serve it using a local development server (like VS Code Live Server or python's `http.server`).
