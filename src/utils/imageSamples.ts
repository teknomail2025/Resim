import { SampleImage } from '../types';

// Helper to convert SVG string to base64 data URL
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

// 1. Japanese Ramen Restaurant Menu & Signboard
const japaneseSignSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b45309"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
    <radialGradient id="lantern" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)" />
  <rect x="40" y="40" width="720" height="520" rx="16" fill="#1c1917" stroke="#44403c" stroke-width="4"/>
  
  <!-- Red header banner -->
  <rect x="80" y="70" width="640" height="90" rx="12" fill="#dc2626" />
  <text x="400" y="130" font-family="'Noto Sans JP', sans-serif" font-weight="900" font-size="44" fill="#fef08a" text-anchor="middle" letter-spacing="4">特製ラーメン 専門店</text>

  <!-- Notice board -->
  <rect x="80" y="180" width="640" height="50" rx="8" fill="#ca8a04"/>
  <text x="400" y="215" font-family="'Noto Sans JP', sans-serif" font-weight="700" font-size="22" fill="#ffffff" text-anchor="middle">本日のおすすめメニュー</text>

  <!-- Items list -->
  <g transform="translate(100, 260)">
    <!-- Item 1 -->
    <rect x="0" y="0" width="280" height="120" rx="8" fill="#292524" stroke="#57534e"/>
    <text x="20" y="40" font-family="'Noto Sans JP', sans-serif" font-weight="bold" font-size="22" fill="#fafaf9">濃厚豚骨醤油</text>
    <text x="20" y="70" font-family="'Noto Sans JP', sans-serif" font-size="14" fill="#a8a29e">チャーシュー・煮玉子入り</text>
    <text x="20" y="100" font-family="'Noto Sans JP', sans-serif" font-weight="bold" font-size="20" fill="#f87171">¥ 950 (税込)</text>

    <!-- Item 2 -->
    <rect x="320" y="0" width="280" height="120" rx="8" fill="#292524" stroke="#57534e"/>
    <text x="340" y="40" font-family="'Noto Sans JP', sans-serif" font-weight="bold" font-size="22" fill="#fafaf9">辛味噌ラーメン</text>
    <text x="340" y="70" font-family="'Noto Sans JP', sans-serif" font-size="14" fill="#a8a29e">自家製ピリ辛スープ</text>
    <text x="340" y="100" font-family="'Noto Sans JP', sans-serif" font-weight="bold" font-size="20" fill="#f87171">¥ 1,000 (税込)</text>

    <!-- Item 3 -->
    <rect x="0" y="140" width="280" height="110" rx="8" fill="#292524" stroke="#57534e"/>
    <text x="20" y="180" font-family="'Noto Sans JP', sans-serif" font-weight="bold" font-size="22" fill="#fafaf9">焼き餃子 (6個)</text>
    <text x="20" y="225" font-family="'Noto Sans JP', sans-serif" font-weight="bold" font-size="20" fill="#f87171">¥ 450</text>

    <!-- Item 4 -->
    <rect x="320" y="140" width="280" height="110" rx="8" fill="#292524" stroke="#57534e"/>
    <text x="340" y="180" font-family="'Noto Sans JP', sans-serif" font-weight="bold" font-size="22" fill="#fafaf9">生ビール (中)</text>
    <text x="340" y="225" font-family="'Noto Sans JP', sans-serif" font-weight="bold" font-size="20" fill="#f87171">¥ 550</text>
  </g>

  <!-- Bottom notice -->
  <rect x="80" y="500" width="640" height="40" rx="6" fill="#1e293b"/>
  <text x="400" y="525" font-family="'Noto Sans JP', sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">営業時間: 11:30 - 22:00 (ラストオーダー 21:30) • 水曜定休</text>
