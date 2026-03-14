'use client';

// ─── Animated Hero Visual ─────────────────────────────────────────────────────
// City skyline SVG + floating property cards + animated stat pills

export default function HeroVisual() {
  return (
    <div className="relative w-full h-full min-h-[420px] xl:min-h-[460px] select-none">

      {/* ── Central city skyline SVG ──────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-end justify-center pb-4 hero-scene-enter">
        <svg
          viewBox="0 0 420 280"
          className="w-full max-w-[420px] xl:max-w-[460px] drop-shadow-2xl"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Sky gradient */}
          <defs>
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0" />
              <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="bldgGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="bldgGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
            <linearGradient id="bldgGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="bldgGrad4" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
            <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e40af" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Ground reflection */}
          <ellipse cx="210" cy="278" rx="180" ry="12" fill="url(#groundGrad)" />

          {/* ── Far background buildings (muted) ── */}
          <rect x="20" y="180" width="30" height="96" rx="3" fill="#1e3a8a" opacity="0.5" />
          <rect x="380" y="190" width="28" height="86" rx="3" fill="#1e3a8a" opacity="0.5" />
          <rect x="355" y="165" width="22" height="111" rx="3" fill="#1e40af" opacity="0.45" />

          {/* ── Main buildings ── */}

          {/* Building 1 — left tower */}
          <rect x="38" y="140" width="50" height="136" rx="4" fill="url(#bldgGrad3)" />
          <rect x="40" y="128" width="46" height="16" rx="2" fill="#38bdf8" opacity="0.8" />
          {/* windows B1 */}
          {[150,167,184,201,218,235,252].map((y, i) => (
            <g key={i}>
              <rect x="45" y={y} width="9" height="7" rx="1" fill="#fef3c7" opacity={i % 3 === 0 ? 0.9 : 0.5} />
              <rect x="60" y={y} width="9" height="7" rx="1" fill="#fef3c7" opacity={i % 2 === 0 ? 0.9 : 0.4} />
              <rect x="73" y={y} width="9" height="7" rx="1" fill="#fef3c7" opacity={i % 3 === 1 ? 0.9 : 0.5} />
            </g>
          ))}

          {/* Building 2 — tallest center-left */}
          <rect x="112" y="80" width="68" height="196" rx="5" fill="url(#bldgGrad1)" />
          <rect x="124" y="62" width="44" height="22" rx="3" fill="#60a5fa" opacity="0.9" />
          <rect x="140" y="48" width="12" height="18" rx="2" fill="#93c5fd" />
          {/* antenna */}
          <line x1="146" y1="30" x2="146" y2="50" stroke="#bfdbfe" strokeWidth="1.5" />
          <circle cx="146" cy="28" r="3" fill="#fbbf24" className="hero-blink" filter="url(#glow)" />
          {/* windows B2 */}
          {[90,108,126,144,162,180,198,216,234,252].map((y, ri) => (
            <g key={ri}>
              {[120,135,150,163].map((x, ci) => (
                <rect key={ci} x={x} y={y} width="10" height="9" rx="1.5"
                  fill={(ri + ci) % 5 === 0 ? '#fde68a' : '#bfdbfe'}
                  opacity={(ri + ci) % 4 === 0 ? 0.95 : 0.6} />
              ))}
            </g>
          ))}

          {/* Building 3 — center (featured) */}
          <rect x="198" y="60" width="80" height="216" rx="6" fill="url(#bldgGrad2)" />
          {/* top cap */}
          <rect x="208" y="42" width="60" height="22" rx="4" fill="#818cf8" opacity="0.9" />
          <rect x="222" y="26" width="32" height="20" rx="3" fill="#a5b4fc" />
          <line x1="238" y1="5" x2="238" y2="28" stroke="#c7d2fe" strokeWidth="2" />
          <circle cx="238" cy="4" r="3.5" fill="#f59e0b" className="hero-blink" filter="url(#glow)" />
          {/* windows B3 */}
          {[70,88,106,124,142,160,178,196,214,232,250].map((y, ri) => (
            <g key={ri}>
              {[205,220,235,250,265].map((x, ci) => (
                <rect key={ci} x={x} y={y} width="10" height="10" rx="1.5"
                  fill={(ri * 3 + ci * 2) % 7 === 0 ? '#fde68a' : '#c7d2fe'}
                  opacity={(ri + ci) % 3 === 0 ? 0.95 : 0.55} />
              ))}
            </g>
          ))}

          {/* Building 4 — right-center */}
          <rect x="296" y="105" width="58" height="171" rx="4" fill="url(#bldgGrad4)" />
          <rect x="304" y="92" width="42" height="16" rx="2" fill="#a78bfa" opacity="0.9" />
          {/* windows B4 */}
          {[115,132,149,166,183,200,217,234,251].map((y, ri) => (
            <g key={ri}>
              {[303,318,333,343].map((x, ci) => (
                <rect key={ci} x={x} y={y} width="9" height="8" rx="1"
                  fill={(ri + ci) % 4 === 0 ? '#fef3c7' : '#ddd6fe'}
                  opacity={(ri * 2 + ci) % 5 === 0 ? 0.95 : 0.5} />
              ))}
            </g>
          ))}

          {/* Road / ground line */}
          <rect x="0" y="274" width="420" height="6" rx="0" fill="#1e3a8a" opacity="0.4" />
          {/* Road markings */}
          <rect x="60" y="276" width="20" height="2" rx="1" fill="white" opacity="0.25" />
          <rect x="100" y="276" width="20" height="2" rx="1" fill="white" opacity="0.25" />
          <rect x="200" y="276" width="20" height="2" rx="1" fill="white" opacity="0.25" />
          <rect x="280" y="276" width="20" height="2" rx="1" fill="white" opacity="0.25" />
          <rect x="340" y="276" width="20" height="2" rx="1" fill="white" opacity="0.25" />

          {/* ── Trees ── */}
          <ellipse cx="92" cy="260" rx="14" ry="18" fill="#15803d" opacity="0.85" />
          <rect x="89" y="266" width="6" height="10" fill="#92400e" opacity="0.7" />
          <ellipse cx="186" cy="265" rx="12" ry="15" fill="#16a34a" opacity="0.8" />
          <rect x="183" y="270" width="5" height="8" fill="#92400e" opacity="0.7" />
          <ellipse cx="380" cy="262" rx="13" ry="16" fill="#15803d" opacity="0.8" />

          {/* ── Stars in sky ── */}
          {[[30,20],[60,10],[100,35],[170,15],[300,25],[350,12],[400,30],[70,55],[320,45]].map(([x,y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.5 : 1} fill="white"
              opacity={0.4 + (i % 4) * 0.15} className={i % 2 === 0 ? 'hero-blink' : ''} />
          ))}

          {/* ── Moon ── */}
          <circle cx="385" cy="28" r="14" fill="#fef3c7" opacity="0.9" />
          <circle cx="392" cy="22" r="11" fill="#1e3a5f" opacity="0.85" />
        </svg>
      </div>

      {/* ── Floating property card — top left ─────────────────────────────── */}
      <div className="absolute top-4 left-0 xl:-left-4 hero-float-1">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 p-3 w-48">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 text-base">🏠</div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-gray-800 truncate">3 BHK Apartment</p>
              <p className="text-[10px] text-gray-400 truncate flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5 fill-gray-400" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                Bandra West, Mumbai
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-primary-600">₹1.2 Cr</p>
            <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">✓ Verified</span>
          </div>
          <div className="flex gap-1.5 mt-1.5">
            <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">1200 sq.ft</span>
            <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">3 Bath</span>
            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-semibold">For Sale</span>
          </div>
        </div>
      </div>

      {/* ── Floating stats pill — top right ───────────────────────────────── */}
      <div className="absolute top-6 right-0 xl:-right-2 hero-float-2">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-xl shadow-primary-600/30 p-3 text-white w-44">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
            </div>
            <div>
              <p className="text-[10px] text-primary-200 font-medium">Active Listings</p>
              <p className="text-base font-black leading-tight">50,000+</p>
            </div>
          </div>
          <div className="h-px bg-white/20 mb-2" />
          <div className="flex justify-between text-[10px] text-primary-200">
            <span>📍 Mumbai</span>
            <span>📍 Delhi</span>
            <span>📍 Pune</span>
          </div>
        </div>
      </div>

      {/* ── Sold badge — middle left ───────────────────────────────────────── */}
      <div className="absolute top-[44%] -left-1 xl:-left-6 hero-float-3">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 px-3 py-2 flex items-center gap-2">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 fill-green-600" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-800">Deal Closed!</p>
            <p className="text-[9px] text-gray-400">Villa · ₹3.8 Cr</p>
          </div>
        </div>
      </div>

      {/* ── New listing pill — middle right ───────────────────────────────── */}
      <div className="absolute top-[38%] right-0 xl:-right-4 hero-float-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 px-3 py-2 flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 fill-amber-500" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-800">New Listing</p>
            <p className="text-[9px] text-gray-400">2 BHK · ₹45K/mo</p>
          </div>
        </div>
      </div>

      {/* ── Rating pill — bottom ──────────────────────────────────────────── */}
      <div className="absolute bottom-10 left-4 xl:left-0 hero-float-2" style={{ animationDelay: '1.5s' }}>
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              {['bg-blue-400','bg-green-400','bg-purple-400','bg-orange-400'].map((c,i) => (
                <div key={i} className={`w-5 h-5 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-[8px] font-bold`}>
                  {['R','M','A','S'][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <svg key={s} className="w-2.5 h-2.5 fill-yellow-400" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="text-[9px] text-gray-500 font-medium">10K+ happy buyers</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pulsing ring behind the tallest building ──────────────────────── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[55%] pointer-events-none">
        <div className="w-24 h-24 rounded-full border border-primary-400/20 hero-pulse-ring" />
        <div className="absolute inset-0 w-24 h-24 rounded-full border border-blue-400/15 hero-pulse-ring" style={{ animationDelay: '0.7s' }} />
      </div>

    </div>
  );
}
