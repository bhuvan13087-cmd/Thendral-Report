/**
 * PDF Exporter & Print Orchestrator
 * Provides direct high-resolution print-to-PDF and downloadable document rendering
 * Strictly adheres to Single Source of Truth: forces synchronization from app.currentData
 */

const PDFExporter = {
  // Triggers browser print-to-pdf dialog with optimized page styling
  printToPDF() {
    // Force final state synchronization before printing
    if (typeof window !== 'undefined' && window.app && typeof window.app.syncFormToCurrentData === 'function') {
      window.app.syncFormToCurrentData();
      window.app.renderPreview();
    }
    // Ensure all images and SVGs are loaded prior to printing
    window.print();
  },

  // Wait for all images and web fonts inside container to resolve
  async waitForImages(container) {
    if (!container) return;
    const images = Array.from(container.querySelectorAll('img'));
    const promises = images.map(img => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 2000); // 2s safety timeout per image
      });
    });
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      promises.push(document.fonts.ready);
    }
    await Promise.all(promises);
  },

  // Generates standalone PDF download using html2pdf if available or initiates print
  async downloadPDF(elementId = 'report-preview-container', filename = null) {
    // Force final state synchronization before generating PDF
    if (typeof window !== 'undefined' && window.app && typeof window.app.syncFormToCurrentData === 'function') {
      try {
        window.app.syncFormToCurrentData();
        window.app.renderPreview();
      } catch (e) {
        console.warn('Form sync notice before PDF export:', e);
      }
    }

    if (!filename) {
      const meta = (window.app && window.app.currentData && window.app.currentData.meta) || {};
      filename = `${meta.reportDocNo || 'TWT-10826'}_${meta.edition || 'A'}.pdf`;
    }

    const reportElement = document.getElementById(elementId);
    if (!reportElement) {
      alert('Report preview container not found.');
      return;
    }

    // Save current transform/zoom state
    const originalTransform = reportElement.style.transform;
    reportElement.style.transform = 'none';

    // Show loading indicator
    const btn = document.getElementById('btn-download-pdf');
    const origText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-icon"></span> Generating High-Res PDF...`;
    }

    try {
      // Ensure all images and fonts are completely loaded before capturing canvas
      await this.waitForImages(reportElement);

      reportElement.classList.add('pdf-export-mode');

      if (window.html2pdf) {
        const pages = Array.from(reportElement.querySelectorAll('.report-page'));
        
        const opt = {
          margin: 0,
          filename: filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { 
            scale: 2, 
            useCORS: true, 
            letterRendering: true, 
            scrollY: 0, 
            scrollX: 0, 
            logging: false,
            windowWidth: 794,
            width: 794
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
        };

        if (pages.length <= 1) {
          // Single-page PDF generation
          await window.html2pdf().set(opt).from(reportElement).save();
        } else {
          // Multi-page enterprise pipeline: render page-by-page to avoid browser GPU canvas memory/dimension overflow
          const firstWorker = window.html2pdf().set(opt);
          await firstWorker.from(pages[0]).toPdf();
          const pdf = await firstWorker.get('pdf');

          for (let i = 1; i < pages.length; i++) {
            if (btn) {
              btn.innerHTML = `<span class="spinner-icon"></span> Rendering Page ${i + 1} of ${pages.length}...`;
            }
            const pageWorker = window.html2pdf().set(opt);
            await pageWorker.from(pages[i]).toCanvas();
            const canvas = await pageWorker.get('canvas');
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
          }

          pdf.save(filename);
        }
      } else {
        // Fallback to high-res system print dialog
        window.print();
      }
    } catch (err) {
      console.error('PDF export error:', err);
      // Fallback
      window.print();
    } finally {
      // Remove export mode class and restore transform/zoom state
      reportElement.classList.remove('pdf-export-mode');
      reportElement.style.transform = originalTransform;
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    }
  },

  // Exports current application data state as a JSON file
  exportJSON(data, filename = 'wind_turbine_report_data.json') {
    if (typeof window !== 'undefined' && window.app && typeof window.app.syncFormToCurrentData === 'function') {
      window.app.syncFormToCurrentData();
    }
    const currentData = (window.app && window.app.currentData) || data;
    const jsonStr = JSON.stringify(currentData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Imports JSON file into the report state
  importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          resolve(parsed);
        } catch (err) {
          reject(new Error('Invalid JSON file format.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read JSON file.'));
      reader.readAsText(file);
    });
  }
};

// Listen for browser print shortcut (Cmd+P / Ctrl+P / browser print)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeprint', () => {
    if (window.app && typeof window.app.syncFormToCurrentData === 'function') {
      window.app.syncFormToCurrentData();
      window.app.renderPreview();
    }
  });
  window.PDFExporter = PDFExporter;
}
if (typeof module !== 'undefined') module.exports = { PDFExporter };