</svg>`;

// 2. English Airport Signboard
const englishAirportSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="airportBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#airportBg)" />
  
  <!-- Main yellow signage bar -->
  <rect x="40" y="40" width="720" height="120" rx="12" fill="#eab308"/>
  <text x="80" y="115" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="800" font-size="42" fill="#000000">INTERNATIONAL DEPARTURES</text>
  
  <!-- Gate directions card -->
  <rect x="40" y="180" width="720" height="170" rx="12" fill="#1e293b" stroke="#334155" stroke-width="2"/>
  <text x="80" y="235" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="700" font-size="28" fill="#f8fafc">Gates B1 - B24</text>
  <text x="80" y="270" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="16" fill="#94a3b8">Straight ahead • Walk time: 5 minutes</text>
  <text x="80" y="315" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="700" font-size="24" fill="#38bdf8">Passport Control &amp; Security Check</text>

  <!-- Baggage & Customs card -->
  <rect x="40" y="370" width="720" height="180" rx="12" fill="#0284c7"/>
  <text x="80" y="425" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="800" font-size="28" fill="#ffffff">Baggage Claim &amp; Customs</text>
  <text x="80" y="465" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="18" fill="#e0f2fe">Keep your boarding pass and declaration ready</text>
  
  <rect x="80" y="490" width="220" height="40" rx="6" fill="#0c4a6e"/>
  <text x="190" y="516" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="700" font-size="15" fill="#bae6fd" text-anchor="middle">Car Rental &amp; Metro →</text>

  <rect x="320" y="490" width="220" height="40" rx="6" fill="#0c4a6e"/>
  <text x="430" y="516" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="700" font-size="15" fill="#bae6fd" text-anchor="middle">Currency Exchange 💱</text>
</svg>`;

// 3. German Industrial Safety Sign
const germanSignSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#f8fafc"/>
  
  <rect x="40" y="40" width="720" height="520" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
  
  <!-- Red header -->
  <rect x="60" y="60" width="680" height="110" rx="8" fill="#dc2626"/>
  <text x="400" y="130" font-family="Arial, sans-serif" font-weight="900" font-size="44" fill="#ffffff" text-anchor="middle" letter-spacing="2">ACHTUNG! GEFAHR</text>

  <!-- Warning yellow box -->
  <rect x="60" y="190" width="680" height="80" rx="8" fill="#fef08a" stroke="#eab308" stroke-width="2"/>
  <text x="400" y="240" font-family="Arial, sans-serif" font-weight="800" font-size="24" fill="#854d0e" text-anchor="middle">BETRETEN DER BAUSTELLE VERBOTEN</text>

  <!-- Rules -->
  <g transform="translate(90, 300)">
    <rect x="0" y="0" width="620" height="60" rx="6" fill="#f1f5f9"/>
    <text x="25" y="38" font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="#0f172a">1. Schutzhelm und Sicherheitsschuhe tragen</text>

    <rect x="0" y="75" width="620" height="60" rx="6" fill="#f1f5f9"/>
    <text x="25" y="113" font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="#0f172a">2. Unbefugten ist der Zutritt strengstens untersagt</text>

    <rect x="0" y="150" width="620" height="60" rx="6" fill="#f1f5f9"/>
    <text x="25" y="188" font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="#0f172a">3. Bei Notfällen sofort den Werksleiter informieren</text>
  </g>

  <text x="400" y="535" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="#64748b" text-anchor="middle">Eltern haften für ihre Kinder</text>
