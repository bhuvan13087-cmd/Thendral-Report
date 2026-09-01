# Thendral Wind Turbine Service Report Suite

A professional, enterprise-grade **Wind Turbine Service Report & Borescope Inspection System** with Firebase Authentication, real-time Cloud Firestore persistence, guided multi-step field workflow, and high-resolution multi-page PDF export.

---

## Features

- **Guided 3-Stage Field Workflow** — Report & Asset Info → Technical Inspection → Findings & PDF
- **Firebase Cloud Sync** — All reports saved to Cloud Firestore in real-time; works offline with IndexedDB fallback
- **Role-Based Access Control** — Admin, Engineer, Reviewer roles with Firestore Security Rules
- **User Management** — Admins can create/manage team users directly from the application
- **Borescope Photo Evidence Hub** — Live camera capture, structured inspection photo slots, auto-compression
- **Bearing & Gear Health Matrix** — 1-click status assessment (Acceptable / Caution / Not Acceptable)
- **Digital Signatures** — Touchscreen signature pad for field engineer & technical reviewer
- **High-Resolution PDF Export** — Pixel-perfect A4 multi-page PDF via html2pdf or browser print
- **30-Day Retention Policy** — Automatic cleanup of expired reports from local IndexedDB cache

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript (no framework) |
| Authentication | Firebase Authentication (Email/Password) |
| Database | Cloud Firestore |
| Storage | Firebase Cloud Storage (photos/signatures) |
| PDF Generation | html2pdf.js + browser print-to-PDF |
| Local Cache | IndexedDB (ThendralWindDB) |

---

## Project Structure

```
Thendral PDF Script/
├── index.html               # Main application entry point
├── favicon.ico              # Application favicon
├── html2pdf.bundle.min.js   # Bundled PDF generation library
├── build_standalone.py      # Script to generate offline standalone HTML
├── firestore.rules          # Production Firestore Security Rules
├── storage.rules            # Production Firebase Storage Rules
├── package.json
├── assets/
│   ├── logo.png
│   ├── logo_horizontal.png
│   ├── logo_icon.png
│   ├── logo_text.png
│   ├── favicon.png
│   └── html2pdf.bundle.min.js
├── js/
│   ├── app.js               # Main DashboardApp controller
│   ├── firebase-service.js  # Firebase Auth / Firestore / Storage service layer
│   ├── report-template.js   # HTML→PDF report template builder
│   ├── pdf-exporter.js      # PDF export orchestrator
│   ├── photo-manager.js     # Photo upload, compression, IndexedDB
│   ├── camera-manager.js    # Live camera capture
│   ├── diagrams.js          # Gearbox SVG diagram renderer
│   ├── sample-data.js       # Blank/template report data structures
│   └── logo-data.js         # Embedded logo Base64 data
└── styles/
    ├── main.css             # Application stylesheet
    └── print.css            # Print & PDF export stylesheet
```

---

## Running Locally

```bash
# Clone the repository
git clone https://github.com/bhuvan13087-cmd/Thendral-Report.git
cd Thendral-Report

# Start a local static server (Python 3 required)
python3 -m http.server 8080

# Open in browser
open http://localhost:8080
```

> **Important:** The application requires a live HTTP server. Opening `index.html` directly as a `file://` URL will fail due to CORS restrictions on Firebase SDK.

---

## Firebase Configuration

The Firebase client configuration is embedded in [`js/firebase-service.js`](js/firebase-service.js). The Firebase Web SDK API key is **not a secret** — it is intentionally public and protected by [Firestore Security Rules](firestore.rules) and [Storage Rules](storage.rules).

> **Server-side operations** (if any) must use a Firebase Admin SDK service account JSON stored as an environment variable or a CI/CD secret — **never committed to the repository**.

---

## Building the Offline Standalone File

To generate a fully self-contained single-file offline HTML (no server required):

```bash
python3 build_standalone.py
```

This produces `THENDRAL_WIND_SERVICES_SERVICE_REPORT.html` — a portable standalone file that embeds all CSS, JS, fonts, and images. The standalone file is excluded from Git (see `.gitignore`) as it is a build artifact.

---

## Deployment

This is a **static web application** — it can be deployed to any static hosting service:

| Host | Command |
|------|---------|
| Firebase Hosting | `firebase deploy --only hosting` |
| GitHub Pages | Push to `gh-pages` branch |
| Netlify | Connect repo → auto-deploy `index.html` |
| Vercel | Connect repo → auto-deploy |

Ensure the **Firebase Authentication**, **Firestore**, and **Storage** services are enabled in your Firebase Console for the configured project.

---

## Firestore Security Rules

Production security rules are in [`firestore.rules`](firestore.rules). Deploy with:

```bash
firebase deploy --only firestore:rules
```

---

## License

MIT — Thendral Wind Power Services
