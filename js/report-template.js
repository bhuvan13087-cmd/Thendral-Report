/**
 * Thendral Wind Turbine Service Report Suite - Premium OEM Technical Report Builder
 * Standard: DNV-GL / TÜV Rheinland / Vestas / ZF Wind Power Multi-Page Specification
 * Unified 1:1 A4 Flow-Based Pagination Engine for Live Preview & High-Resolution PDF Download
 */

class ReportTemplate {

  /**
   * Safe data formatter helper to prevent undefined / null / NaN
   */
  static safeVal(val, defaultVal = '') {
    if (val === undefined || val === null || (typeof val === 'number' && isNaN(val))) {
      return defaultVal;
    }
    const s = String(val).trim();
    return s.length > 0 ? s : defaultVal;
  }

  /**
   * Interactive inline editable field wrapper for PDF preview
   */
  static ed(value, dataPath, type = 'text', customStyle = '') {
    const val = value !== undefined && value !== null ? value : '';
    return `<span class="preview-editable" data-edit-path="${dataPath}" data-edit-type="${type}" ${customStyle ? `style="${customStyle}"` : ''}>${val}</span>`;
  }

  /**
   * Status Badge Helper for Decision Vocabulary (with interactive decision binding)
   */
  static renderStatusBadge(status, dataDecisionPath = '') {
    const s = (status || 'Acceptable').toLowerCase().trim();
    let badgeHtml = '';
    if (s.includes('not') || s.includes('reject') || s.includes('defect') || s === 'scrap' || s.includes('scrap')) {
      badgeHtml = `<span class="status-badge badge-not-acceptable">${status ? status.toUpperCase() : '✕ NOT ACCEPTABLE'}</span>`;
    } else if (s === 'replace' || s.includes('replace')) {
      badgeHtml = `<span class="status-badge badge-not-acceptable">🔄 ${status.toUpperCase()}</span>`;
    } else if (s.includes('caut') || s.includes('regrind') || s.includes('rework') || s.includes('oversize') || s.includes('flip')) {
      badgeHtml = `<span class="status-badge badge-caution">⚠️ ${status.toUpperCase()}</span>`;
    } else if (s.includes('monitor')) {
      badgeHtml = '<span class="status-badge badge-caution">👁️ MONITOR</span>';
    } else if (s.includes('further') || s.includes('inspect')) {
      badgeHtml = '<span class="status-badge badge-caution" style="background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe;">🔍 FURTHER INSPECTION</span>';
    } else if (s === 'reuse') {
      badgeHtml = '<span class="status-badge badge-acceptable">✓ REUSE</span>';
    } else {
      badgeHtml = `<span class="status-badge badge-acceptable">✓ ${status ? status.toUpperCase() : 'ACCEPTABLE'}</span>`;
    }

    if (dataDecisionPath) {
      return `<span class="preview-decision-wrap" data-edit-decision="${dataDecisionPath}" data-current-val="${status || 'Acceptable'}" title="Click in Edit Preview mode to cycle decision">${badgeHtml}</span>`;
    }
    return badgeHtml;
  }

  /**
   * Builds the complete multi-page HTML document structure with dynamic A4 pagination
   */
  static renderFullReport(data) {
    if (!data) return '<div style="padding: 20px; color: #dc2626; font-weight: 700; text-align: center;">No report data loaded.</div>';

    // 1. Process uploaded photos for Photo Evidence section (Exclude only Report Info Cover Photo)
    const uploadedPhotos = (data.photos || []).filter(p => {
      if (!p || !p.url || typeof p.url !== 'string' || p.url.trim().length === 0) return false;
      if (p.slotId === 'slot_gearbox_cover' || p.sectionId === 'report-info') return false;
      return true;
    });
    const customSlots = data.customSlots || [];
    const sortedPhotos = typeof PhotoManager !== 'undefined' && PhotoManager.sortPhotosForReport 
      ? PhotoManager.sortPhotosForReport(uploadedPhotos, customSlots)
      : uploadedPhotos;
    const photoPages = this.calculatePhotoPagesLayout(sortedPhotos);

    // 2. Prepare content blocks for dynamic page packing
    const blocks = [];

    // Block 1: General Info & Work Summary
    blocks.push({
      id: 'general-info',
      title: 'GENERAL INFORMATION & TURBINE DATA',
      html: this.getBlockGeneralInfo(data),
      heightMm: 78
    });

    // Block 2: Turbine Specifications
    blocks.push({
      id: 'turbine-specs',
      title: 'GENERAL INFORMATION & TURBINE DATA',
      html: this.getBlockTurbineSpecs(data),
      heightMm: 45
    });

    // Block 3: Lubrication & Filtration Evaluation
    blocks.push({
      id: 'lubrication',
      title: 'LUBRICATION SYSTEM & OPERATING CONDITION',
      html: this.getBlockLubrication(data),
      heightMm: 72
    });

    // Block 4: Component Health Assessment & Bearings Condition
    const bearings = data.bearingAssessment || [];
    const bearingRowsCount = bearings.length;
    blocks.push({
      id: 'bearings',
      title: 'BEARING CONDITION & HEALTH ASSESSMENT',
      html: this.getBlockBearings(data),
      heightMm: Math.max(65, 45 + (bearingRowsCount * 5.5))
    });

    // Block 5: Housing Bores (only if data exists)
    const bores = data.boreAssessment || [];
    if (bores.length > 0) {
      blocks.push({
        id: 'bores',
        title: 'BEARING & HOUSING BORE ASSESSMENT',
        html: this.getBlockBores(data),
        heightMm: 22 + (bores.length * 5.5)
      });
    }

    // Block 6: Gear Flanks, Shafts & Auxiliary Inspections
    const gears = data.gearAssessment || [];
    const shafts = data.shaftAssessment || [];
    const customs = data.customInspections || [];
    const gearRowsCount = gears.length + shafts.length + customs.length;
    blocks.push({
      id: 'gears',
      title: 'GEAR TEETH & SHAFT CONDITION ASSESSMENT',
      html: this.getBlockGearsAndAux(data),
      heightMm: Math.max(65, 45 + (gearRowsCount * 5.5))
    });

    // Block 7: Executive Summary & Recommendations
    blocks.push({
      id: 'executive-summary',
      title: 'EXECUTIVE SUMMARY & RECOMMENDATIONS',
      html: this.getBlockExecutiveSummary(data),
      heightMm: 60
    });

    // Block 8: Appendix - List of Definitions
    blocks.push({
      id: 'appendix-definitions',
      title: 'APPENDIX - LIST OF DEFINITIONS',
      html: this.getBlockAppendixDefinitions(data),
      heightMm: 78
    });

    // Block 11: Legal Terms & Standards Compliance
    blocks.push({
      id: 'legal-standards',
      title: 'LEGAL NOTICES & QUALITY STANDARDS',
      html: this.getBlockLegalAndStandards(data),
      heightMm: 85
    });

    // 3. Dynamic Page Packing Engine (Max 238mm printable height per A4 body page)
    const MAX_PAGE_BODY_HEIGHT = 238;
    const bodyPages = [];
    let currentPageBlocks = [];
    let currentPageHeight = 0;
    let currentPageTitle = '';

    blocks.forEach((block) => {
      if (currentPageBlocks.length > 0 && (currentPageHeight + block.heightMm > MAX_PAGE_BODY_HEIGHT)) {
        bodyPages.push({
          blocks: currentPageBlocks,
          subTitle: currentPageTitle || 'SERVICE REPORT'
        });
        currentPageBlocks = [];
        currentPageHeight = 0;
        currentPageTitle = '';
      }
      if (currentPageBlocks.length === 0) {
        currentPageTitle = block.title;
      }
      currentPageBlocks.push(block.html);
      currentPageHeight += block.heightMm;
    });

    if (currentPageBlocks.length > 0) {
      bodyPages.push({
        blocks: currentPageBlocks,
        subTitle: currentPageTitle || 'SERVICE REPORT'
      });
    }

    // 4. Calculate total pages
    const totalBodyPages = bodyPages.length;
    const totalPhotoPages = photoPages.length;
    const totalPages = 1 + totalBodyPages + totalPhotoPages;

    let html = '';

    // Page 1: Dedicated Executive Cover Page
    html += this.renderPage1Cover(data, totalPages);

    // Body Pages (Pages 2 to 1 + totalBodyPages)
    bodyPages.forEach((pageInfo, pageIdx) => {
      const pageNum = 2 + pageIdx;
      html += `
        <div class="report-page" id="report-page-${pageNum}">
          ${this.renderHeader(data, 'SERVICE REPORT', pageInfo.subTitle)}

          <div class="page-body-container">
            ${this.renderSidebar(data)}

            <div class="report-page-main">
              ${pageInfo.blocks.join('')}
            </div>
          </div>

          ${this.renderFooter(pageNum, totalPages, data)}
        </div>
      `;
    });

    // Dynamic Photo Pages (Pages only when photos are actually uploaded!)
    if (totalPhotoPages > 0) {
      html += this.renderDynamicPhotoGalleries(data, totalPages, photoPages, sortedPhotos.length, 2 + totalBodyPages);
    }

    return html;
  }