</svg>`;

// 4. French Cafe Blackboard Menu
const frenchCafeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#1e1b18"/>
  <rect x="30" y="30" width="740" height="540" rx="16" fill="#2d2a26" stroke="#92400e" stroke-width="12"/>
  
  <text x="400" y="105" font-family="'Georgia', serif" font-style="italic" font-weight="bold" font-size="38" fill="#fef3c7" text-anchor="middle">Le Petit Bistro Parisien</text>
  <text x="400" y="145" font-family="'Georgia', serif" font-size="20" fill="#fcd34d" text-anchor="middle">Menu du Jour &amp; Boissons</text>
  <line x1="150" y1="165" x2="650" y2="165" stroke="#fcd34d" stroke-width="2" stroke-dasharray="8 4"/>

  <g transform="translate(80, 200)">
    <!-- Column 1 -->
    <text x="0" y="30" font-family="'Georgia', serif" font-weight="bold" font-size="22" fill="#ffffff">Croissant au Beurre Frais</text>
    <text x="280" y="30" font-family="'Georgia', serif" font-weight="bold" font-size="20" fill="#fde68a">2,80 €</text>

    <text x="0" y="80" font-family="'Georgia', serif" font-weight="bold" font-size="22" fill="#ffffff">Café Crème Artisanal</text>
    <text x="280" y="80" font-family="'Georgia', serif" font-weight="bold" font-size="20" fill="#fde68a">3,50 €</text>

    <text x="0" y="130" font-family="'Georgia', serif" font-weight="bold" font-size="22" fill="#ffffff">Soupe à l'Oignon Gratinée</text>
    <text x="280" y="130" font-family="'Georgia', serif" font-weight="bold" font-size="20" fill="#fde68a">8,50 €</text>

    <text x="0" y="180" font-family="'Georgia', serif" font-weight="bold" font-size="22" fill="#ffffff">Quiche Lorraine du Chef</text>
    <text x="280" y="180" font-family="'Georgia', serif" font-weight="bold" font-size="20" fill="#fde68a">9,20 €</text>

    <text x="0" y="230" font-family="'Georgia', serif" font-weight="bold" font-size="22" fill="#ffffff">Tarte Tatin aux Pommes</text>
    <text x="280" y="230" font-family="'Georgia', serif" font-weight="bold" font-size="20" fill="#fde68a">6,00 €</text>

    <!-- Right column / notice -->
    <rect x="360" y="10" width="280" height="230" rx="8" fill="#18181b" stroke="#52525b"/>
    <text x="500" y="55" font-family="'Georgia', serif" font-weight="bold" font-size="22" fill="#38bdf8" text-anchor="middle">Formule Midi</text>
    <text x="500" y="90" font-family="'Georgia', serif" font-size="16" fill="#e2e8f0" text-anchor="middle">Entrée + Plat ou Plat + Dessert</text>
    <text x="500" y="130" font-family="'Georgia', serif" font-weight="bold" font-size="28" fill="#4ade80" text-anchor="middle">16,50 €</text>
    <text x="500" y="170" font-family="'Georgia', serif" font-size="14" fill="#94a3b8" text-anchor="middle">Servi de 12h à 14h30</text>
    <text x="500" y="205" font-family="'Georgia', serif" font-style="italic" font-size="14" fill="#cbd5e1" text-anchor="middle">Service compris</text>
  </g>

  <text x="400" y="525" font-family="'Georgia', serif" font-style="italic" font-size="16" fill="#a1a1aa" text-anchor="middle">Paiement par carte bancaire accepté • Wifi Gratuit</text>
</svg>`;

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sample-jp',
    title: 'Japonca Restoran Menüsü',
    sourceLang: 'Japonca',
    description: 'Ramen ve meşrubat dükkanı fiyat & menü panosu',
    dataUrl: svgToDataUrl(japaneseSignSvg),
  },
  {
    id: 'sample-en',
    title: 'Havalimanı Yön Tabelası',
    sourceLang: 'İngilizce',
    description: 'Dış hatlar kalkış, pasaport kontrolü ve kapı yönleri',
    dataUrl: svgToDataUrl(englishAirportSvg),
  },
  {
    id: 'sample-de',
    title: 'Almanca Güvenlik & Uyarı Levhası',
    sourceLang: 'Almanca',
    description: 'Şantiye tehlike ve baret zorunluluğu kuralları',
    dataUrl: svgToDataUrl(germanSignSvg),
  },
  {
    id: 'sample-fr',
    title: 'Fransız Kafe Kara Tahtası',
    sourceLang: 'Fransızca',
    description: 'Günün menüsü, kruvasan ve kahve fiyatları',
    dataUrl: svgToDataUrl(frenchCafeSvg),
  },
];
