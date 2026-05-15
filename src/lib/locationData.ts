export const KARNATAKA_DISTRICTS = [
  "Bagalkote",
  "Ballari (Bellary)",
  "Belagavi (Belgaum)",
  "Bengaluru Rural",
  "Bengaluru Urban",
  "Bidar",
  "Chamarajanagar",
  "Chikkaballapura",
  "Chikkamagaluru",
  "Chitradurga",
  "Dakshina Kannada",
  "Davanagere",
  "Dharwad",
  "Gadag",
  "Hassan",
  "Haveri",
  "Kalaburagi (Gulbarga)",
  "Kodagu",
  "Kolar",
  "Koppal",
  "Mandya",
  "Mysuru (Mysore)",
  "Raichur",
  "Ramanagara",
  "Shivamogga (Shimoga)",
  "Tumakuru (Tumkur)",
  "Udupi",
  "Uttara Kannada",
  "Vijayapura (Bijapur)",
  "Vijayanagara",
  "Yadgir (Yadagiri)"
];

export const getDistrictsForState = (countryCode: string, stateCodeOrName: string, defaultDistricts: { name: string }[]) => {
  const isKarnataka = countryCode === 'IN' && (
    stateCodeOrName === 'KA' || 
    stateCodeOrName.toLowerCase() === 'karnataka'
  );

  if (isKarnataka) {
    return KARNATAKA_DISTRICTS.map(name => ({ name }));
  }
  return defaultDistricts;
};
