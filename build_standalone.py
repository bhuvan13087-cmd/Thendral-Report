import os
import base64
import json
import shutil

print("Building Standalone Thendral_Wind_Service_Report.html...")

# 1. Base64 Favicon
with open('assets/favicon.png', 'rb') as f:
    fav_b64 = base64.b64encode(f.read()).decode('utf-8')
    favicon_data_uri = f"data:image/png;base64,{fav_b64}"

# 2. Base64 Logos
with open('assets/logo_horizontal.png', 'rb') as f:
    logo_h_b64 = base64.b64encode(f.read()).decode('utf-8')
    logo_horizontal_uri = f"data:image/png;base64,{logo_h_b64}"

with open('assets/logo.png', 'rb') as f:
    logo_v_b64 = base64.b64encode(f.read()).decode('utf-8')
    logo_vertical_uri = f"data:image/png;base64,{logo_v_b64}"

# 3. Read CSS files
with open('styles/main.css', 'r') as f:
    main_css = f.read()

with open('styles/print.css', 'r') as f:
    print_css = f.read()

# Additional CSS for Multi-Report Archive Drawer & Revision UI
additional_css = """
/* Reports Manager Archive Modal */
.reports-manager-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  max-height: 55vh;
  overflow-y: auto;
  padding-right: 4px;
}

.report-record-card {
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.15s ease;
}

.report-record-card:hover {
  border-color: var(--primary);
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.report-record-card.is-active-report {
  border-color: var(--primary);
  border-left: 4px solid var(--primary);
  background: #f0f9ff;
}

.report-record-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.report-record-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.report-record-doc-no {
  font-family: var(--font-mono);
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--primary-hover);
}

.report-record-edition-badge {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 6px;
  background: #e0f2fe;
  color: var(--primary-dark);
  border-radius: 4px;
}

.report-record-meta-row {
  font-size: 0.78rem;
  color: var(--text-muted);
  display: flex;
  gap: 12px;
}

.report-record-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.search-input-wrap {
  position: relative;
  margin-bottom: 14px;
}
"""

combined_css = main_css + "\n\n/* Thendral Report Document & Print Styles */\n" + print_css + "\n\n" + additional_css

# 4. Read JavaScript Components
with open('html2pdf.bundle.min.js', 'r') as f:
    html2pdf_js = f.read()

with open('js/diagrams.js', 'r') as f:
    diagrams_js = f.read()

with open('js/camera-manager.js', 'r') as f:
    camera_manager_js = f.read()

with open('js/photo-manager.js', 'r') as f:
    photo_manager_js = f.read()

with open('js/sample-data.js', 'r') as f:
    sample_data_js = f.read()

with open('js/report-template.js', 'r') as f:
    report_template_js = f.read()

with open('js/pdf-exporter.js', 'r') as f:
    pdf_exporter_js = f.read()

with open('js/app.js', 'r') as f:
    app_js = f.read()

# Enhanced Multi-Report IndexedDB Storage & Revision Engine in JavaScript
multi_report_db_js = """
// Unified ThendralWindDB Local-First Engine
window.ThendralDB = window.ReportDB;
"""

app_extensions_js = """
// Standalone extensions integrated directly into DashboardApp in app.js
"""

# Read firebase-service.js if present
firebase_service_js = ""
if os.path.exists('js/firebase-service.js'):
    with open('js/firebase-service.js', 'r') as f:
        firebase_service_js = f.read()

import re

# Read index.html as base HTML structure
with open('index.html', 'r') as f:
    html_content = f.read()

# Replace head links with embedded styles and favicon
# 1. Favicon:
html_content = re.sub(
    r'<link rel="icon"[^>]*>\s*<link rel="shortcut icon"[^>]*>',
    f'<link rel="icon" type="image/png" href="{favicon_data_uri}">\n  <link rel="shortcut icon" href="{favicon_data_uri}">',
    html_content
)

# 2. Replace stylesheets and CDN scripts with self-contained CSS:
html_content = re.sub(
    r'<!-- Application Stylesheets -->[\s\S]*?</head>',
    lambda m: f'<!-- Self-Contained Offline Stylesheet -->\n  <style>\n{combined_css}\n  </style>\n</head>',
    html_content
)

# Strip any stray CDN script tags in head
html_content = re.sub(r'<script src="https://cdnjs.cloudflare.com[^>]*></script>', '', html_content)

# 3. Replace image references with embedded base64 Data URIs
html_content = html_content.replace('src="assets/logo_horizontal.png"', f'src="{logo_horizontal_uri}"')
html_content = html_content.replace('src="assets/logo.png"', f'src="{logo_vertical_uri}"')

# 4. Replace script tags at bottom with single embedded offline script bundle
embedded_js_bundle = f"""
  <!-- Embedded Offline PDF Generator Bundle -->
  <script>
{html2pdf_js}
  </script>

  <!-- Embedded Application Logic & Modules -->
  <script>
    // Embedded Official Logos
    window.THENDRAL_LOGO_HORIZONTAL = "{logo_horizontal_uri}";
    window.THENDRAL_LOGO_VERTICAL = "{logo_vertical_uri}";

{firebase_service_js}

{diagrams_js}

{camera_manager_js}

{photo_manager_js}

{sample_data_js}

{multi_report_db_js}

{report_template_js}

{pdf_exporter_js}

{app_js}

{app_extensions_js}
  </script>
"""

html_content = re.sub(
    r'<!-- FIREBASE PRODUCTION SDKS[\s\S]*?</body>',
    lambda m: f'<!-- Embedded Application Bundle -->\n{embedded_js_bundle}\n</body>',
    html_content
)
html_content = re.sub(
    r'<!-- APPLICATION SCRIPTS -->[\s\S]*?</body>',
    lambda m: f'<!-- Embedded Application Bundle -->\n{embedded_js_bundle}\n</body>',
    html_content
)

# Save final standalone build into dist/ and project root for direct access
os.makedirs("dist", exist_ok=True)
target_path = os.path.join("dist", "Thendral_Wind_Service_Report.html")
with open(target_path, "w") as f:
    f.write(html_content)

# Also write to root for direct local opening
with open("THENDRAL_WIND_SERVICES_SERVICE_REPORT.html", "w") as f:
    f.write(html_content)

with open("Thendral_Wind_Service_Report.html", "w") as f:
    f.write(html_content)

print(f"Generated standalone distribution build successfully ({os.path.getsize(target_path) / 1024:.1f} KB).")

# Copy to user's Downloads folder for offline distribution
try:
    downloads_path = "/Users/sribhuvan/Downloads/THENDRAL_WIND_SERVICES_SERVICE_REPORT.html"
    shutil.copy(target_path, downloads_path)
    shutil.copy(target_path, "/Users/sribhuvan/Downloads/Thendral_Wind_Service_Report.html")
    print(f"Copied to {downloads_path} successfully.")
except Exception as e:
    print(f"Notice: Could not copy to Downloads folder ({e}).")


