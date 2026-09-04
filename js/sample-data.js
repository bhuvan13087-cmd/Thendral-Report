/**
 * Sample Data & Inspection Templates
 * Contains the real Bhuj Vestas V110 Borescope report data plus templates for other service workflows
 */

const SAMPLE_REPORTS = {
  // 1. Complete Bhuj Vestas V110 Borescope Inspection (1:1 with uploaded PDF)
  borescope_inspection_v110: {
    meta: {
      templateId: 'borescope_inspection_v110',
      templateName: 'Borescope Inspection Report (Vestas V110)',
      reportTitle: 'Service Report',
      companyName: 'THENDRAL WIND SERVICES',
      companySub: 'Thendral Wind Tech LLP',
      companyAddress: 'Thendral Wind Tech LLP Dindigul',
      companyPhone: '+91 4254 30 6000 / +91 98400 12345',
      companyEmail: 'service.wind@thendral.com',
      companyWeb: 'www.thendralwind.com',
      equipmentNo: '146845407',
      edition: 'A',
      reportDate: '07.09.2020',
      reportDocNo: 'TWT-10826',
      gearboxPartNo: '4178.010.034',
      customerSerialNo: 'CM0307',
      templateRef: 'ZP1QM_QS_IREP',
      preparedBy: 'NAVEEN KUMAR',
      releasedBy: 'KAMARAJ MUNUSAMY'
    },
    generalInfo: {
      qsNotification: '1087309',
      interventionType: 'BoreScope Inspection',
      startDate: '05.09.2020',
      endDate: '05.09.2020',
      customerName: 'Vestas Wind Technology India P',
      country: 'IN - India',
      siteName: 'BHUJ # INDIA',
      inspectorName: 'Kamaraj Munusamy',
      serviceEngineer: 'Kamaraj Munusamy',
      reportReviewer: 'NAVEEN KUMAR R R',
      complaintCategory: 'Metallic Debris on Magnetic Plug',
      complaintSeverity: 'Moderate',
      scadaAlarmCode: 'ALM-MAG-04 (Magnetic Sensor Trigger)',
      complaintReportedDate: '2020-09-04',
      customerComplaint: 'Found metal particles on magnetic drain stick during routine monthly audit; customer requested urgent borescope assessment of IMS and HSS bearing raceways.',
      workExecutionStatus: 'Completed Successfully',
      handoverClearance: 'Cleared for Commercial Power Generation',
      workScopeCategory: 'Internal Borescope Video Inspection',
      workCompletionDate: '2020-09-05',
      workPerformed: '1. Applied Lock-Out/Tag-Out (LOTO) protocol. 2. Performed full high-definition video borescope inspection of HSS, IMS, and Planetary stage bearings and gear teeth. 3. Cleaned magnetic plug assembly and removed ferrous debris. 4. Extracted oil sample for lab spectroscopy and particle count. 5. Normalized all turbine systems and cleared for commercial operation.'
    },
    turbine: {
      turbineNumber: 'CN18D064',
      padNumber: 'KUT-035',
      turbineType: 'V110',
      commissioningDate: '2018-08-24',
      totalProductionKwh: '13092101',
      runHours: '16959',
      gen1StarHours: '14210',
      gen1DeltaHours: '2749',
      gen2StarHours: '',
      gen2DeltaHours: '',
      turbineLocationType: 'STV',
      runStatusBefore: 'STOP',
      customerReportedStatus: 'Tripped on magnetic stick particle alarm',
      runStatusUponArrival: 'STOP',
      runStatusAfter: 'RUN',
      turbineLogbook: 'Checked - Verified normal operation history',
      gen1Manufacturer: 'Vestas / ABB',
      gen2Manufacturer: '',
      configuration: 'Standard 3-stage planetary-helical gearbox',
      customerComplaint: 'Found metal particles in magnetic stick'
    },
    lubrication: {
      gearboxOilType: 'Castrol Optigear Synthetic CT 320',
      oilLevelAtInspection: 'above Minimum',
      dateLastOilChange: '2019-11-15',
      dateLastFilterChange: '2020-04-10',
      oilCondition: 'Clear / Normal viscosity',
      debrisOnMagnet: 'Many',
      debrisInGearbox: 'Minor trace',
      debrisInFilter: 'Yes',
      vibrations: 'Normal',
      noise: 'No abnormal noise',
      oilChangedPlanned: 'No',
      gearboxNameplate: '4178.010.034/CM0307',
      remarksAlignment: 'Within OEM tolerances',
      dateLastAlignment: '2018-08-24'
    },
    workPerformed: [
      '1. Borescope inspection of all accessible High Speed, Intermediate, and Planetary stage bearings',
      '2. Visual & Borescope inspection of helical gear teeth and planetary gear mesh stages',
      '3. Magnetic plug stick inspection and debris pattern assessment',
      '4. Oil condition, level check, and filter housing inspection'
    ],
    bearingAssessment: [
      { id: 'b_6006_hss_gs', code: '6006', location: 'HSS GS', observation: 'No wear marks, races intact', assessment: 'Acceptable' },
      { id: 'b_6026_hss_rs_gs', code: '6026', location: 'HSS RS GS', observation: 'Normal roller contact pattern', assessment: 'Acceptable' },
      { id: 'b_6005_hss_rs_rs', code: '6005', location: 'HSS RS RS', observation: 'Acceptable roller surface and race', assessment: 'Acceptable' },
      { id: 'b_6004_hsis_gs_gs', code: '6004', location: 'HS-IS GS GS', observation: 'Raceway smooth, no spalling', assessment: 'Acceptable' },
      { id: 'b_6004_hsis_gs_rs', code: '6004', location: 'HS-IS GS RS', observation: 'Clean contact surfaces', assessment: 'Acceptable' },
      { id: 'b_6003_hsis_rs', code: '6003', location: 'HS-IS RS', observation: 'Good raceway condition', assessment: 'Acceptable' },
      { id: 'b_6001_lsis_gs', code: '6001', location: 'LS-IS GS', observation: 'Normal operational polish', assessment: 'Acceptable' },
      { id: 'b_6002_lsis_rs', code: '6002', location: 'LS-IS RS', observation: 'Minor indent marks on raceway', assessment: 'Caution' },
      { id: 'b_6022_pc_gs', code: '6022', location: 'PC GS', observation: 'Normal contact pattern', assessment: 'Acceptable' },
      { id: 'b_6032_pc_rs', code: '6032', location: 'PC RS', observation: 'Good raceway surface', assessment: 'Acceptable' },
      { id: 'b_6041_pitch_tube', code: '6041', location: 'PITCH TUBE', observation: 'No fretting or looseness', assessment: 'Acceptable' },
      { id: 'b_6042_lsspg1_gs', code: '6042', location: 'LSS-PG 1 GS', observation: 'Normal roller tracking', assessment: 'Acceptable' },
      { id: 'b_6042_lsspg1_rs', code: '6042', location: 'LSS-PG 1 RS', observation: 'Minor indentation observed', assessment: 'Caution' },
      { id: 'b_6042_lsspg2_gs', code: '6042', location: 'LSS-PG 2 GS', observation: 'Normal wear condition', assessment: 'Acceptable' },
      { id: 'b_6042_lsspg2_rs', code: '6042', location: 'LSS-PG 2 RS', observation: 'Minor indentation observed', assessment: 'Caution' },
      { id: 'b_6042_lsspg3_gs', code: '6042', location: 'LSS-PG 3 GS', observation: 'Normal roller condition', assessment: 'Acceptable' },
      { id: 'b_6042_lsspg3_rs', code: '6042', location: 'LSS-PG 3 RS', observation: 'Minor surface indentations', assessment: 'Caution' }
    ],
    bearingRemarks: 'Indent found on LSS RS bearing and PLC Wheel Bearing (Planet Carrier). Monitoring recommended.',
    
    boreAssessment: [
      { id: 'bore_6006_hss_gs', code: '6006', location: 'HSS GS', observation: 'No fretting corrosion or spin marks', assessment: 'Acceptable' },
      { id: 'bore_6005_hss_rs', code: '6005', location: 'HSS RS', observation: 'Housing bore tight and aligned', assessment: 'Acceptable' },
      { id: 'bore_6004_hsis_gs', code: '6004', location: 'HS-IS GS', observation: 'Acceptable bore seat', assessment: 'Acceptable' },
      { id: 'bore_6003_hsis_rs', code: '6003', location: 'HS-IS RS', observation: 'Acceptable bore seat', assessment: 'Acceptable' }
    ],
    boreRemarks: 'Bores in sound condition with no signs of outer ring slippage.',

    filterAssessment: [
      { id: 'filt_9205', code: '9205', location: 'MECHANICAL PUMP & FILTER', observation: 'Pump operational, filter captured fine debris', assessment: 'Acceptable' }
    ],
    filterRemarks: 'Filter element replaced as preventive measure during intervention.',

    gearAssessment: [
      { id: 'g_2704_hss', code: '2704', location: 'HSS (High Speed Shaft)', observation: 'Active flanks clean, no micropitting or scuffing', assessment: 'Acceptable' },
      { id: 'g_2703_hsig', code: '2703', location: 'HS-IG (High Speed Intermediate Gear)', observation: 'Flanks in good condition, even tooth contact', assessment: 'Acceptable' },
      { id: 'g_2702_hsis', code: '2702', location: 'HS-IS (High Speed Intermediate Shaft)', observation: 'Normal contact line along full face width', assessment: 'Acceptable' },
      { id: 'g_2701_lsig', code: '2701', location: 'LS-IG (Low Speed Intermediate Gear)', observation: 'Healthy tooth contact pattern', assessment: 'Acceptable' },
      { id: 'g_2731_lsspg1', code: '2731', location: 'LSS-PG 1 (Planet Gear 1)', observation: 'Flank surfaces smooth, no pitting', assessment: 'Acceptable' },
      { id: 'g_2731_lsspg2', code: '2731', location: 'LSS-PG 2 (Planet Gear 2)', observation: 'Acceptable load pattern', assessment: 'Acceptable' },
      { id: 'g_2731_lsspg3', code: '2731', location: 'LSS-PG 3 (Planet Gear 3)', observation: 'Tooth profiles intact', assessment: 'Acceptable' },
      { id: 'g_2741_lssrg', code: '2741', location: 'LSS-RG (Ring Gear)', observation: 'Internal gear teeth clean, normal wear', assessment: 'Acceptable' },
      { id: 'g_2721_lsssu', code: '2721', location: 'LSS-SU (Sun Pinion)', observation: 'Good tooth mesh and contact symmetry', assessment: 'Acceptable' }
    ],
    gearRemarks: 'No visual damage or micro-pitting on gear tooth flanks across all stages.',

    otherAssessment: [
      { id: 'other_8202', code: '8202', location: 'PLANET CARRIER', observation: 'Structural welds & pockets intact', assessment: 'Acceptable' }
    ],
    otherRemarks: 'Planet carrier body structurally sound.',

    shaftAssessment: [
      { id: 'shaft_2704_hss', code: '2704', location: 'HSS', observation: 'Keyways, splines & seal journals normal', assessment: 'Acceptable' },
      { id: 'shaft_2702_hsis', code: '2702', location: 'HS-IS', observation: 'No axial score marks', assessment: 'Acceptable' }
    ],
    shaftRemarks: 'Shafts aligned with no thermal discoloration.',
    customInspections: [
      {
        id: 'insp_101',
        conditionOf: 'Shafts & Couplings',
        location: 'HSS Generator Side Coupling',
        severity: 'Moderate',
        damage: 'Scuffing line(s)',
        decision: 'Caution',
        remark: 'Minor fretting wear observed on coupling spline teeth; monitor at next vibration audit.'
      },
      {
        id: 'insp_102',
        conditionOf: 'Housing & Structural Frame',
        location: 'Main Sump & Torque Arm Bushing',
        severity: 'Normal',
        damage: 'No visual damage',
        decision: 'Acceptable',
        remark: 'No oil seepage or housing crack indications detected.'
      }
    ],

    summary: {
      summaryText: 'Borescope inspection completed successfully. Indent found on LSS RS bearing and PLC Wheel Bearings. Gear tooth flanks in good condition with no scuffing.',
      runStatusAfter: 'RUN',
      gearboxRecommendation: 'Gearbox needs a follow-up inspection after two months to monitor LSS RS indentation evolution.',
      furtherJobs: 'MONITORING NECESSARY',
      lubricantRecommendation: 'Perform laboratory oil sample analysis (PQ index, ferrography & ISO cleanliness) within 30 days.',
      generalRemarks: 'Inspect magnetic plug periodically during routine monthly checks.'
    },

    photos: [
      {
        id: 'p1',
        tag: '0010_0010_Turbine number',
        caption: '0010_0010_Turbine number (CN18D064)',
        category: 'turbine',
        url: '', // populated with realistic generated placeholder/base64
        meta: 'Vestas V110 Nacelle Tag'
      },
      {
        id: 'p2',
        tag: '0010_0020_Pad Number',
        caption: '0010_0020_Pad Number (KUT-035)',
        category: 'turbine',
        url: '',
        meta: 'WTG Tower Base Marker'
      },
      {
        id: 'p3',
        tag: '0010_0050_Total production',
        caption: '0010_0050_Total production (13092101 kWh)',
        category: 'meters',
        url: '',
        meta: 'Controller Energy Counter'
      },
      {
        id: 'p4',
        tag: '0010_0060_Run hours',
        caption: '0010_0060_Run hours (16959 hrs)',
        category: 'meters',
        url: '',
        meta: 'Controller Hour Meter'
      },
      {
        id: 'p5',
        tag: '0030_0050_Oil Level',
        caption: '0030_0050_Oil Level at Inspection',
        category: 'lubrication',
        url: '',
        meta: 'Sight Glass Level Check'
      },
      {
        id: 'p6',
        tag: '0030_0090_Debris on magnet',
        caption: '0030_0090_Debris on magnet',
        category: 'lubrication',
        url: '',
        meta: 'Magnetic Plug Swarf Check'
      },
      {
        id: 'p7',
        tag: '0030_0110_Debris in filter',
        caption: '0030_0110_Debris in filter',
        category: 'lubrication',
        url: '',
        meta: 'Filter Housing Inspection'
      },
      {
        id: 'p8',
        tag: '0050_0010_Gearbox',
        caption: 'Gearbox (4178.010.034/CM0307)',
        category: 'Identification',
        url: '',
        meta: 'Gearbox'
      },
      {
        id: 'p9',
        tag: '6006_HSS GS',
        caption: '6006_HSS GS (Generator Side)',
        category: 'borescope',
        timestamp: '2020/09/05 12:17',
        url: '',
        meta: 'Olympus IPLEX Scope'
      },
      {
        id: 'p10',
        tag: '6005_HSS RS RS',
        caption: '6005_HSS RS RS (Rotor Side)',
        category: 'borescope',
        timestamp: '2020/09/05 12:18',
        url: '',
        meta: 'Olympus IPLEX Scope'
      },
      {
        id: 'p11',
        tag: '6004_HS-IS GS GS',
        caption: '6004_HS-IS GS GS',
        category: 'borescope',
        timestamp: '2020/09/05 12:20',
        url: '',
        meta: 'Intermediate Stage Bearing'
      },
      {
        id: 'p12',
        tag: '6004_HS-IS GS RS',
        caption: '6004_HS-IS GS RS',
        category: 'borescope',
        timestamp: '2020/09/05 12:23',
        url: '',
        meta: 'Intermediate Stage Bearing'
      },
      {
        id: 'p13',
        tag: '6003_HS-IS RS',
        caption: '6003_HS-IS RS',
        category: 'borescope',
        timestamp: '2020/09/05 12:02',
        url: '',
        meta: 'Intermediate Stage Bearing'
      },
      {
        id: 'p14',
        tag: '6001_LS-IS GS',
        caption: '6001_LS-IS GS',
        category: 'borescope',
        timestamp: '2020/09/05 12:47',
        url: '',
        meta: 'Low Speed Stage Bearing'
      },
      {
        id: 'p15',
        tag: '6002_LS-IS RS',
        caption: '6002_LS-IS RS (Indentation Point)',
        category: 'borescope',
        timestamp: '2020/09/05 15:06',
        url: '',
        meta: 'Raceway Indent Feature'
      },
      {
        id: 'p16',
        tag: '6032_PC RS',
        caption: '6032_PC RS (Planet Carrier)',
        category: 'borescope',
        timestamp: '2020/09/05 17:10',
        url: '',
        meta: 'Carrier Pin Bearing'
      },
      {
        id: 'p17',
        tag: '6042_LSS-PG 1 GS',
        caption: '6042_LSS-PG 1 GS (Planet 1)',
        category: 'borescope',
        timestamp: '2020/09/05 15:41',
        url: '',
        meta: 'Planet Wheel 1 Bearing'
      },
      {
        id: 'p18',
        tag: '6042_LSS-PG 1 RS',
        caption: '6042_LSS-PG 1 RS (Planet 1)',
        category: 'borescope',
        timestamp: '2020/09/05 15:43',
        url: '',
        meta: 'Planet Wheel 1 Bearing'
      },
      {
        id: 'p19',
        tag: '6042_LSS-PG 2 GS',
        caption: '6042_LSS-PG 2 GS (Planet 2)',
        category: 'borescope',
        timestamp: '2020/09/05 15:41',
        url: '',
        meta: 'Planet Wheel 2 Bearing'
      },
      {
        id: 'p20',
        tag: '6042_LSS-PG 2 RS',
        caption: '6042_LSS-PG 2 RS (Planet 2)',
        category: 'borescope',
        timestamp: '2020/09/05 16:06',
        url: '',
        meta: 'Planet Wheel 2 Bearing'
      },
      {
        id: 'p21',
        tag: '6042_LSS-PG 3 GS',
        caption: '6042_LSS-PG 3 GS (Planet 3)',
        category: 'borescope',
        timestamp: '2020/09/05 17:04',
        url: '',
        meta: 'Planet Wheel 3 Bearing'
      },
      {
        id: 'p22',
        tag: '6042_LSS-PG 3 RS',
        caption: '6042_LSS-PG 3 RS (Planet 3)',
        category: 'borescope',
        timestamp: '2020/09/05 16:18',
        url: '',
        meta: 'Planet Wheel 3 Bearing'
      },
      {
        id: 'p23',
        tag: '2741_LSS-RG',
        caption: '2741_LSS-RG (Ring Gear Teeth)',
        category: 'geartooth',
        timestamp: '2020/09/05 17:27',
        url: '',
        meta: 'Internal Gear Mesh'
      },
      {
        id: 'p24',
        tag: '2731_LSS-PG 1',
        caption: '2731_LSS-PG 1 (Planet 1 Teeth)',
        category: 'geartooth',
        timestamp: '2020/09/05 17:40',
        url: '',
        meta: 'External Spur Flank'
      },
      {
        id: 'p25',
        tag: '2731_LSS-PG 2',
        caption: '2731_LSS-PG 2 (Planet 2 Teeth)',
        category: 'geartooth',
        timestamp: '2020/09/05 17:53',
        url: '',
        meta: 'External Spur Flank'
      },
      {
        id: 'p26',
        tag: '2731_LSS-PG 3',
        caption: '2731_LSS-PG 3 (Planet 3 Teeth)',
        category: 'geartooth',
        timestamp: '2020/09/05 17:54',
        url: '',
        meta: 'External Spur Flank'
      },
      {
        id: 'p27',
        tag: '2721_LSS-SU',
        caption: '2721_LSS-SU (Sun Pinion)',
        category: 'geartooth',
        timestamp: '2020/09/05 17:52',
        url: '',
        meta: 'Sun Pinion Teeth'
      },
      {
        id: 'p28',
        tag: '2701_LS-IG',
        caption: '2701_LS-IG (Low Speed Intermediate)',
        category: 'geartooth',
        timestamp: '2020/09/05 17:50',
        url: '',
        meta: 'Helical Gear Teeth'
      },
      {
        id: 'p29',
        tag: '2702_HS-IS',
        caption: '2702_HS-IS (High Speed Intermediate)',
        category: 'geartooth',
        timestamp: '2020/09/05 17:48',
        url: '',
        meta: 'Helical Pinion Flanks'
      },
      {
        id: 'p30',
        tag: '2703_HS-IG',
        caption: '2703_HS-IG (High Speed Int Gear)',
        category: 'geartooth',
        timestamp: '2020/09/05 17:45',
        url: '',
        meta: 'High Speed Stage Mesh'
      },
      {
        id: 'p31',
        tag: '2704_HSS',
        caption: '2704_HSS (High Speed Shaft Pinion)',
        category: 'geartooth',
        timestamp: '2020/09/05 17:42',
        url: '',
        meta: 'Generator Pinion Flank'
      }
    ]
  },

  // 2. Up-Tower Gear / Pinion Replacement Template
  gear_replacement_template: {
    meta: {
      templateId: 'gear_replacement_template',
      templateName: 'Up-Tower Gear / Pinion Replacement Report',
      reportTitle: 'Service Report - Gear Replacement',
      companyName: 'THENDRAL WIND SERVICES',
      companySub: 'Thendral Wind Tech LLP',
      companyAddress: 'Thendral Wind Tech LLP Dindigul',
      companyPhone: '+91 4254 30 6000 / +91 98400 12345',
      companyEmail: 'service.wind@thendral.com',
      companyWeb: 'www.thendralwind.com',
      equipmentNo: '147992011',
      edition: 'B',
      reportDate: '28.08.2026',
      reportDocNo: 'TWT-10826',
      gearboxPartNo: '5190.022.108',
      customerSerialNo: 'WTG-GEAR-889',
      templateRef: 'TD_QS_UPTOWER_REP',
      preparedBy: 'SRI BHUVANESHWARAN',
      releasedBy: 'TECHNICAL DIRECTOR'
    },
    generalInfo: {
      qsNotification: '2026-NOTIF-441',
      interventionType: 'Up-Tower High Speed Pinion Replacement',
      startDate: '20.08.2026',
      endDate: '24.08.2026',
      customerName: 'Suzlon Energy / CleanMax Solar & Wind',
      country: 'IN - India',
      siteName: 'THENI # TAMIL NADU',
      inspectorName: 'Sribhuvan & Team',
      serviceEngineer: 'Lead Mechanical Specialist',
      reportReviewer: 'Head of Wind O&M',
      customerComplaint: 'Excessive high frequency vibration (12.4 mm/s RMS) on HSS stage'
    },
    turbine: {
      turbineNumber: 'S88-TN-042',
      padNumber: 'PAD-42B',
      turbineType: 'S88 / 2.1 MW',
      commissioningDate: '2016-04-12',
      totalProductionKwh: '34981200',
      runHours: '42310',
      gen1StarHours: '',
      gen2DeltaHours: '',
      turbineLocationType: 'Mountain Ridge WTG',
      runStatusBefore: 'TRIPPED',
      runStatusUponArrival: 'STOP',
      runStatusAfter: 'RUN',
      turbineLogbook: 'Vibration trip alarm 302',
      gen1Manufacturer: 'Winergy / ABB',
      gen2Manufacturer: ''
    },
    lubrication: {
      gearboxOilType: 'Mobilgear SHC XMP 320 Synthetic',
      oilLevelAtInspection: 'Correct Nominal',
      dateLastOilChange: '2026-08-22',
      dateLastFilterChange: '2026-08-22',
      oilCondition: 'Flushed & New batch filled',
      debrisOnMagnet: 'Steel micropitting debris',
      debrisInGearbox: 'Cleaned during overhaul',
      debrisInFilter: 'Replaced element',
      vibrations: 'Post-repair: 1.8 mm/s RMS (Normal)',
      noise: 'Smooth pitch sound',
      oilChangedPlanned: 'Yes - Completed',
      gearboxNameplate: '5190.022.108/WTG-889',
      remarksAlignment: 'Laser shaft alignment performed within 0.04mm tolerance',
      dateLastAlignment: '2026-08-24'
    },
    workPerformed: [
      '1. Rigging and hoisting of specialized up-tower hydraulic puller tooling into nacelle',
      '2. Disassembly of HSS generator coupling and high speed stage bearing housing cover',
      '3. Extraction of damaged HSS pinion shaft and HSS-GS/RS bearing assemblies',
      '4. Induction heating and precision installation of new OEM HSS helical pinion shaft and matched bearings',
      '5. Complete gearbox oil flushing, filter replacement, and refill with 400L Mobilgear SHC XMP 320',
      '6. Precision laser alignment between High Speed Shaft and Generator coupling',
      '7. 4-hour trial run under 25%, 50%, 75%, and 100% rated electrical load with real-time vibration logging'
    ],
    bearingAssessment: [
      { code: '6006', location: 'HSS GS (New Assembly)', observation: 'Brand new OEM bearing installed, pre-loaded', assessment: 'Acceptable' },
      { code: '6005', location: 'HSS RS (New Assembly)', observation: 'Brand new OEM bearing installed, clearance checked', assessment: 'Acceptable' },
      { code: '6004', location: 'HS-IS GS GS', observation: 'Inspected - No damage found', assessment: 'Acceptable' },
      { code: '6003', location: 'HS-IS RS', observation: 'Inspected - Good condition', assessment: 'Acceptable' },
      { code: '6001', location: 'LS-IS GS', observation: 'Inspected - Normal condition', assessment: 'Acceptable' },
      { code: '6002', location: 'LS-IS RS', observation: 'Inspected - Normal condition', assessment: 'Acceptable' }
    ],
    bearingRemarks: 'All new HSS bearings seated to manufacturer axial clearance specs.',
    boreAssessment: [
      { code: '6006', location: 'HSS GS Housing', observation: 'Bore measured with micrometer, roundness within ±0.012mm', assessment: 'Acceptable' },
      { code: '6005', location: 'HSS RS Housing', observation: 'Bore dimensions verified to OEM tolerance', assessment: 'Acceptable' }
    ],
    boreRemarks: 'Housing bores in prime condition with zero fretting.',
    filterAssessment: [
      { code: '9205', location: 'OFFLINE & INLINE FILTRATION', observation: 'New 10-micron filter element installed & differential pressure sensor verified', assessment: 'Acceptable' }
    ],
    filterRemarks: 'Filtration operating at optimal flow and delta P.',
    gearAssessment: [
      { code: '2704', location: 'HSS (New Pinion)', observation: 'Brand new helical pinion shaft installed and blued for tooth contact check', assessment: 'Acceptable' },
      { code: '2703', location: 'HS-IG (Intermediate Gear)', observation: 'Flanks polished, tooth contact pattern verified >85% across active face width', assessment: 'Acceptable' },
      { code: '2701', location: 'LS-IG (Low Speed Gear)', observation: 'Sound condition', assessment: 'Acceptable' },
      { code: '2741', location: 'LSS-RG (Ring Gear)', observation: 'Inspected - Clean mesh', assessment: 'Acceptable' }
    ],
    gearRemarks: 'Tooth contact pattern bluing verified across 88% contact area.',
    otherAssessment: [
      { code: '8202', location: 'PLANET CARRIER', observation: 'Inspected - No cracks or anomalies', assessment: 'Acceptable' }
    ],
    otherRemarks: 'Planetary assembly verified sound.',
    shaftAssessment: [
      { code: '2704', location: 'HSS Pinion Shaft', observation: 'New shaft runout measured < 0.015mm TIR', assessment: 'Acceptable' }
    ],
    shaftRemarks: 'Shaft runout and coupling alignment in full compliance with ISO 10816-21.',
    summary: {
      summaryText: 'Up-tower HSS pinion replacement and bearing installation completed successfully without removing the complete gearbox from the nacelle. Turbine returned to commercial operation at full rated load.',
      runStatusAfter: 'RUN',
      gearboxRecommendation: 'Follow-up borescope inspection scheduled at 500 operating hours to verify wear-in pattern.',
      furtherJobs: 'MONITORING RECOMMENDED AT 500 HRS',
      lubricantRecommendation: 'Submit oil sample after 200 hours of continuous operation for cleanliness validation.',
      generalRemarks: 'Vibration levels reduced from 12.4 mm/s to 1.8 mm/s RMS.'
    },
    photos: []
  },

  // 3. Clean Blank Template
  clean_blank_report: {
    meta: {
      templateId: 'clean_blank_report',
      templateName: 'Blank Wind Turbine Service Report',
      reportTitle: 'Service Report',
      companyName: 'Thendral Wind Tech LLP',
      companyAddress: 'Thendral Wind Tech LLP Dindigul',
      companyPhone: '+91 4254 30 6000',
      companyEmail: 'service.wind@thendral.com',
      companyWeb: 'www.thendralwind.com',
      equipmentNo: '',
      edition: 'A',
      reportDate: '',
      reportDocNo: 'TWT-10826',
      gearboxPartNo: '',
      customerSerialNo: '',
      templateRef: 'ZP1QM_QS_IREP',
      preparedBy: '',
      releasedBy: '',
      status: 'Draft'
    },
    generalInfo: {
      qsNotification: '',
      interventionType: '',
      startDate: '',
      endDate: '',
      customerName: '',
      country: '',
      siteName: '',
      inspectorName: '',
      serviceEngineer: '',
      reportReviewer: '',
      complaintCategory: '',
      complaintSeverity: '',
      scadaAlarmCode: '',
      customerComplaint: '',
      workExecutionStatus: '',
      handoverClearance: '',
      workScopeCategory: '',
      workCompletionDate: '',
      workPerformed: ''
    },
    turbine: {
      turbineNumber: '',
      padNumber: '',
      turbineType: '',
      commissioningDate: '',
      totalProductionKwh: '',
      runHours: '',
      gen1StarHours: '',
      gen2DeltaHours: '',
      turbineLocationType: '',
      runStatusBefore: '',
      runStatusUponArrival: '',
      runStatusAfter: '',
      turbineLogbook: '',
      gen1Manufacturer: '',
      gen2Manufacturer: '',
      customerReportedStatus: ''
    },
    lubrication: {
      gearboxOilType: '',
      oilLevelAtInspection: '',
      dateLastOilChange: '',
      dateLastFilterChange: '',
      oilCondition: '',
      debrisOnMagnet: '',
      debrisInGearbox: '',
      debrisInFilter: '',
      vibrations: '',
      noise: '',
      oilChangedPlanned: '',
      gearboxNameplate: '',
      remarksAlignment: '',
      dateLastAlignment: '',
      oilCoolerFunction: '',
      otherDetectionOil: ''
    },
    workPerformed: '',
    bearingAssessment: [],
    bearingRemarks: '',
    boreAssessment: [],
    boreRemarks: '',
    filterAssessment: [],
    filterRemarks: '',
    gearAssessment: [],
    gearRemarks: '',
    otherAssessment: [],
    otherRemarks: '',
    shaftAssessment: [],
    shaftRemarks: '',
    customInspections: [],
    summary: {
      summaryText: '',
      runStatusAfter: '',
      gearboxRecommendation: '',
      furtherJobs: '',
      lubricantRecommendation: '',
      generalRemarks: ''
    },
    signatures: {
      engineerSigUrl: '',
      reviewerSigUrl: ''
    },
    photos: []
  }
};

if (typeof window !== 'undefined') window.SAMPLE_REPORTS = SAMPLE_REPORTS;
if (typeof module !== 'undefined') module.exports = { SAMPLE_REPORTS };