  // ==========================================
  // COMMON CORPORATE HEADER (EVERY PAGE)
  // ==========================================
  static renderHeader(data, title = 'SERVICE REPORT', subtitle = 'GEARBOX INSPECTION') {
    const meta = (data && data.meta) || {};
    const turb = (data && data.turbine) || {};
    const logoSrc = window.THENDRAL_LOGO_HORIZONTAL || 'assets/logo_horizontal.png';

    const docNo = this.safeVal(meta.reportDocNo, '—');
    const edition = this.safeVal(meta.edition, 'A');
    const reportDate = this.safeVal(meta.reportDate, '—');
    const equipNo = this.safeVal(meta.equipmentNo, this.safeVal(turb.turbineNumber, '—'));
    const serialNo = this.safeVal(meta.customerSerialNo, this.safeVal(meta.gearboxPartNo, '—'));
    const turbineId = this.safeVal(turb.turbineNumber, '—');

    return `
      <div class="report-page-header">
        <div class="header-logo-box">
          <img src="${logoSrc}" class="report-brand-logo-img" alt="THENDRAL WIND SERVICES">
        </div>
        <div class="header-center-title">
          <div class="header-company-name">THENDRAL WIND SERVICES</div>
          <div class="header-sub-bar">${subtitle}</div>
        </div>
        <div class="header-right-meta">
          <div class="meta-row">
            <span class="meta-lbl">Turbine / Equip:</span>
            <span class="meta-val font-mono">${equipNo}</span>
          </div>
          <div class="meta-row">
            <span class="meta-lbl">Edition / Rev:</span>
            <span class="meta-val font-mono">${edition}</span>
          </div>
          <div class="meta-row">
            <span class="meta-lbl">Report Date:</span>
            <span class="meta-val">${reportDate}</span>
          </div>
        </div>
      </div>
      <div class="report-doc-id-bar">
        <span class="doc-id-item font-mono">DOC REF: <strong>${docNo}</strong></span>
        <span class="doc-id-sep">•</span>
        <span class="doc-id-item font-mono">TURBINE: <strong>${turbineId}</strong></span>
        <span class="doc-id-sep">•</span>
        <span class="doc-id-item font-mono">GEARBOX S/N: <strong>${serialNo}</strong></span>
        <span class="doc-id-sep">•</span>
        <span class="doc-id-date">REPORT DATE: ${reportDate}</span>
      </div>
    `;
  }

  // ==========================================
  // LEFT SIDEBAR (CLEANED UP FOR CLIENT PDF)
  // ==========================================
  static renderSidebar(data) {
    return '';
  }

