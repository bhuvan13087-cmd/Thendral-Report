/**
 * Technical SVG Schematics & Engineering Diagrams
 * Embedded as scalable vector graphics for crisp PDF and print rendering
 */

const DIAGRAMS = {
  // Professional Wind Turbine & Gearbox Inspection Engineering Schematic for Cover Page
  gearboxIllustration: `
    <svg viewBox="0 0 760 340" xmlns="http://www.w3.org/2000/svg" class="report-diagram-svg" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">
      <defs>
        <!-- Gradients -->
        <linearGradient id="skyFlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f0fdf4" stop-opacity="0.2"/>
          <stop offset="40%" stop-color="#e0f2fe" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#f8fafc" stop-opacity="0.9"/>
        </linearGradient>

        <linearGradient id="turbineTowerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#64748b"/>
          <stop offset="30%" stop-color="#94a3b8"/>
          <stop offset="70%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#475569"/>
        </linearGradient>

        <linearGradient id="nacelleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="50%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>

        <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="50%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#94a3b8"/>
        </linearGradient>

        <linearGradient id="gearboxShellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#334155"/>
          <stop offset="40%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>

        <linearGradient id="steelMechGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f1f5f9"/>
          <stop offset="35%" stop-color="#cbd5e1"/>
          <stop offset="70%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#475569"/>
        </linearGradient>

        <linearGradient id="bronzeGearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fed7aa"/>
          <stop offset="50%" stop-color="#f97316"/>
          <stop offset="100%" stop-color="#c2410c"/>
        </linearGradient>

        <linearGradient id="borescopeBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.85"/>
          <stop offset="60%" stop-color="#38bdf8" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#bae6fd" stop-opacity="0.1"/>
        </linearGradient>

        <radialGradient id="targetGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/>
          <stop offset="40%" stop-color="#0284c7" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
        </radialGradient>

        <!-- Filters -->
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="115%">
          <feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.18"/>
        </filter>
      </defs>

      <!-- Engineering Blueprint Technical Background Grid -->
      <rect x="0" y="0" width="760" height="340" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2" />
      <g stroke="#e2e8f0" stroke-width="0.75" stroke-dasharray="4,4">
        <line x1="20" y1="60" x2="740" y2="60" />
        <line x1="20" y1="120" x2="740" y2="120" />
        <line x1="20" y1="180" x2="740" y2="180" />
        <line x1="20" y1="240" x2="740" y2="240" />
        <line x1="20" y1="300" x2="740" y2="300" />
        <line x1="120" y1="20" x2="120" y2="320" />
        <line x1="230" y1="20" x2="230" y2="320" />
        <line x1="360" y1="20" x2="360" y2="320" />
        <line x1="490" y1="20" x2="490" y2="320" />
        <line x1="620" y1="20" x2="620" y2="320" />
      </g>

      <!-- Coordinate Cross Fiducials -->
      <g stroke="#94a3b8" stroke-width="1.2">
        <path d="M 15 15 L 25 15 M 20 10 L 20 20" />
        <path d="M 735 15 L 745 15 M 740 10 L 740 20" />
        <path d="M 15 325 L 25 325 M 20 320 L 20 330" />
        <path d="M 735 325 L 745 325 M 740 320 L 740 330" />
      </g>

      <!-- ==========================================
           SECTION 1: WIND TURBINE GENERATOR ELEVATION (LEFT)
           ========================================== -->
      <g transform="translate(15, 0)">
        <!-- Wind Flow Streamlines -->
        <path d="M 10 70 C 40 50, 70 85, 100 65" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="6,4" stroke-opacity="0.85" />
        <path d="M 10 110 C 45 95, 80 130, 115 105" fill="none" stroke="#0284c7" stroke-width="1.8" stroke-opacity="0.6" />
        <path d="M 10 150 C 40 140, 75 170, 110 145" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="6,4" stroke-opacity="0.85" />
        
        <!-- Tubular Steel Tower -->
        <polygon points="105,150 117,150 125,320 97,320" fill="url(#turbineTowerGrad)" stroke="#334155" stroke-width="1.2" />
        <!-- Tower Flange Rings -->
        <line x1="102" y1="210" x2="120" y2="210" stroke="#1e293b" stroke-width="1.5" />
        <line x1="99" y1="270" x2="123" y2="270" stroke="#1e293b" stroke-width="1.5" />
        <rect x="107" y="295" width="8" height="15" rx="1.5" fill="#1e293b" />

        <!-- Nacelle Body -->
        <path d="M 85 142 L 140 142 C 146 142, 150 145, 150 149 L 148 156 L 85 156 Z" fill="url(#nacelleGrad)" stroke="#0f172a" stroke-width="1.2" />
        <rect x="135" y="138" width="8" height="4" fill="#64748b" />
        <circle cx="139" cy="136" r="1.5" fill="#ef4444" /> <!-- Aviation beacon -->

        <!-- Rotor Hub -->
        <path d="M 85 142 C 78 144, 75 149, 75 149 C 75 149, 78 154, 85 156 Z" fill="url(#steelMechGrad)" stroke="#0f172a" stroke-width="1.2" />
        <circle cx="83" cy="149" r="3.5" fill="#0284c7" />

        <!-- 3 Aerodynamic Rotor Blades -->
        <!-- Blade 1: Upward -->
        <path d="M 83 146 C 81 110, 70 70, 68 35 C 72 65, 84 105, 85 146 Z" fill="url(#bladeGrad)" stroke="#64748b" stroke-width="0.8" />
        <!-- Blade 2: Lower Right -->
        <path d="M 84 151 C 105 175, 130 215, 152 245 C 132 220, 105 185, 82 153 Z" fill="url(#bladeGrad)" stroke="#64748b" stroke-width="0.8" />
        <!-- Blade 3: Lower Left -->
        <path d="M 81 150 C 60 180, 42 215, 20 250 C 38 215, 60 180, 83 148 Z" fill="url(#bladeGrad)" stroke="#64748b" stroke-width="0.8" />

        <!-- Turbine Metadata Tag -->
        <rect x="35" y="295" width="55" height="18" rx="3" fill="#ffffff" stroke="#0284c7" stroke-width="1" />
        <text x="62" y="307" font-family="'JetBrains Mono', monospace" font-size="7" font-weight="800" fill="#0284c7" text-anchor="middle">WTG 2.0MW</text>
        <text x="62" y="325" font-family="'Inter', sans-serif" font-size="6.5" font-weight="700" fill="#64748b" text-anchor="middle">ROTOR DIA 110m</text>

        <!-- Technical Lead Line connecting Nacelle to Drivetrain -->
        <path d="M 150 149 L 205 149 C 215 149, 215 130, 228 130" fill="none" stroke="#0284c7" stroke-width="1.4" stroke-dasharray="3,3" />
        <circle cx="228" cy="130" r="2.5" fill="#0284c7" />
      </g>

      <!-- ==========================================
           SECTION 2: GEARBOX DRIVETRAIN & BORESCOPE INSPECTION (CENTER & RIGHT)
           ========================================== -->
      <g transform="translate(230, 25)">
        
        <!-- Header Banner for Schematic -->
        <rect x="0" y="0" width="490" height="22" rx="3" fill="#0f172a" />
        <text x="12" y="15" font-family="'Inter', sans-serif" font-size="8" font-weight="800" fill="#ffffff" letter-spacing="0.5">WIND TURBINE GEARBOX DRIVETRAIN • BORESCOPE AUDIT SCHEMATIC</text>
        <text x="478" y="15" font-family="'JetBrains Mono', monospace" font-size="7.5" font-weight="700" fill="#38bdf8" text-anchor="end">ISO 81400-4 / AGMA 6006</text>

        <!-- Main Cast Gearbox Housing Outer Profile -->
        <path d="M 20 80 L 70 50 L 220 50 L 330 65 L 430 85 L 450 190 L 410 240 L 220 245 L 60 235 L 20 180 Z" 
              fill="url(#gearboxShellGrad)" stroke="#0f172a" stroke-width="2" filter="url(#cardShadow)" />

        <!-- Structural Stiffening Ribs -->
        <g stroke="#475569" stroke-width="1.8" stroke-opacity="0.8">
          <line x1="70" y1="50" x2="60" y2="235" />
          <line x1="150" y1="50" x2="145" y2="242" />
          <line x1="220" y1="50" x2="220" y2="245" />
          <line x1="330" y1="65" x2="320" y2="238" />
          <line x1="20" y1="130" x2="445" y2="135" />
        </g>

        <!-- STAGE 1: Main Rotor Shaft & Planetary Stage (LSS) -->
        <!-- Main Rotor Shaft Flange -->
        <rect x="-10" y="95" width="30" height="85" rx="3" fill="url(#steelMechGrad)" stroke="#0f172a" stroke-width="1.5" />
        <!-- Bolt circle on Rotor Flange -->
        <circle cx="5" cy="108" r="3" fill="#0f172a" />
        <circle cx="5" cy="128" r="3" fill="#0f172a" />
        <circle cx="5" cy="148" r="3" fill="#0f172a" />
        <circle cx="5" cy="168" r="3" fill="#0f172a" />

        <!-- Planetary Ring Gear Outer Ring -->
        <circle cx="135" cy="145" r="62" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
        <circle cx="135" cy="145" r="54" fill="#0f172a" stroke="#64748b" stroke-width="1" stroke-dasharray="2,2" />

        <!-- 3 Planet Gears with Involute Teeth & Bearings -->
        <!-- Planet 1 (Top) -->
        <circle cx="135" cy="108" r="18" fill="url(#bronzeGearGrad)" stroke="#0f172a" stroke-width="1.2" />
        <circle cx="135" cy="108" r="8" fill="url(#steelMechGrad)" stroke="#0f172a" stroke-width="1" />
        <circle cx="135" cy="108" r="3" fill="#0f172a" />
        
        <!-- Planet 2 (Bottom Left) -->
        <circle cx="104" cy="165" r="18" fill="url(#bronzeGearGrad)" stroke="#0f172a" stroke-width="1.2" />
        <circle cx="104" cy="165" r="8" fill="url(#steelMechGrad)" stroke="#0f172a" stroke-width="1" />
        <circle cx="104" cy="165" r="3" fill="#0f172a" />

        <!-- Planet 3 (Bottom Right) -->
        <circle cx="166" cy="165" r="18" fill="url(#bronzeGearGrad)" stroke="#0f172a" stroke-width="1.2" />
        <circle cx="166" cy="165" r="8" fill="url(#steelMechGrad)" stroke="#0f172a" stroke-width="1" />
        <circle cx="166" cy="165" r="3" fill="#0f172a" />

        <!-- Center Sun Gear (LSS to Intermediate Stage) -->
        <circle cx="135" cy="145" r="13" fill="url(#steelMechGrad)" stroke="#0284c7" stroke-width="1.5" />
        <circle cx="135" cy="145" r="4.5" fill="#0f172a" />

        <!-- STAGE 2: Intermediate Helical Stage (IS) -->
        <path d="M 215 105 L 245 105 L 245 185 L 215 185 Z" fill="url(#steelMechGrad)" stroke="#0f172a" stroke-width="1.2" />
        <!-- IS Helical Bull Gear -->
        <ellipse cx="230" cy="145" rx="14" ry="42" fill="url(#bronzeGearGrad)" stroke="#0f172a" stroke-width="1.2" />
        <!-- Tapered Roller Bearings IS-A & IS-B -->
        <rect x="218" y="92" width="24" height="12" rx="2" fill="url(#steelMechGrad)" stroke="#0284c7" stroke-width="1" />
        <rect x="218" y="186" width="24" height="12" rx="2" fill="url(#steelMechGrad)" stroke="#0284c7" stroke-width="1" />

        <!-- STAGE 3: High Speed Pinion Stage (HSS) -->
        <path d="M 310 115 L 390 115 L 390 175 L 310 175 Z" fill="url(#steelMechGrad)" stroke="#0f172a" stroke-width="1.2" />
        <!-- HSS Helical Pinion -->
        <ellipse cx="335" cy="145" rx="12" ry="24" fill="url(#steelMechGrad)" stroke="#38bdf8" stroke-width="1.5" />
        <!-- High Speed Cylindrical / Spherical Roller Bearings HSS-GS & HSS-ROTOR -->
        <rect x="305" y="128" width="16" height="34" rx="2" fill="url(#steelMechGrad)" stroke="#0284c7" stroke-width="1" />
        <rect x="365" y="128" width="16" height="34" rx="2" fill="url(#steelMechGrad)" stroke="#0284c7" stroke-width="1" />

        <!-- Output Generator Coupling & Brake Disc -->
        <rect x="425" y="132" width="30" height="26" fill="url(#steelMechGrad)" stroke="#0f172a" stroke-width="1.5" />
        <ellipse cx="455" cy="145" rx="6" ry="38" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5" />
        <rect x="442" y="102" width="14" height="16" rx="2" fill="#ef4444" /> <!-- Brake Caliper -->

        <!-- Borescope Optical Probe Tube & Optical Inspection Cone -->
        <path d="M 335 40 L 335 110" fill="none" stroke="#0284c7" stroke-width="3.5" stroke-linecap="round" />
        <path d="M 325 35 L 345 35 L 340 48 L 330 48 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="1" />
        <!-- Borescope Cable -->
        <path d="M 335 35 C 335 15, 305 10, 275 12" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="3,2" />

        <!-- Borescope Light / Inspection Cone illuminating HSS mesh -->
        <polygon points="335,110 300,165 370,165" fill="url(#borescopeBeamGrad)" />

        <!-- Optical Target Crosshair on Pinion Tooth Flank -->
        <circle cx="335" cy="145" r="16" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3,2" />
        <circle cx="335" cy="145" r="24" fill="url(#targetGlow)" />
        <line x1="315" y1="145" x2="355" y2="145" stroke="#38bdf8" stroke-width="1.2" />
        <line x1="335" y1="125" x2="335" y2="165" stroke="#38bdf8" stroke-width="1.2" />
        <circle cx="335" cy="145" r="2.5" fill="#38bdf8" />

        <!-- Torque Arm Bushings (Mounting to Bedplate) -->
        <rect x="180" y="240" width="35" height="18" rx="3" fill="#1e293b" stroke="#64748b" stroke-width="1.2" />
        <circle cx="197" cy="249" r="4" fill="#f1f5f9" />
        <rect x="360" y="235" width="35" height="18" rx="3" fill="#1e293b" stroke="#64748b" stroke-width="1.2" />
        <circle cx="377" cy="244" r="4" fill="#f1f5f9" />

        <!-- ==========================================
             TECHNICAL CALLOUTS & ANNOTATION BADGES
             ========================================== -->
        <!-- Stage 1 Callout -->
        <g transform="translate(80, 260)">
          <rect x="0" y="0" width="110" height="20" rx="3" fill="#ffffff" stroke="#0284c7" stroke-width="1" />
          <text x="55" y="13" font-family="'Inter', sans-serif" font-size="6.8" font-weight="800" fill="#0f172a" text-anchor="middle">STAGE 1: PLANETARY</text>
          <line x1="55" y1="0" x2="80" y2="-25" stroke="#0284c7" stroke-width="1" stroke-dasharray="2,2" />
        </g>

        <!-- Stage 2 Callout -->
        <g transform="translate(205, 260)">
          <rect x="0" y="0" width="105" height="20" rx="3" fill="#ffffff" stroke="#0284c7" stroke-width="1" />
          <text x="52" y="13" font-family="'Inter', sans-serif" font-size="6.8" font-weight="800" fill="#0f172a" text-anchor="middle">STAGE 2: HELICAL IS</text>
          <line x1="52" y1="0" x2="30" y2="-25" stroke="#0284c7" stroke-width="1" stroke-dasharray="2,2" />
        </g>

        <!-- Stage 3 / Borescope Target Callout -->
        <g transform="translate(325, 260)">
          <rect x="0" y="0" width="145" height="28" rx="3" fill="#0284c7" stroke="#0369a1" stroke-width="1" />
          <text x="72" y="12" font-family="'Inter', sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">STAGE 3: HSS PINION &amp; BRG</text>
          <text x="72" y="22" font-family="'JetBrains Mono', monospace" font-size="6.2" font-weight="700" fill="#e0f2fe" text-anchor="middle">BORESCOPE AUDIT ZONE</text>
          <line x1="72" y1="0" x2="15" y2="-75" stroke="#38bdf8" stroke-width="1.2" />
          <circle cx="15" cy="-75" r="2.5" fill="#38bdf8" />
        </g>

        <!-- Bottom Engineering Scale Bar -->
        <g transform="translate(10, 290)">
          <line x1="0" y1="5" x2="160" y2="5" stroke="#64748b" stroke-width="1.5" />
          <line x1="0" y1="1" x2="0" y2="9" stroke="#64748b" stroke-width="1.5" />
          <line x1="80" y1="2" x2="80" y2="8" stroke="#64748b" stroke-width="1.2" />
          <line x1="160" y1="1" x2="160" y2="9" stroke="#64748b" stroke-width="1.5" />
          <text x="0" y="17" font-family="'JetBrains Mono', monospace" font-size="6" font-weight="700" fill="#64748b">0</text>
          <text x="75" y="17" font-family="'JetBrains Mono', monospace" font-size="6" font-weight="700" fill="#64748b">500</text>
          <text x="145" y="17" font-family="'JetBrains Mono', monospace" font-size="6" font-weight="700" fill="#64748b">1000 mm</text>
          <text x="260" y="17" font-family="'Inter', sans-serif" font-size="6.5" font-weight="700" fill="#475569">DRIVETRAIN ARCHITECTURE: 1P + 2H (PLANETARY + DUAL HELICAL)</text>
        </g>

      </g>
    </svg>
  `,

  // Gear Tooth Nomenclature & Damage Assessment Diagram for Appendix
  gearToothDiagram: `
    <svg viewBox="0 0 650 300" xmlns="http://www.w3.org/2000/svg" class="report-diagram-svg" style="max-width: 100%; height: auto;">
      <defs>
        <linearGradient id="toothGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#b0bec5" />
          <stop offset="50%" stop-color="#cfd8dc" />
          <stop offset="100%" stop-color="#78909c" />
        </linearGradient>
      </defs>

      <!-- Gear Tooth Profile -->
      <path d="M 80 270 
               C 120 270, 150 250, 160 210 
               C 170 170, 185 110, 220 50 
               L 380 50 
               C 415 110, 430 170, 440 210 
               C 450 250, 480 270, 520 270 Z" 
            fill="url(#toothGrad)" stroke="#263238" stroke-width="2.5" />

      <!-- Pitch Line (Dash) -->
      <line x1="60" y1="150" x2="540" y2="150" stroke="#d32f2f" stroke-width="2" stroke-dasharray="6,4" />

      <!-- Callout Labels & Indicator Boxes -->
      <!-- Top Land -->
      <line x1="300" y1="50" x2="300" y2="20" stroke="#1565c0" stroke-width="1.5" />
      <rect x="235" y="5" width="130" height="24" rx="4" fill="#e3f2fd" stroke="#1976d2" stroke-width="1.2" />
      <text x="300" y="21" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0d47a1" text-anchor="middle">Top Land</text>

      <!-- Addendum -->
      <line x1="400" y1="100" x2="480" y2="100" stroke="#1565c0" stroke-width="1.5" />
      <rect x="485" y="88" width="120" height="24" rx="4" fill="#e3f2fd" stroke="#1976d2" stroke-width="1.2" />
      <text x="545" y="104" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0d47a1" text-anchor="middle">Addendum</text>

      <!-- Pitchline label -->
      <rect x="485" y="138" width="120" height="24" rx="4" fill="#ffebee" stroke="#d32f2f" stroke-width="1.2" />
      <text x="545" y="154" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#b71c1c" text-anchor="middle">Pitchline</text>

      <!-- Dedendum -->
      <line x1="435" y1="200" x2="480" y2="200" stroke="#1565c0" stroke-width="1.5" />
      <rect x="485" y="188" width="120" height="24" rx="4" fill="#e3f2fd" stroke="#1976d2" stroke-width="1.2" />
      <text x="545" y="204" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0d47a1" text-anchor="middle">Dedendum</text>

      <!-- Active Profile -->
      <line x1="190" y1="120" x2="90" y2="120" stroke="#1565c0" stroke-width="1.5" />
      <rect x="10" y="108" width="120" height="24" rx="4" fill="#e3f2fd" stroke="#1976d2" stroke-width="1.2" />
      <text x="70" y="124" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0d47a1" text-anchor="middle">Active Profile</text>
    </svg>
  `,

  // High Speed Shaft (HSS) Bearing Configuration Schematic for Appendix
  hssBearingDiagram: `
    <svg viewBox="0 0 650 250" xmlns="http://www.w3.org/2000/svg" class="report-diagram-svg" style="max-width: 100%; height: auto;">
      <!-- Central High Speed Shaft -->
      <rect x="100" y="90" width="460" height="40" fill="#cfd8dc" stroke="#263238" stroke-width="2" />
      <line x1="80" y1="110" x2="580" y2="110" stroke="#455a64" stroke-width="1.5" stroke-dasharray="8,4" />

      <!-- Center Gear Pinion Section -->
      <rect x="290" y="70" width="80" height="80" fill="#90a4ae" stroke="#263238" stroke-width="2" />
      <line x1="290" y1="85" x2="370" y2="85" stroke="#37474f" stroke-width="1.5" />
      <line x1="290" y1="135" x2="370" y2="135" stroke="#37474f" stroke-width="1.5" />

      <!-- HSS-GS OB Bearing (Generator Side Outboard) -->
      <rect x="140" y="55" width="45" height="110" fill="#e0f2fe" stroke="#0284c7" stroke-width="2" />
      <line x1="140" y1="55" x2="185" y2="165" stroke="#0284c7" stroke-width="1.5" />
      <line x1="140" y1="165" x2="185" y2="55" stroke="#0284c7" stroke-width="1.5" />

      <!-- HSS-GS IB Bearing (Generator Side Inboard) -->
      <rect x="215" y="55" width="45" height="110" fill="#e0f2fe" stroke="#0284c7" stroke-width="2" />
      <line x1="215" y1="55" x2="260" y2="165" stroke="#0284c7" stroke-width="1.5" />
      <line x1="215" y1="165" x2="260" y2="55" stroke="#0284c7" stroke-width="1.5" />

      <!-- HSS-RS Bearing (Rotor Side) -->
      <rect x="420" y="55" width="55" height="110" fill="#fef3c7" stroke="#d97706" stroke-width="2" />
      <line x1="420" y1="55" x2="475" y2="165" stroke="#d97706" stroke-width="1.5" />
      <line x1="420" y1="165" x2="475" y2="55" stroke="#d97706" stroke-width="1.5" />

      <!-- Schematic Labels -->
      <rect x="120" y="15" width="90" height="24" rx="3" fill="#e0f2fe" stroke="#0284c7" stroke-width="1" />
      <text x="165" y="31" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">HSS-GS OB</text>
      <line x1="162" y1="39" x2="162" y2="55" stroke="#0284c7" stroke-width="1.2" />

      <rect x="195" y="15" width="90" height="24" rx="3" fill="#e0f2fe" stroke="#0284c7" stroke-width="1" />
      <text x="240" y="31" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">HSS-GS IB</text>
      <line x1="237" y1="39" x2="237" y2="55" stroke="#0284c7" stroke-width="1.2" />

      <rect x="400" y="15" width="95" height="24" rx="3" fill="#fef3c7" stroke="#d97706" stroke-width="1" />
      <text x="447" y="31" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#b45309" text-anchor="middle">HSS-RS</text>
      <line x1="447" y1="39" x2="447" y2="55" stroke="#d97706" stroke-width="1.2" />

      <!-- Side Labels -->
      <text x="110" y="200" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#37474f">◄ Generator Side (GS)</text>
      <text x="450" y="200" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#37474f">Rotor Side (RS) ►</text>
    </svg>
  `,

  // Company Brand Logo (Thendral Wind Power / Customizable)
  thendralLogo: `
    <svg viewBox="0 0 160 55" xmlns="http://www.w3.org/2000/svg" class="report-brand-logo">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0284c7" />
          <stop offset="100%" stop-color="#0369a1" />
        </linearGradient>
      </defs>
      <!-- Circular Turbine Badge -->
      <circle cx="28" cy="28" r="24" fill="url(#logoGrad)" />
      <!-- Turbine 3-Blade Graphic -->
      <g fill="#ffffff" transform="translate(28, 28)">
        <path d="M 0 0 C 2 -8 8 -16 12 -18 C 6 -12 2 -4 0 0 Z" />
        <path d="M 0 0 C 8 2 16 8 18 12 C 12 6 4 2 0 0 Z" transform="rotate(120)" />
        <path d="M 0 0 C 8 2 16 8 18 12 C 12 6 4 2 0 0 Z" transform="rotate(240)" />
        <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
        <circle cx="0" cy="0" r="1.5" fill="#0284c7" />
      </g>
      <!-- Brand Text -->
      <text x="60" y="25" font-family="'Segoe UI', Arial, sans-serif" font-size="18" font-weight="900" fill="#0f172a" letter-spacing="1">THENDRAL</text>
      <text x="60" y="42" font-family="'Segoe UI', Arial, sans-serif" font-size="10.5" font-weight="700" fill="#0284c7" letter-spacing="2">WIND SERVICES</text>
    </svg>
  `
};

class Diagrams {
  static getGearboxCoverSvg() {
    return DIAGRAMS.gearboxIllustration;
  }
  static getGearNomenclatureSvg() {
    return DIAGRAMS.gearToothDiagram;
  }
  static getHssBearingDiagramSvg() {
    return DIAGRAMS.hssBearingDiagram;
  }
  static getBrandLogoSvg() {
    return DIAGRAMS.thendralLogo;
  }
}
if (typeof window !== 'undefined') window.Diagrams = Diagrams;
if (typeof global !== 'undefined') global.Diagrams = Diagrams;
if (typeof module !== 'undefined') module.exports = { Diagrams, DIAGRAMS };
