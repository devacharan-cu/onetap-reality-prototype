// Unit test for the exact Art Fair poster fields and placeholder rejection
const { isPlaceholder, hasEvidence, hasPhoneEvidence, hasUrlEvidence } = (() => {
  const PLACEHOLDER_PATTERNS = [
    /\b123[-.\s]?456[-.\s]?7890\b/i,
    /\b555[-.\s]?555[-.\s]?5555\b/i,
    /\b000[-.\s]?000[-.\s]?0000\b/i,
    /\b111[-.\s]?111[-.\s]?1111\b/i,
    /\b987[-.\s]?654[-.\s]?3210\b/i,
    /\b123456789\d?\b/i,
    /\b0123456789\b/i,
    /\b(\d)\1{6,}\b/,
    /\b123\s+anywhere\s*(st|street|ave|avenue|rd|road)?\b/i,
    /\banywhere\s+(st|street|ave|avenue|rd|road)\b/i,
    /\bany\s+city\b/i,
    /\bcity,\s*state\b/i,
    /\byour\s+city\b/i,
    /\byour\s+address\b/i,
    /\b123\s+main\s+st\b/i,
    /\baddress\s+here\b/i,
    /\blocation\s+here\b/i,
    /\breallygreatsite\.com\b/i,
    /\bexample\.com\b/i,
    /\byoursite\.com\b/i,
    /\bwebsite\.com\b/i,
    /\bcompanyname\.com\b/i,
    /\bdomain\.com\b/i,
    /\btest\.com\b/i,
    /\byourdomain\.com\b/i,
    /\bwww\.reallygreatsite\b/i,
    /\blorem\s+ipsum\b/i,
    /\bplaceholder\b/i,
    /\bdummy\b/i,
  ];

  function isPlaceholder(value) {
    if (!value) return true;
    const clean = value.trim();
    if (!clean || clean.toLowerCase() === 'not mentioned') return true;
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(clean)) return true;
    }
    const lower = clean.toLowerCase();
    if (
      lower.includes('reallygreatsite') ||
      lower.includes('anywhere st') ||
      lower.includes('any city') ||
      lower.includes('123-456-7890') ||
      lower.includes('1234567890') ||
      lower.includes('lorem ipsum') ||
      lower.includes('your website') ||
      lower.includes('your company')
    ) {
      return true;
    }
    return false;
  }

  function normalize(value) {
    if (!value) return '';
    return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function isGenericEvidence(evidence) {
    if (!evidence) return true;
    const norm = normalize(evidence);
    if (!norm || norm.length < 2) return true;
    return (
      norm === 'visible in image' ||
      norm === 'on poster' ||
      norm === 'in image' ||
      norm === 'seen on screen' ||
      norm === 'text on image'
    );
  }

  function hasEvidence(value, evidence) {
    if (!value || !evidence) return false;
    if (isPlaceholder(value) || isPlaceholder(evidence)) return false;
    if (isGenericEvidence(evidence)) return false;
    const v = normalize(value);
    const e = normalize(evidence);
    if (!v || !e) return false;
    if (e.includes(v) || v.includes(e)) return true;
    const words = v.split(' ').filter(w => w.length > 1);
    if (words.length === 0) return false;
    const matches = words.filter(w => e.includes(w));
    return matches.length / words.length >= 0.5;
  }

  function hasPhoneEvidence(value, evidence) {
    if (!value || !evidence) return false;
    if (isPlaceholder(value) || isPlaceholder(evidence)) return false;
    if (isGenericEvidence(evidence)) return false;
    const valDigits = value.replace(/\D/g, '');
    const eviDigits = evidence.replace(/\D/g, '');
    if (valDigits.length < 7 || eviDigits.length < 7) return false;
    if (/^(\d)\1+$/.test(valDigits)) return false;
    return eviDigits.includes(valDigits) || valDigits.includes(eviDigits);
  }

  function hasUrlEvidence(value, evidence) {
    if (!value || !evidence) return false;
    if (isPlaceholder(value) || isPlaceholder(evidence)) return false;
    if (isGenericEvidence(evidence)) return false;
    const normVal = value.replace(/^https?:\/\//i, '').replace(/^www\./i, '').toLowerCase();
    const normEvi = evidence.replace(/^https?:\/\//i, '').replace(/^www\./i, '').toLowerCase();
    return normEvi.includes(normVal) || normVal.includes(normEvi);
  }

  return { isPlaceholder, hasEvidence, hasPhoneEvidence, hasUrlEvidence };
})();

const rawEntities = {
  eventTitle: "ART FAIR",
  date: "10TH-18TH OCTOBER",
  price: "FREE ENTRY",
  organization: "BORCELLE COLLEGE",
  location: "123 ANYWHERE ST., ANY CITY",
  phoneNumber: "123-456-7890",
  website: "WWW.REALLYGREATSITE.COM"
};

const rawEvidence = {
  eventTitle: "ART FAIR",
  date: "10TH-18TH OCTOBER",
  price: "FREE ENTRY",
  organization: "BORCELLE COLLEGE",
  location: "123 ANYWHERE ST., ANY CITY",
  phoneNumber: "123-456-7890",
  website: "WWW.REALLYGREATSITE.COM"
};

const eventValid = hasEvidence(rawEntities.eventTitle, rawEvidence.eventTitle);
const dateValid = hasEvidence(rawEntities.date, rawEvidence.date);
const priceValid = hasEvidence(rawEntities.price, rawEvidence.price);
const orgValid = hasEvidence(rawEntities.organization, rawEvidence.organization);
const locValid = hasEvidence(rawEntities.location, rawEvidence.location);
const phoneValid = hasPhoneEvidence(rawEntities.phoneNumber, rawEvidence.phoneNumber);
const webValid = hasUrlEvidence(rawEntities.website, rawEvidence.website);

console.log("ART FAIR is valid:", eventValid === true);
console.log("10TH-18TH OCTOBER is valid:", dateValid === true);
console.log("FREE ENTRY is valid:", priceValid === true);
console.log("BORCELLE COLLEGE is valid:", orgValid === true);
console.log("123 ANYWHERE ST., ANY CITY is rejected:", locValid === false);
console.log("123-456-7890 is rejected:", phoneValid === false);
console.log("WWW.REALLYGREATSITE.COM is rejected:", webValid === false);