  // ==========================================
  // STANDARD PAGE FOOTER WITH DYNAMIC TOTAL PAGES
  // ==========================================
  static renderFooter(pageNum, totalPages, data) {
    const meta = (data && data.meta) || {};
    const company = this.safeVal(meta.companyName, 'Thendral Wind Power Engineering Services Pvt Ltd');
    return `
      <div class="report-page-footer">
        <span class="footer-company-tag">${company} — CONFIDENTIAL TECHNICAL REPORT</span>
        <span class="footer-page-num">Page ${pageNum} of ${totalPages}</span>
      </div>
    `;
  }

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  static renderPage1Cover(data, totalPages = 5) {
    const meta = (data && data.meta) || {};
    const gen = (data && data.generalInfo) || {};
    const turb = (data && data.turbine) || {};

    const docNo = this.safeVal(meta.reportDocNo, '—');
    const edition = this.safeVal(meta.edition, 'A');
    const reportDate = this.safeVal(meta.reportDate, '—');
    const gearboxPart = this.safeVal(meta.gearboxPartNo, '—');
    const gearboxSerial = this.safeVal(meta.customerSerialNo, '—');
    const customer = this.safeVal(gen.customerName, '—');
    const site = this.safeVal(gen.siteName, '—');
    const turbineNo = this.safeVal(turb.turbineNumber, '—');
    const padNo = this.safeVal(turb.padNumber, '');
    const turbineType = this.safeVal(turb.turbineType, '');
    const interventionType = this.safeVal(gen.interventionType, '—');
    const startDate = this.safeVal(gen.startDate, '—');
    const endDate = this.safeVal(gen.endDate, '—');
    const preparedBy = this.safeVal(meta.preparedBy, this.safeVal(gen.inspector, this.safeVal(gen.inspectorName, this.safeVal(gen.serviceEngineer, '—'))));
    const releasedBy = this.safeVal(meta.releasedBy, this.safeVal(gen.reviewer, this.safeVal(gen.reportReviewer, '—')));

    const companyName = this.safeVal(meta.companyName, 'Thendral Wind Power Engineering Services Pvt Ltd');
    const rawCompanyAddress = this.safeVal(meta.companyAddress, 'Thendral Wind Tech LLP Dindigul');
    const companyAddress = (!rawCompanyAddress || rawCompanyAddress === '—' || String(rawCompanyAddress).includes('Kittampalayam') || String(rawCompanyAddress).includes('Coimbatore') || String(rawCompanyAddress).includes('High Tech Engineering') || String(rawCompanyAddress).includes('641659') || String(rawCompanyAddress).includes('Annur'))
      ? 'Thendral Wind Tech LLP Dindigul'
      : rawCompanyAddress;
    const companyPhone = this.safeVal(meta.companyPhone, '+91 4254 30 6000');
    const companyEmail = this.safeVal(meta.companyEmail, 'service.wind@thendral.com');
    const companyWeb = this.safeVal(meta.companyWeb, 'www.thendralwind.com');

    const nameplatePhoto = (data && data.photos && data.photos.length > 0)
      ? data.photos.find(p => p && p.url && (
          p.slotId === 'slot_gearbox_cover' || 
          p.sectionId === 'report-info' || 
          (p.slotId === 'slot_gearbox_nameplate' && p.sectionId !== 'turbine-info' && p.sectionId !== 'turbine-specs')
        ))
      : null;

    return `
      <div class="report-page" id="report-page-1">
        ${this.renderHeader(data, 'TECHNICAL SERVICE REPORT', 'GEARBOX BORESCOPE AUDIT & INSPECTION')}

        <div class="page-body-container">
          ${this.renderSidebar(data)}

          <div class="report-page-main cover-page-main">
            
            ${nameplatePhoto ? `
              <!-- User-Uploaded Gearbox Photo Proof -->
              <div class="cover-illustration-box">
                <img src="${nameplatePhoto.url}" alt="${nameplatePhoto.label || 'Gearbox'}" style="width: 100%; height: auto; max-width: 100%; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              </div>
            ` : ''}

            <div class="cover-title-section">
              <h1 class="cover-doc-title">SERVICE REPORT</h1>
              <div class="cover-gearbox-id">${this.ed(gearboxPart, 'meta.gearboxPartNo')} • ${this.ed(gearboxSerial, 'meta.customerSerialNo')}</div>
            </div>

            <!-- Executive Metadata Table -->
            <table class="cover-meta-summary-table">
              <tr>
                <td class="c-lbl">Customer / Operator:</td>
                <td class="c-val">${this.ed(customer, 'generalInfo.customerName')}</td>
              </tr>
              <tr>
                <td class="c-lbl">Site Name:</td>
                <td class="c-val">${this.ed(site, 'generalInfo.siteName')}</td>
              </tr>
              <tr>
                <td class="c-lbl">Turbine / WTG ID:</td>
                <td class="c-val">${this.ed(turbineNo, 'turbine.turbineNumber')}${padNo && padNo !== '—' ? ` (Pad: ${this.ed(padNo, 'turbine.padNumber')})` : ''}${turbineType && turbineType !== '—' ? ` • ${this.ed(turbineType, 'turbine.turbineType')}` : ''}</td>
              </tr>
              <tr>
                <td class="c-lbl">Service / Intervention Type:</td>
                <td class="c-val">${this.ed(interventionType, 'generalInfo.interventionType')}</td>
              </tr>
              <tr>
                <td class="c-lbl">Intervention Period:</td>
                <td class="c-val">${(startDate && startDate !== '—') || (endDate && endDate !== '—') ? `${this.ed(startDate, 'generalInfo.startDate')} to ${this.ed(endDate, 'generalInfo.endDate')}` : '—'}</td>
              </tr>
              <tr>
                <td class="c-lbl">Lead Field Engineer:</td>
                <td class="c-val">${this.ed(preparedBy, 'meta.preparedBy')}</td>
              </tr>
              <tr>
                <td class="c-lbl">Technical Reviewer / Approver:</td>
                <td class="c-val">${this.ed(releasedBy, 'meta.releasedBy')}</td>
              </tr>
              <tr>
                <td class="c-lbl">Document No. & Edition:</td>
                <td class="c-val">${this.ed(docNo, 'meta.reportDocNo')} • Rev: ${this.ed(edition, 'meta.edition')}</td>
              </tr>
            </table>

            <!-- Legal & Certification Footer Box -->
            <div class="cover-company-box">
              <div class="company-legal-name">${companyName}</div>
              <div class="company-address-line">${this.ed(companyAddress, 'meta.companyAddress')}</div>
              <div class="company-contact-line">
                <span>Tel: ${companyPhone}</span>
                <span class="contact-sep">•</span>
                <span>Email: ${companyEmail}</span>
                <span class="contact-sep">•</span>
                <span>Web: ${companyWeb}</span>
              </div>
            </div>

          </div>
        </div>

        ${this.renderFooter(1, totalPages, data)}
      </div>
    `;
  }

  // ==========================================
  // CONTENT BLOCKS (DYNAMIC FLOW ENGINE)
  // ==========================================

