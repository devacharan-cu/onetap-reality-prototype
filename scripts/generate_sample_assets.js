const fs = require('fs');
const path = require('path');

const samplesDir = path.join(__dirname, '..', 'public', 'samples');
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

// 1. Business Card
const businessCardSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#141c2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#818cf8"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" rx="24" fill="url(#bg)" stroke="#334155" stroke-width="2"/>
  <circle cx="700" cy="100" r="140" fill="#38bdf8" opacity="0.06"/>
  <circle cx="100" cy="420" r="100" fill="#818cf8" opacity="0.06"/>
  
  <text x="60" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800" fill="url(#accent)" letter-spacing="2">APEX QUANTUM LABS</text>
  <line x1="60" y1="110" x2="280" y2="110" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
  
  <text x="60" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="700" fill="#f8fafc">Dr. Elena Rostova</text>
  <text x="60" y="250" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="500" fill="#94a3b8">Principal AI Research Architect</text>
  
  <g transform="translate(60, 310)" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#cbd5e1">
    <text x="0" y="25" fill="#38bdf8">Phone:</text>
    <text x="80" y="25" font-weight="600">+1 (415) 890-2411</text>
    
    <text x="0" y="65" fill="#38bdf8">Email:</text>
    <text x="80" y="65" font-weight="600">elena.rostova@apexquantum.ai</text>
    
    <text x="0" y="105" fill="#38bdf8">Web:</text>
    <text x="80" y="105" font-weight="600">https://apexquantum.ai</text>
    
    <text x="0" y="145" fill="#38bdf8">Office:</text>
    <text x="80" y="145" font-weight="600">450 Mission St, San Francisco, CA</text>
  </g>
</svg>`;

// 2. Receipt
const receiptSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850">
  <rect width="600" height="850" fill="#fafafa" stroke="#e4e4e7" stroke-width="2"/>
  
  <g font-family="Courier, monospace" fill="#18181b">
    <text x="300" y="70" font-size="24" font-weight="bold" text-anchor="middle">BLUE BOTTLE COFFEE</text>
    <text x="300" y="100" font-size="14" text-anchor="middle">315 Linden St, San Francisco, CA</text>
    <text x="300" y="125" font-size="13" text-anchor="middle">Tel: (415) 252-7735</text>
    
    <line x1="40" y1="150" x2="560" y2="150" stroke="#71717a" stroke-dasharray="4"/>
    
    <text x="40" y="180" font-size="13">Date: Oct 24, 2026</text>
    <text x="440" y="180" font-size="13">Time: 10:42 AM</text>
    <text x="40" y="205" font-size="13">Order # 4108</text>
    <text x="440" y="205" font-size="13">Cashier: Alex M.</text>
    
    <line x1="40" y1="230" x2="560" y2="230" stroke="#18181b" stroke-width="2"/>
    
    <text x="40" y="260" font-size="14" font-weight="bold">ITEM</text>
    <text x="360" y="260" font-size="14" font-weight="bold">QTY</text>
    <text x="500" y="260" font-size="14" font-weight="bold">PRICE</text>
    
    <line x1="40" y1="280" x2="560" y2="280" stroke="#e4e4e7"/>
    
    <text x="40" y="320" font-size="15">Oat Milk Vanilla Latte</text>
    <text x="375" y="320" font-size="15">1</text>
    <text x="510" y="320" font-size="15">$6.75</text>
    
    <text x="40" y="365" font-size="15">Almond Butter Croissant</text>
    <text x="375" y="365" font-size="15">1</text>
    <text x="510" y="365" font-size="15">$5.50</text>
    
    <text x="40" y="410" font-size="15">Avocado Sourdough Toast</text>
    <text x="375" y="410" font-size="15">1</text>
    <text x="500" y="410" font-size="15">$11.25</text>
    
    <line x1="40" y1="460" x2="560" y2="460" stroke="#71717a" stroke-dasharray="4"/>
    
    <text x="40" y="500" font-size="15">SUBTOTAL</text>
    <text x="500" y="500" font-size="15">$23.50</text>
    
    <text x="40" y="535" font-size="15">TAX (8.625%)</text>
    <text x="510" y="535" font-size="15">$2.03</text>
    
    <line x1="40" y1="565" x2="560" y2="565" stroke="#18181b" stroke-width="2"/>
    
    <text x="40" y="605" font-size="18" font-weight="bold">TOTAL AMOUNT</text>
    <text x="490" y="605" font-size="20" font-weight="bold">$25.53</text>
    
    <line x1="40" y1="640" x2="560" y2="640" stroke="#18181b" stroke-width="2"/>
    
    <text x="300" y="700" font-size="14" text-anchor="middle">Payment: Visa ending in 9042</text>
    <text x="300" y="735" font-size="15" font-weight="bold" text-anchor="middle">THANK YOU FOR VISITING!</text>
    <text x="300" y="765" font-size="12" text-anchor="middle">www.bluebottlecoffee.com</text>
  </g>
</svg>`;

// 3. Menu
const menuSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="900" viewBox="0 0 700 900">
  <rect width="700" height="900" fill="#18181b" rx="20"/>
  <rect x="20" y="20" width="660" height="860" fill="none" stroke="#eab308" stroke-width="2" rx="14"/>
  
  <g font-family="system-ui, -apple-system, sans-serif" fill="#fef08a" text-anchor="middle">
    <text x="350" y="80" font-size="32" font-weight="bold" letter-spacing="3">TRATTORIA BELLA</text>
    <text x="350" y="110" font-size="14" fill="#a1a1aa" letter-spacing="1">AUTHENTIC WOOD-FIRED ITALIAN CUISINE</text>
    <line x1="200" y1="130" x2="500" y2="130" stroke="#eab308" stroke-width="1"/>
  </g>
  
  <g font-family="system-ui, -apple-system, sans-serif" fill="#f4f4f5">
    <!-- Section 1 -->
    <text x="60" y="180" font-size="20" font-weight="bold" fill="#eab308">PIZZA CLASSICA</text>
    
    <text x="60" y="220" font-size="16" font-weight="600">Margherita D.O.P.</text>
    <text x="590" y="220" font-size="16" font-weight="bold" fill="#eab308" text-anchor="end">₹499</text>
    <text x="60" y="245" font-size="12" fill="#a1a1aa">San Marzano tomatoes, buffalo mozzarella, fresh basil</text>
    
    <text x="60" y="290" font-size="16" font-weight="600">Quattro Formaggi</text>
    <text x="590" y="290" font-size="16" font-weight="bold" fill="#eab308" text-anchor="end">₹599</text>
    <text x="60" y="315" font-size="12" fill="#a1a1aa">Mozzarella, gorgonzola, parmesan, ricotta, truffle honey</text>
    
    <text x="60" y="360" font-size="16" font-weight="600">Diavola Piccante</text>
    <text x="590" y="360" font-size="16" font-weight="bold" fill="#eab308" text-anchor="end">₹549</text>
    <text x="60" y="385" font-size="12" fill="#a1a1aa">Spicy salami, chili oil, smoked provolone, oregano</text>
    
    <!-- Section 2 -->
    <text x="60" y="450" font-size="20" font-weight="bold" fill="#eab308">HANDMADE PASTA</text>
    
    <text x="60" y="490" font-size="16" font-weight="600">Truffle Tagliolini</text>
    <text x="590" y="490" font-size="16" font-weight="bold" fill="#eab308" text-anchor="end">₹680</text>
    <text x="60" y="515" font-size="12" fill="#a1a1aa">Black truffle butter, parmigiano reggiano 24 months</text>
    
    <text x="60" y="560" font-size="16" font-weight="600">Spaghetti Carbonara</text>
    <text x="590" y="560" font-size="16" font-weight="bold" fill="#eab308" text-anchor="end">₹520</text>
    <text x="60" y="585" font-size="12" fill="#a1a1aa">Guanciale, pecorino romano, egg yolks, black pepper</text>
    
    <!-- Section 3 -->
    <text x="60" y="650" font-size="20" font-weight="bold" fill="#eab308">DESSERTS</text>
    
    <text x="60" y="690" font-size="16" font-weight="600">Classic Tiramisu</text>
    <text x="590" y="690" font-size="16" font-weight="bold" fill="#eab308" text-anchor="end">₹320</text>
    <text x="60" y="715" font-size="12" fill="#a1a1aa">Espresso-soaked savoiardi, mascarpone cream, cocoa</text>
    
    <line x1="60" y1="760" x2="640" y2="760" stroke="#3f3f46"/>
    
    <text x="350" y="800" font-size="13" fill="#a1a1aa" text-anchor="middle">Reservations: +91 98112 34567 | Open Tue–Sun: 12:30 PM – 11:00 PM</text>
    <text x="350" y="825" font-size="13" fill="#a1a1aa" text-anchor="middle">18 Park Street, Indiranagar, Bengaluru</text>
  </g>
</svg>`;

// 4. Product Packaging
const productSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700" viewBox="0 0 700 700">
  <defs>
    <linearGradient id="pbg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="700" height="700" rx="30" fill="url(#pbg)" stroke="#1e293b" stroke-width="2"/>
  
  <text x="60" y="100" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="900" fill="#38bdf8" letter-spacing="3">SONY</text>
  <text x="60" y="170" font-family="system-ui, -apple-system, sans-serif" font-size="42" font-weight="800" fill="#f8fafc">WH-1000XM5</text>
  <text x="60" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="500" fill="#94a3b8">Wireless Noise Canceling Headphones</text>
  
  <g transform="translate(60, 280)" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#e2e8f0">
    <rect x="0" y="0" width="260" height="80" rx="16" fill="#1e293b" stroke="#334155"/>
    <text x="20" y="35" font-size="13" fill="#38bdf8" font-weight="700">BATTERY LIFE</text>
    <text x="20" y="62" font-size="20" font-weight="bold">Up to 30 Hours</text>
    
    <rect x="290" y="0" width="260" height="80" rx="16" fill="#1e293b" stroke="#334155"/>
    <text x="310" y="35" font-size="13" fill="#38bdf8" font-weight="700">AUDIO CODEC</text>
    <text x="310" y="62" font-size="20" font-weight="bold">LDAC &amp; Hi-Res</text>
    
    <rect x="0" y="100" width="260" height="80" rx="16" fill="#1e293b" stroke="#334155"/>
    <text x="20" y="135" font-size="13" fill="#38bdf8" font-weight="700">NOISE CANCELING</text>
    <text x="20" y="162" font-size="20" font-weight="bold">Dual Processor V1</text>
    
    <rect x="290" y="100" width="260" height="80" rx="16" fill="#1e293b" stroke="#334155"/>
    <text x="310" y="135" font-size="13" fill="#38bdf8" font-weight="700">CONNECTIVITY</text>
    <text x="310" y="162" font-size="20" font-weight="bold">Bluetooth 5.2</text>
  </g>
  
  <g transform="translate(60, 540)" font-family="system-ui, -apple-system, sans-serif">
    <text x="0" y="30" font-size="16" fill="#94a3b8">Model: WH1000XM5/B</text>
    <text x="0" y="60" font-size="16" fill="#94a3b8">Warranty: 1 Year Limited Hardware Warranty</text>
    <text x="0" y="95" font-size="28" font-weight="bold" fill="#38bdf8">MSRP: ₹29,990 (incl. taxes)</text>
  </g>
</svg>`;

fs.writeFileSync(path.join(samplesDir, 'business_card.svg'), businessCardSvg);
fs.writeFileSync(path.join(samplesDir, 'receipt.svg'), receiptSvg);
fs.writeFileSync(path.join(samplesDir, 'menu.svg'), menuSvg);
fs.writeFileSync(path.join(samplesDir, 'product.svg'), productSvg);

console.log('Sample vector assets generated successfully in public/samples/');