  // Block 1: General Info, Customer Complaint & Work Summary
  static getBlockGeneralInfo(data) {
    const meta = (data && data.meta) || {};
    const gen = (data && data.generalInfo) || {};

    const customer = this.safeVal(gen.customerName, '—');
    const site = this.safeVal(gen.siteName, '—');
    const country = this.safeVal(gen.country, '—');
    const interventionType = this.safeVal(gen.interventionType, '—');
    const preparedBy = this.safeVal(meta.preparedBy, this.safeVal(gen.inspector, this.safeVal(gen.inspectorName, this.safeVal(gen.serviceEngineer, '—'))));
    const releasedBy = this.safeVal(meta.releasedBy, this.safeVal(gen.reviewer, this.safeVal(gen.reportReviewer, '—')));
    const startDate = this.safeVal(gen.startDate, '—');
    const endDate = this.safeVal(gen.endDate, '—');
    const reportDate = this.safeVal(meta.reportDate, '—');
    const complaint = this.safeVal(gen.customerComplaint, '');
    const workPerformed = this.safeVal(gen.workPerformed, '');

    return `
      <div class="report-section">
        <div class="section-title">1. General Information</div>
        <div class="info-grid-2col">
          <div class="info-item"><span class="info-lbl">Customer:</span><span class="info-val font-semibold">${this.ed(customer, 'generalInfo.customerName')}</span></div>
          <div class="info-item"><span class="info-lbl">Site Name:</span><span class="info-val font-semibold">${this.ed(site, 'generalInfo.siteName')}</span></div>
          <div class="info-item"><span class="info-lbl">Country:</span><span class="info-val">${this.ed(country, 'generalInfo.country')}</span></div>
          <div class="info-item"><span class="info-lbl">Intervention Type:</span><span class="info-val font-bold text-primary">${this.ed(interventionType, 'generalInfo.interventionType')}</span></div>
          <div class="info-item"><span class="info-lbl">Service Engineer:</span><span class="info-val font-semibold">${this.ed(preparedBy, 'meta.preparedBy')}</span></div>
          <div class="info-item"><span class="info-lbl">Report Reviewer:</span><span class="info-val font-semibold">${this.ed(releasedBy, 'meta.releasedBy')}</span></div>
          <div class="info-item"><span class="info-lbl">Start Date:</span><span class="info-val">${this.ed(startDate, 'generalInfo.startDate')}</span></div>
          <div class="info-item"><span class="info-lbl">End Date:</span><span class="info-val">${this.ed(endDate, 'generalInfo.endDate')}</span></div>
          <div class="info-item"><span class="info-lbl">Report Date:</span><span class="info-val font-bold">${this.ed(reportDate, 'meta.reportDate')}</span></div>
        </div>

        ${(complaint || gen.complaintCategory || gen.complaintSeverity || gen.scadaAlarmCode) ? `
          <div class="complaint-box" style="margin-top: 1.5mm;">
            <div class="complaint-header-flex" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1mm;">
              <span class="complaint-label font-bold" style="margin-bottom: 0;">Customer Complaint / Reason for Intervention:</span>
              <div style="display: flex; gap: 4px;">
                ${gen.complaintCategory ? `<span class="badge" style="background: #e0f2fe; color: #0369a1; font-size: 6.8pt; font-weight: 700; padding: 1px 6px; border-radius: 3px; border: 0.5px solid #bae6fd;">${this.ed(gen.complaintCategory, 'generalInfo.complaintCategory')}</span>` : ''}
                ${gen.complaintSeverity ? `<span class="badge" style="background: #fef3c7; color: #b45309; font-size: 6.8pt; font-weight: 700; padding: 1px 6px; border-radius: 3px; border: 0.5px solid #fde68a;">${this.ed(gen.complaintSeverity, 'generalInfo.complaintSeverity')}</span>` : ''}
              </div>
            </div>
            <div class="complaint-text" style="font-size: 7.8pt; line-height: 1.35; color: #1e293b;">
              ${this.ed(complaint || 'No specific complaint recorded.', 'generalInfo.customerComplaint', 'textarea')}
              ${gen.scadaAlarmCode ? `<div style="margin-top: 1mm; font-size: 7.2pt; font-family: monospace; color: #475569;"><strong>Trigger / SCADA Reference:</strong> ${this.ed(gen.scadaAlarmCode, 'generalInfo.scadaAlarmCode')}</div>` : ''}
            </div>
          </div>
        ` : ''}

        ${(workPerformed || gen.workExecutionStatus || gen.handoverClearance || gen.workScopeCategory) ? `
          <div class="complaint-box" style="margin-top: 1.5mm; border-left-color: var(--success, #16a34a); background: #f0fdf4;">
            <div class="complaint-header-flex" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1mm;">
              <span class="complaint-label font-bold" style="margin-bottom: 0; color: #15803d;">Work Performed & Service Execution Summary:</span>
              <div style="display: flex; gap: 4px;">
                ${gen.workExecutionStatus ? `<span class="badge" style="background: #dcfce7; color: #166534; font-size: 6.8pt; font-weight: 700; padding: 1px 6px; border-radius: 3px; border: 0.5px solid #bbf7d0;">${this.ed(gen.workExecutionStatus, 'generalInfo.workExecutionStatus')}</span>` : ''}
                ${gen.handoverClearance ? `<span class="badge" style="background: #e0e7ff; color: #3730a3; font-size: 6.8pt; font-weight: 700; padding: 1px 6px; border-radius: 3px; border: 0.5px solid #c7d2fe;">${this.ed(gen.handoverClearance, 'generalInfo.handoverClearance')}</span>` : ''}
              </div>
            </div>
            <div class="complaint-text" style="font-size: 7.8pt; line-height: 1.35; color: #1e293b;">
              ${this.ed(workPerformed || 'Standard service scope executed.', 'generalInfo.workPerformed', 'textarea')}
              ${gen.workScopeCategory ? `<div style="margin-top: 1mm; font-size: 7.2pt; color: #166534;"><strong>Scope Executed:</strong> ${this.ed(gen.workScopeCategory, 'generalInfo.workScopeCategory')} ${gen.workCompletionDate ? `• <strong>Completed:</strong> ${this.ed(gen.workCompletionDate, 'generalInfo.workCompletionDate')}` : ''}</div>` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Block 2: Turbine Specifications
  static getBlockTurbineSpecs(data) {
    const turb = (data && data.turbine) || {};

    return `
      <div class="report-section" style="margin-top: 2mm;">
        <div class="section-title">2. Turbine / Absorption Information</div>
        
        <table class="report-spec-table">
          <tr>
            <td class="tbl-lbl">Turbine Number:</td>
            <td class="tbl-val font-bold">${this.ed(this.safeVal(turb.turbineNumber, '—'), 'turbine.turbineNumber')}</td>
            <td class="tbl-lbl">WTG Pad Number:</td>
            <td class="tbl-val font-bold">${this.ed(this.safeVal(turb.padNumber, '—'), 'turbine.padNumber')}</td>
          </tr>
          <tr>
            <td class="tbl-lbl">Turbine Type / Model:</td>
            <td class="tbl-val font-semibold">${this.ed(this.safeVal(turb.turbineType, '—'), 'turbine.turbineType')}</td>
            <td class="tbl-lbl">Commissioning Date:</td>
            <td class="tbl-val">${this.ed(this.safeVal(turb.commissioningDate, '—'), 'turbine.commissioningDate')}</td>
          </tr>
          <tr>
            <td class="tbl-lbl">Total Production (kWh):</td>
            <td class="tbl-val font-bold">${this.ed(this.safeVal(turb.totalProductionKwh, '—'), 'turbine.totalProductionKwh')}</td>
            <td class="tbl-lbl">Total Run Hours (hrs):</td>
            <td class="tbl-val font-bold">${this.ed(this.safeVal(turb.runHours, '—'), 'turbine.runHours')}</td>
          </tr>
          <tr>
            <td class="tbl-lbl">Generator Name:</td>
            <td class="tbl-val font-semibold" colspan="3">${this.ed(this.safeVal(turb.gen1Manufacturer, '—'), 'turbine.gen1Manufacturer')}</td>
          </tr>
          <tr>
            <td class="tbl-lbl">Run Status Before:</td>
            <td class="tbl-val">
              <span class="status-pill status-${this.safeVal(turb.runStatusBefore, 'normal').toLowerCase()}">${this.ed(this.safeVal(turb.runStatusBefore, '—'), 'turbine.runStatusBefore')}</span>
            </td>
            <td class="tbl-lbl">Run Status Upon Arrival:</td>
            <td class="tbl-val">
              <span class="status-pill status-${this.safeVal(turb.runStatusUponArrival, 'normal').toLowerCase()}">${this.ed(this.safeVal(turb.runStatusUponArrival, '—'), 'turbine.runStatusUponArrival')}</span>
            </td>
          </tr>
          <tr>
            <td class="tbl-lbl">Run Status After:</td>
            <td class="tbl-val">
              <span class="status-pill status-${this.safeVal(turb.runStatusAfter, 'normal').toLowerCase()}">${this.ed(this.safeVal(turb.runStatusAfter, '—'), 'turbine.runStatusAfter')}</span>
            </td>
            <td class="tbl-lbl">Customer Reported State:</td>
            <td class="tbl-val">${this.ed(this.safeVal(turb.customerReportedStatus, '—'), 'turbine.customerReportedStatus')}</td>
          </tr>
        </table>
      </div>
    `;
  }

  // Block 3: Lubrication & Filtration Evaluation
  static getBlockLubrication(data) {
    const lub = (data && data.lubrication) || {};

    const oilBrand = this.safeVal(lub.gearboxOilType, '—');
    const oilLevel = this.safeVal(lub.oilLevelAtInspection, '—');
    const oilVisual = this.safeVal(lub.oilCondition, '—');
    const debrisMagnet = this.safeVal(lub.debrisOnMagnet, '—');
    const debrisFilter = this.safeVal(lub.debrisInFilter, '—');
    const debrisGearbox = this.safeVal(lub.debrisInGearbox, '—');
    const vibrations = this.safeVal(lub.vibrations, '—');
    const noise = this.safeVal(lub.noise, '—');
    const oilCooler = this.safeVal(lub.oilCoolerFunction || lub.oilCoolerCondition, '—');
    const lastOilChange = this.safeVal(lub.dateLastOilChange, '—');
    const lastFilterChange = this.safeVal(lub.dateLastFilterChange, '—');

    return `
      <div class="report-section" style="margin-top: 2mm;">
        <div class="section-title">3. Lubrication & Filtration System Evaluation</div>
        
        <table class="report-spec-table">
          <tr>
            <td class="tbl-lbl">Gearbox Oil Brand & Grade:</td>
            <td class="tbl-val font-bold text-primary">${this.ed(oilBrand, 'lubrication.gearboxOilType')}</td>
            <td class="tbl-lbl">Oil Level at Sight Glass:</td>
            <td class="tbl-val font-bold">${this.ed(oilLevel, 'lubrication.oilLevelAtInspection')}</td>
          </tr>
          <tr>
            <td class="tbl-lbl">Oil Visual Appearance:</td>
            <td class="tbl-val">${this.ed(oilVisual, 'lubrication.oilCondition')}</td>
            <td class="tbl-lbl">Date of Last Oil Change:</td>
            <td class="tbl-val">${this.ed(lastOilChange, 'lubrication.dateLastOilChange')}</td>
          </tr>
          <tr>
            <td class="tbl-lbl">Debris on Magnetic Plug:</td>
            <td class="tbl-val font-bold ${debrisMagnet === 'None' ? 'text-success' : (debrisMagnet === '—' ? '' : 'text-danger')}">${this.ed(debrisMagnet, 'lubrication.debrisOnMagnet')}</td>
            <td class="tbl-lbl">Debris in Filter Housing:</td>
            <td class="tbl-val font-bold ${debrisFilter === 'No' ? 'text-success' : (debrisFilter === '—' ? '' : 'text-danger')}">${this.ed(debrisFilter, 'lubrication.debrisInFilter')}</td>
          </tr>
          <tr>
            <td class="tbl-lbl">Internal Sump Debris:</td>
            <td class="tbl-val">${this.ed(debrisGearbox, 'lubrication.debrisInGearbox')}</td>
            <td class="tbl-lbl">Date of Last Filter Change:</td>
            <td class="tbl-val">${this.ed(lastFilterChange, 'lubrication.dateLastFilterChange')}</td>
          </tr>
          <tr>
            <td class="tbl-lbl">Vibration Signature:</td>
            <td class="tbl-val">${this.ed(vibrations, 'lubrication.vibrations')}</td>
            <td class="tbl-lbl">Acoustic / Meshing Sound:</td>
            <td class="tbl-val">${this.ed(noise, 'lubrication.noise')}</td>
          </tr>
          <tr>
            <td class="tbl-lbl">Oil Cooler & Pump Function:</td>
            <td class="tbl-val">${this.ed(oilCooler, 'lubrication.oilCoolerFunction')}</td>
            <td class="tbl-lbl">Other Detection Oil:</td>
            <td class="tbl-val">${this.ed(this.safeVal(lub.otherDetectionOil, '—'), 'lubrication.otherDetectionOil')}</td>
          </tr>
        </table>

        ${lub.remarksAlignment ? `
          <div class="remarks-callout" style="margin-top: 1.5mm;">
            <div class="remarks-title">Magnetic Plug & Inline Filter Housing Analysis:</div>
            <div class="remarks-text">
              ${this.ed(lub.remarksAlignment, 'lubrication.remarksAlignment', 'textarea')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Block 4: Component Health Assessment & Bearings Condition
  static getBlockBearings(data) {
    const bearings = (data && data.bearingAssessment) || [];

    return `
      <div class="report-section">
        <div class="section-title">4. Condition of Bearings & Health Assessment Criteria</div>
        
        <div class="assessment-definitions-box">
          <div class="def-header">Visual Health Assessment Rating Key:</div>
          <div class="def-row">
            <span class="status-badge badge-acceptable">✓ ACCEPTABLE</span>
            <span class="def-text">Component exhibits normal operating wear; no corrective action required.</span>
          </div>
          <div class="def-row">
            <span class="status-badge badge-caution">⚠️ CAUTION</span>
            <span class="def-text">Minor surface distress, micropitting, or indentation observed. Increased monitoring interval required.</span>
          </div>
          <div class="def-row">
            <span class="status-badge badge-not-acceptable">✕ NOT ACCEPTABLE</span>
            <span class="def-text">Severe spalling, macropitting, crack formation, or geometric failure. Immediate repair/replacement required.</span>
          </div>
        </div>

        <div class="component-group-title">4.1 Bearings Inspection Findings & Decision Matrix</div>
        <table class="report-matrix-table">
          <thead>
            <tr>
              <th style="width: 32%;">BEARING LOCATION</th>
              <th style="width: 48%;">DAMAGE / FINDINGS</th>
              <th style="width: 20%;">DECISION</th>
            </tr>
          </thead>
          <tbody>
            ${bearings.length > 0 ? bearings.map((b, idx) => `
              <tr>
                <td class="font-semibold">${this.ed(this.safeVal(b.location, '-'), `bearingAssessment.${idx}.location`)}</td>
                <td>${this.ed(this.safeVal(b.observation, '—'), `bearingAssessment.${idx}.observation`)}</td>
                <td>${this.renderStatusBadge(b.assessment, `bearingAssessment.${idx}.assessment`)}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="3" style="text-align: center; color: #64748b; padding: 3mm;">No specific bearing damage or defects logged.</td>
              </tr>
            `}
          </tbody>
        </table>

        ${(data && data.bearingRemarks) ? `
          <div class="remarks-callout" style="margin-top: 1.5mm;">
            <div class="remarks-title">Inspector Remarks on Bearings:</div>
            <div class="remarks-text">${this.ed(data.bearingRemarks, 'bearingRemarks', 'textarea')}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Block 5: Housing Bores & Structural Seats (Optional)
  static getBlockBores(data) {
    const bores = (data && data.boreAssessment) || [];
    if (bores.length === 0) return '';

    return `
      <div class="report-section" style="margin-top: 2mm;">
        <div class="section-title">4.3 Housing Bores & Structural Seats</div>
        <table class="report-matrix-table">
          <thead>
            <tr>
              <th style="width: 32%;">BORE LOCATION</th>
              <th style="width: 48%;">DAMAGE / FINDINGS</th>
              <th style="width: 20%;">DECISION</th>
            </tr>
          </thead>
          <tbody>
            ${bores.map((b, bIdx) => `
              <tr>
                <td class="font-semibold">${this.ed(this.safeVal(b.location, '-'), `boreAssessment.${bIdx}.location`)}</td>
                <td>${this.ed(this.safeVal(b.observation, '—'), `boreAssessment.${bIdx}.observation`)}</td>
                <td>${this.renderStatusBadge(b.assessment, `boreAssessment.${bIdx}.assessment`)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Block 6: Gear Flanks, Shafts & Auxiliary Inspections
  static getBlockGearsAndAux(data) {
    const gears = (data && data.gearAssessment) || [];
    const shafts = (data && data.shaftAssessment) || [];
    const customs = (data && data.customInspections) || [];

    return `
      <div class="report-section">
        <div class="section-title">5. Condition of Gears, Shafts & Auxiliary Components</div>
        
        <table class="report-matrix-table">
          <thead>
            <tr>
              <th style="width: 32%;">GEAR MESH STAGE</th>
              <th style="width: 48%;">DAMAGE / FINDINGS</th>
              <th style="width: 20%;">DECISION</th>
            </tr>
          </thead>
          <tbody>
            ${gears.length > 0 ? gears.map((g, gIdx) => `
              <tr>
                <td class="font-semibold">${this.ed(this.safeVal(g.location, '-'), `gearAssessment.${gIdx}.location`)}</td>
                <td>${this.ed(this.safeVal(g.observation, '—'), `gearAssessment.${gIdx}.observation`)}</td>
                <td>${this.renderStatusBadge(g.assessment, `gearAssessment.${gIdx}.assessment`)}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="3" style="text-align: center; color: #64748b; padding: 3mm;">No specific gear mesh distress or defects logged.</td>
              </tr>
            `}
          </tbody>
        </table>

        ${(data && data.gearRemarks) ? `
          <div class="remarks-callout" style="margin-top: 1.5mm;">
            <div class="remarks-title">Inspector Remarks on Gear Meshing:</div>
            <div class="remarks-text">${this.ed(data.gearRemarks, 'gearRemarks', 'textarea')}</div>
          </div>
        ` : ''}

        ${shafts.length > 0 ? `
          <div class="subsection-title" style="margin-top: 1.5mm;">5.2 Shafts & Keyways Evaluation</div>
          <table class="report-matrix-table">
            <thead>
              <tr>
                <th style="width: 32%;">SHAFT POSITION</th>
                <th style="width: 48%;">DAMAGE / FINDINGS</th>
                <th style="width: 20%;">DECISION</th>
              </tr>
            </thead>
            <tbody>
              ${shafts.map((s, sIdx) => `
                <tr>
                  <td class="font-semibold">${this.ed(this.safeVal(s.location, '-'), `shaftAssessment.${sIdx}.location`)}</td>
                  <td>${this.ed(this.safeVal(s.observation, '—'), `shaftAssessment.${sIdx}.observation`)}</td>
                  <td>${this.renderStatusBadge(s.assessment, `shaftAssessment.${sIdx}.assessment`)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${customs.length > 0 ? `
          <div class="subsection-title" style="margin-top: 1.5mm;">5.3 Subsystem & Component Inspection Log</div>
          <table class="report-matrix-table">
            <thead>
              <tr>
                <th style="width: 20%;">CONDITION OF</th>
                <th style="width: 22%;">LOCATION</th>
                <th style="width: 14%;">SEVERITY</th>
                <th style="width: 28%;">DAMAGE / FINDING</th>
                <th style="width: 16%;">DECISION</th>
              </tr>
            </thead>
            <tbody>
              ${customs.map((item, idx) => `
                <tr>
                  <td class="font-semibold">${this.ed(this.safeVal(item.conditionOf, '-'), `customInspections.${idx}.conditionOf`)}</td>
                  <td>${this.ed(this.safeVal(item.location, '-'), `customInspections.${idx}.location`)}</td>
                  <td><span class="badge badge-${(item.severity || 'Normal').toLowerCase()}">${this.ed(this.safeVal(item.severity, 'Normal'), `customInspections.${idx}.severity`)}</span></td>
                  <td>${this.ed(this.safeVal(item.damage || item.remark, '—'), `customInspections.${idx}.damage`)}</td>
                  <td>${this.renderStatusBadge(item.decision, `customInspections.${idx}.decision`)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
      </div>
    `;
  }

  // Block 7: Executive Summary, Recommendations & Signatures
  static getBlockExecutiveSummary(data) {
    const sum = (data && data.summary) || {};
    const meta = (data && data.meta) || {};
    const gen = (data && data.generalInfo) || {};
    const sigs = (data && data.signatures) || {};

    const summaryText = this.safeVal(sum.summaryText, '—');
    const gearboxRec = this.safeVal(sum.gearboxRecommendation, '—');
    const lubricantRec = this.safeVal(sum.lubricantRecommendation, '—');
    const furtherJobs = this.safeVal(sum.furtherJobs, '—');
    const preparedBy = this.safeVal(meta.preparedBy, this.safeVal(gen.inspector, this.safeVal(gen.inspectorName, this.safeVal(gen.serviceEngineer, '—'))));
    const releasedBy = this.safeVal(meta.releasedBy, this.safeVal(gen.reviewer, this.safeVal(gen.reportReviewer, '—')));
    const reportDate = this.safeVal(meta.reportDate, '');

    const hasFurtherJobs = furtherJobs && furtherJobs !== '—';
    const furtherJobsUpper = furtherJobs.toUpperCase();
    const badgeClass = (!hasFurtherJobs) ? 'badge-acceptable' : (furtherJobsUpper.includes('GOOD') || furtherJobsUpper.includes('NO FURTHER') ? 'badge-acceptable' : ((furtherJobsUpper.includes('REPLACE') || furtherJobsUpper.includes('INTERVENTION') || furtherJobsUpper.includes('DEFECT')) ? 'badge-defect' : 'badge-caution'));

    return `
      <div class="report-section">
        <div class="section-title">6. Executive Summary & Authorization</div>
        
        <div class="summary-box">
          <div class="summary-text">${this.ed(summaryText, 'summary.summaryText', 'textarea')}</div>
          ${hasFurtherJobs ? `
            <div class="summary-status-row">
              <span class="status-title">Overall Assessment Rating:</span>
              <span class="status-badge ${badgeClass}">${this.ed(furtherJobs, 'summary.furtherJobs')}</span>
            </div>
          ` : ''}
        </div>

        <div class="subsection-title" style="margin-top: 1.5mm;">6.1 Recommendations & Follow-Up Tasks</div>
        
        <div class="rec-sub-block">
          <div class="rec-title">6.1.1 Gearbox Maintenance Directives</div>
          <div class="rec-box-content">${this.ed(gearboxRec, 'summary.gearboxRecommendation', 'textarea')}</div>
        </div>

        <div class="rec-sub-block" style="margin-top: 1.2mm;">
          <div class="rec-title">6.1.2 Lubrication Directives</div>
          <div class="rec-box-content">${this.ed(lubricantRec, 'summary.lubricantRecommendation', 'textarea')}</div>
        </div>

        ${hasFurtherJobs ? `
          <div class="further-jobs-row" style="margin-top: 1.5mm;">
            <span class="jobs-lbl">Further Jobs Required Status:</span>
            <strong class="text-primary font-mono">${this.ed(furtherJobs, 'summary.furtherJobs')}</strong>
          </div>
        ` : ''}

        <!-- Digital Signatures Authorization Grid -->
        <div class="signatures-grid" style="margin-top: 3.5mm;">
          <div class="sig-column">
            <div class="sig-image-holder">
              ${sigs.engineerSigUrl ? `<img src="${sigs.engineerSigUrl}" class="rendered-sig-img" alt="Lead Engineer Signature">` : ''}
            </div>
            <div class="sig-line"></div>
            <div class="sig-name">${this.ed(preparedBy, 'meta.preparedBy')}</div>
            <div class="sig-role">Lead Field Engineer / Inspector</div>
            ${reportDate ? `<div class="sig-date">Date: ${reportDate}</div>` : ''}
          </div>
          <div class="sig-column">
            <div class="sig-image-holder">
              ${sigs.reviewerSigUrl ? `<img src="${sigs.reviewerSigUrl}" class="rendered-sig-img" alt="Reviewer Signature">` : ''}
            </div>
            <div class="sig-line"></div>
            <div class="sig-name">${this.ed(releasedBy, 'meta.releasedBy')}</div>
            <div class="sig-role">Technical Reviewer / Approver</div>
            ${reportDate ? `<div class="sig-date">Date: ${reportDate}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Block 8: Appendix - List of Definitions
  static getBlockAppendixDefinitions(data) {
    return `
      <div class="report-section">
        <div class="section-title">7. APPENDIX - LIST OF DEFINITIONS</div>
        
        <div class="appendix-grid-2col" style="margin-bottom: 1.5mm;">
          <div class="appendix-item"><span class="app-code font-mono">HSS</span> High Speed Shaft</div>
          <div class="appendix-item"><span class="app-code font-mono">PINION</span> Shaft with Integrated Gear</div>
          <div class="appendix-item"><span class="app-code font-mono">HS-IS</span> High Speed Intermediate Shaft</div>
          <div class="appendix-item"><span class="app-code font-mono">GS</span> Generator Side</div>
          <div class="appendix-item"><span class="app-code font-mono">HS-IG</span> High Speed Intermediate Gear</div>
          <div class="appendix-item"><span class="app-code font-mono">RS</span> Rotor Side</div>
          <div class="appendix-item"><span class="app-code font-mono">LS-IS</span> Low Speed Intermediate Shaft</div>
          <div class="appendix-item"><span class="app-code font-mono">TRB</span> Tapered Roller Bearing</div>
          <div class="appendix-item"><span class="app-code font-mono">LS-IG</span> Low Speed Intermediate Gear</div>
          <div class="appendix-item"><span class="app-code font-mono">CRB</span> Cylindrical Roller Bearing</div>
          <div class="appendix-item"><span class="app-code font-mono">RG</span> Ring Gear</div>
          <div class="appendix-item"><span class="app-code font-mono">IR</span> Inner Ring</div>
          <div class="appendix-item"><span class="app-code font-mono">PP</span> Planet Pin</div>
          <div class="appendix-item"><span class="app-code font-mono">OR</span> Outer Ring</div>
          <div class="appendix-item"><span class="app-code font-mono">PG</span> Planetary Gear</div>
          <div class="appendix-item"><span class="app-code font-mono">WT</span> Within Tolerance</div>
          <div class="appendix-item"><span class="app-code font-mono">PC</span> Planet Carrier</div>
        </div>

        <div style="background: #f8fafc; border-left: 3px solid #0284c7; padding: 1.2mm 2.5mm; margin-bottom: 1.5mm; font-size: 7pt;">
          <strong>Tagging Examples:</strong> <span class="font-mono text-primary">PG2GS_1</span>: Planet Gear Stage 2 Generator Side_Planet 1 • <span class="font-mono text-primary">BPG1GS-GS_3</span>: Bearing Planet gear STG1 GS - GS_Planet 3
        </div>

        <!-- Decisions Table -->
        <div class="subsection-title" style="font-size: 7.6pt; margin-top: 1mm; margin-bottom: 0.8mm;">7.1 Description of Decisions per Inspected Component</div>
        <table class="report-matrix-table" style="font-size: 6.8pt;">
          <thead>
            <tr>
              <th style="width: 26%;">DECISION CODE</th>
              <th style="width: 74%;">OPERATIONAL PROTOCOL & DEFINITION</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="font-bold text-success">Reuse</td><td>A part will be reused or reworked by hand</td></tr>
            <tr><td class="font-bold text-primary">Regrind</td><td>By regrinding the teeth, this part can be reused again</td></tr>
            <tr><td class="font-bold text-primary">Rework</td><td>By reworking (surfaces besides the teeth), this part can be reused again</td></tr>
            <tr><td class="font-bold text-primary">Replace by Upgrade</td><td>Part will be replaced by an upgraded part (independent of current damage)</td></tr>
            <tr><td class="font-bold text-primary">Rework to Upgrade</td><td>Part needs to be reworked to the latest upgrade</td></tr>
            <tr><td class="font-bold text-danger">Replace by Oversize</td><td>Current part is scrap and will be replaced by a new (oversized) part</td></tr>
            <tr><td class="font-bold text-primary">Oversize</td><td>Part will be reworked to an oversize bore</td></tr>
            <tr><td class="font-bold text-primary">Flip</td><td>Part will be reworked so the unloaded flank will become the loaded flank</td></tr>
            <tr><td class="font-bold text-danger">Scrap</td><td>Part is not reused and will be replaced by a new part</td></tr>
            <tr><td class="font-bold text-danger">Scrap(Rework Gear)</td><td>Integrated planet bearings: If planet wheel teeth reworked/regrind, decision is "scrap (rework gear)"; otherwise "scrap".</td></tr>
            <tr><td class="font-bold" style="color:#64748b;">std replacement part</td><td>Smaller parts will be replaced without inspection (e.g. sealings, bolts, nuts).</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // Block 10: Technical Schematics (Disabled - user-provided content only)
  static getBlockSchematics(data) {
    return '';
  }

  // Block 11: Legal Terms & Standards Compliance
  static getBlockLegalAndStandards(data) {
    return `
      <div class="report-section">
        <div class="section-title">8. Legal Terms & Quality Standards Compliance</div>
        
        <div class="legal-text" style="font-size: 7.2pt; line-height: 1.35; color: #475569; margin-bottom: 2mm;">
          This diagnostic service report contains engineering evaluations derived from high-resolution optical video-borescope visual audits and non-destructive examination performed on-site at the specified wind farm facility. All findings and observations accurately reflect internal mechanical health and surface condition at the precise date and time of intervention. Thendral Wind Power Engineering Services Pvt Ltd disclaims liability for progressive degradation or mechanical failure occurring after inspection due to operating conditions outside OEM certified vibration, torque, or oil temperature envelope parameters.
        </div>

        <div class="subsection-title" style="margin-bottom: 1.5mm;">8.1 Regulatory Standards, Diagnostic Tooling & HSE Protocol</div>
        
        <div class="standards-compliance-grid">
          <div class="standards-card">
            <div class="standards-card-title">🛡️ Industry Standards & Codes</div>
            <div class="standards-card-content">
              Inspection workflows and damage evaluation conform to international wind energy standards:
              <ul class="standards-card-list">
                <li><strong>ISO 9001:2015:</strong> Quality Management Systems Execution</li>
                <li><strong>ISO 10816-3 / 21:</strong> Wind Turbine Vibration Severity Guidelines</li>
                <li><strong>ISO 281 / ISO 76:</strong> Bearing Dynamic Load Rating & Life Assessment</li>
                <li><strong>DIN 3990 / AGMA 6001:</strong> Gear Tooth Surface Distress Analysis</li>
              </ul>
            </div>
          </div>

          <div class="standards-card">
            <div class="standards-card-title">🔬 Diagnostic Instrumentation</div>
            <div class="standards-card-content">
              Optical borescope recordings captured with calibrated test apparatus:
              <ul class="standards-card-list">
                <li><strong>Optical Borescope:</strong> Olympus IPLEX Video Probe</li>
                <li><strong>Optics Resolution:</strong> High-Definition CCD Sensor with Stereo Tip</li>
                <li><strong>Lube Test Suite:</strong> Viscometer, Spectro Ferrography & Particle Counter</li>
                <li><strong>Laser Tachometer:</strong> Calibrated non-contact optical speed sensor</li>
              </ul>
            </div>
          </div>

          <div class="standards-card">
            <div class="standards-card-title">⚡ HSE & Nacelle Safety Protocols</div>
            <div class="standards-card-content">
              Up-tower service executes under GWO-certified safety mandates:
              <ul class="standards-card-list">
                <li>Full mechanical Lockout / Tagout (LOTO) & brake pinning</li>
                <li>Dual fall arrest and certified up-tower rescue rigging</li>
                <li>Zero fluid spillage containment protocol during audits</li>
              </ul>
            </div>
          </div>

          <div class="standards-card">
            <div class="standards-card-title">📋 Quality Assurance Sign-Off</div>
            <div class="standards-card-content">
              Undergone independent technical review and peer verification by Thendral Wind Engineering Quality Directorate.
              <div style="margin-top: 1.5mm; font-size: 6.8pt; color: #0284c7; font-weight: 700;">
                Official Technical Certification • Verified & Archived
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // DYNAMIC PHOTO GALLERY LAYOUT ENGINE
  // ==========================================

  // Splits total uploaded photos into strict maximum 6 photos per A4 page
  static calculatePhotoPagesLayout(photos) {
    if (!photos || photos.length === 0) return [];
    const pages = [];
    const maxPerPage = 6;
    for (let i = 0; i < photos.length; i += maxPerPage) {
      pages.push(photos.slice(i, i + maxPerPage));
    }
    return pages;
  }

  // Arranges photos on a single page into dynamic rows & columns (1 to 6 photos max)
  static arrangePageRows(pagePhotos, isFirstPhotoPage = false) {
    const n = Math.min(pagePhotos.length, 6);
    const rows = [];
    const availHeightMm = isFirstPhotoPage ? 212 : 222;

    if (n === 1) {
      rows.push({ photos: [pagePhotos[0]], cols: 1, heightMm: 150 });
    } else if (n === 2) {
      rows.push({ photos: [pagePhotos[0], pagePhotos[1]], cols: 2, heightMm: 120 });
    } else if (n === 3) {
      rows.push({ photos: [pagePhotos[0], pagePhotos[1], pagePhotos[2]], cols: 3, heightMm: 108 });
    } else if (n === 4) {
      const h = Math.floor((availHeightMm - 4) / 2);
      rows.push({ photos: [pagePhotos[0], pagePhotos[1]], cols: 2, heightMm: Math.min(h, 104) });
      rows.push({ photos: [pagePhotos[2], pagePhotos[3]], cols: 2, heightMm: Math.min(h, 104) });
    } else if (n === 5) {
      const h = Math.floor((availHeightMm - 4) / 2);
      rows.push({ photos: [pagePhotos[0], pagePhotos[1], pagePhotos[2]], cols: 3, heightMm: Math.min(h, 102) });
      rows.push({ photos: [pagePhotos[3], pagePhotos[4]], cols: 2, heightMm: Math.min(h, 102) });
    } else if (n === 6) {
      const h = Math.floor((availHeightMm - 4) / 2);
      rows.push({ photos: [pagePhotos[0], pagePhotos[1], pagePhotos[2]], cols: 3, heightMm: Math.min(h, 102) });
      rows.push({ photos: [pagePhotos[3], pagePhotos[4], pagePhotos[5]], cols: 3, heightMm: Math.min(h, 102) });
    }

    return rows;
  }

  // Renders dynamic photo pages with unbreakable cards
  static renderDynamicPhotoGalleries(data, totalPages = 6, photoPages = [], totalPhotosCount = 0, startPageNum = 6) {
    let html = '';
    const customSlots = data.customSlots || [];

    photoPages.forEach((pagePhotos, pageIdx) => {
      const pageNum = startPageNum + pageIdx;
      const isFirst = pageIdx === 0;
      const subTitle = isFirst ? 'PHOTO EVIDENCE' : `PHOTO EVIDENCE (PART ${pageIdx + 1})`;
      const rows = this.arrangePageRows(pagePhotos, isFirst);

      html += `
        <div class="report-page" id="report-page-${pageNum}">
          ${this.renderHeader(data, 'SERVICE REPORT', subTitle)}

          <div class="page-body-container">
            ${this.renderSidebar(data)}

            <div class="report-page-main">
              ${isFirst ? `
                <div class="photo-evidence-header-banner">
                  <div class="photo-section-heading">
                    <div class="section-title">PHOTO EVIDENCE</div>
                    <div class="photo-section-subtitle">Visual inspection evidence captured during field service activity</div>
                  </div>
                  <div class="photo-count-badge">
                    <span>📷</span> ${totalPhotosCount} Photos Documented
                  </div>
                </div>
              ` : `
                <div class="photo-evidence-header-banner" style="padding: 1.5mm 3mm; margin-bottom: 1.5mm;">
                  <div class="photo-section-heading">
                    <div class="section-title" style="font-size: 8pt;">Photo Evidence (Continued — Part ${pageIdx + 1})</div>
                  </div>
                  <div class="photo-count-badge" style="font-size: 6.2pt; padding: 1mm 2.5mm;">
                    Page ${pageNum} of ${totalPages}
                  </div>
                </div>
              `}

              <div class="photo-gallery-page-body">
                ${rows.map(r => `
                  <div class="photo-gallery-row cols-${r.cols}">
                    ${r.photos.map(p => this.renderDynamicPhotoCard(p, customSlots, r.cols)).join('')}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          ${this.renderFooter(pageNum, totalPages, data)}
        </div>
      `;
    });

    return html;
  }

  // Single Unbreakable Photo Evidence Card
  static renderDynamicPhotoCard(photo, customSlots = [], cols = 2) {
    if (!photo || !photo.url) return '';
    const photoId = photo.photoId || photo.id || photo.slotId || '';

    const pointName = typeof PhotoManager !== 'undefined' && PhotoManager.getPhotoDisplayName 
      ? PhotoManager.getPhotoDisplayName(photo, customSlots)
      : (photo.tag || photo.caption || 'Inspection Photo');
    let caption = (photo.caption || '').trim();
    if (!caption) {
      caption = pointName;
    }
    const group = typeof PhotoManager !== 'undefined' && PhotoManager.getPhotoCategoryGroup
      ? PhotoManager.getPhotoCategoryGroup(photo)
      : null;
    
    const displayCaption = caption || pointName;

    return `
      <div class="photo-evidence-card" data-photo-card-id="${photoId}">
        <div class="photo-evidence-img-box">
          <img src="${photo.url}" class="photo-evidence-img" alt="${pointName}">
          ${photo.timestamp ? `<div class="photo-timestamp-pill">${photo.timestamp}</div>` : ''}
          ${group && group.title ? `<div class="photo-category-pill">${group.title.replace(/^\d+\.\s*/, '')}</div>` : ''}
          <div class="preview-photo-controls">
            <button type="button" class="preview-photo-btn btn-replace" onclick="event.stopPropagation(); app.previewReplacePhoto('${photoId}')" title="Replace Photo">↻ Replace</button>
            <button type="button" class="preview-photo-btn btn-remove" onclick="event.stopPropagation(); app.previewDeletePhoto('${photoId}')" title="Remove Photo">✕ Remove</button>
          </div>
        </div>
        <div class="photo-evidence-caption-box">
          <div class="photo-point-name" style="${cols === 1 ? 'font-size: 8.5pt;' : cols === 3 ? 'font-size: 6.8pt;' : 'font-size: 7.2pt;'}">${pointName}</div>
          <div class="photo-sub-caption preview-editable" data-edit-photo-id="${photoId}" data-edit-type="caption" style="${cols === 1 ? 'font-size: 7.2pt;' : cols === 3 ? 'font-size: 5.8pt;' : 'font-size: 6.2pt;'}" title="Click in Edit Preview mode to edit caption">${displayCaption}</div>
        </div>
      </div>
    `;
  }
}

if (typeof window !== 'undefined') window.ReportTemplate = ReportTemplate;
if (typeof module !== 'undefined') module.exports = { ReportTemplate };
