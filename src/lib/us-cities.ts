/**
 * Major US cities for autocomplete. ~350 cities covering the vast majority
 * of medical provider locations. Cities appearing in multiple states are
 * listed separately so we don't auto-fill state for ambiguous names.
 */

export interface UsCity {
  city: string;
  state: string;
}

// prettier-ignore
const CITIES: UsCity[] = [
  { city: "New York", state: "NY" }, { city: "Los Angeles", state: "CA" }, { city: "Chicago", state: "IL" },
  { city: "Houston", state: "TX" }, { city: "Phoenix", state: "AZ" }, { city: "Philadelphia", state: "PA" },
  { city: "San Antonio", state: "TX" }, { city: "San Diego", state: "CA" }, { city: "Dallas", state: "TX" },
  { city: "San Jose", state: "CA" }, { city: "Austin", state: "TX" }, { city: "Jacksonville", state: "FL" },
  { city: "Fort Worth", state: "TX" }, { city: "Columbus", state: "OH" }, { city: "Charlotte", state: "NC" },
  { city: "Indianapolis", state: "IN" }, { city: "San Francisco", state: "CA" }, { city: "Seattle", state: "WA" },
  { city: "Denver", state: "CO" }, { city: "Washington", state: "DC" }, { city: "Nashville", state: "TN" },
  { city: "Oklahoma City", state: "OK" }, { city: "El Paso", state: "TX" }, { city: "Boston", state: "MA" },
  { city: "Portland", state: "OR" }, { city: "Las Vegas", state: "NV" }, { city: "Memphis", state: "TN" },
  { city: "Louisville", state: "KY" }, { city: "Baltimore", state: "MD" }, { city: "Milwaukee", state: "WI" },
  { city: "Albuquerque", state: "NM" }, { city: "Tucson", state: "AZ" }, { city: "Fresno", state: "CA" },
  { city: "Sacramento", state: "CA" }, { city: "Mesa", state: "AZ" }, { city: "Kansas City", state: "MO" },
  { city: "Atlanta", state: "GA" }, { city: "Omaha", state: "NE" }, { city: "Colorado Springs", state: "CO" },
  { city: "Raleigh", state: "NC" }, { city: "Long Beach", state: "CA" }, { city: "Virginia Beach", state: "VA" },
  { city: "Miami", state: "FL" }, { city: "Oakland", state: "CA" }, { city: "Minneapolis", state: "MN" },
  { city: "Tampa", state: "FL" }, { city: "Tulsa", state: "OK" }, { city: "Arlington", state: "TX" },
  { city: "New Orleans", state: "LA" }, { city: "Wichita", state: "KS" }, { city: "Cleveland", state: "OH" },
  { city: "Bakersfield", state: "CA" }, { city: "Aurora", state: "CO" }, { city: "Anaheim", state: "CA" },
  { city: "Honolulu", state: "HI" }, { city: "Santa Ana", state: "CA" }, { city: "Riverside", state: "CA" },
  { city: "Corpus Christi", state: "TX" }, { city: "Lexington", state: "KY" }, { city: "Stockton", state: "CA" },
  { city: "St. Louis", state: "MO" }, { city: "Saint Paul", state: "MN" }, { city: "Henderson", state: "NV" },
  { city: "Pittsburgh", state: "PA" }, { city: "Cincinnati", state: "OH" }, { city: "Anchorage", state: "AK" },
  { city: "Greensboro", state: "NC" }, { city: "Plano", state: "TX" }, { city: "Lincoln", state: "NE" },
  { city: "Orlando", state: "FL" }, { city: "Irvine", state: "CA" }, { city: "Newark", state: "NJ" },
  { city: "Toledo", state: "OH" }, { city: "Durham", state: "NC" }, { city: "Chula Vista", state: "CA" },
  { city: "Fort Wayne", state: "IN" }, { city: "Jersey City", state: "NJ" }, { city: "St. Petersburg", state: "FL" },
  { city: "Laredo", state: "TX" }, { city: "Madison", state: "WI" }, { city: "Chandler", state: "AZ" },
  { city: "Buffalo", state: "NY" }, { city: "Lubbock", state: "TX" }, { city: "Scottsdale", state: "AZ" },
  { city: "Reno", state: "NV" }, { city: "Glendale", state: "AZ" }, { city: "Gilbert", state: "AZ" },
  { city: "Winston-Salem", state: "NC" }, { city: "North Las Vegas", state: "NV" }, { city: "Norfolk", state: "VA" },
  { city: "Chesapeake", state: "VA" }, { city: "Garland", state: "TX" }, { city: "Irving", state: "TX" },
  { city: "Hialeah", state: "FL" }, { city: "Fremont", state: "CA" }, { city: "Boise", state: "ID" },
  { city: "Richmond", state: "VA" }, { city: "Baton Rouge", state: "LA" }, { city: "Spokane", state: "WA" },
  { city: "Des Moines", state: "IA" }, { city: "Tacoma", state: "WA" }, { city: "San Bernardino", state: "CA" },
  { city: "Modesto", state: "CA" }, { city: "Fontana", state: "CA" }, { city: "Moreno Valley", state: "CA" },
  { city: "Santa Clarita", state: "CA" }, { city: "Fayetteville", state: "NC" }, { city: "Birmingham", state: "AL" },
  { city: "Oxnard", state: "CA" }, { city: "Rochester", state: "NY" }, { city: "Port St. Lucie", state: "FL" },
  { city: "Grand Rapids", state: "MI" }, { city: "Huntsville", state: "AL" }, { city: "Salt Lake City", state: "UT" },
  { city: "Frisco", state: "TX" }, { city: "Yonkers", state: "NY" }, { city: "Amarillo", state: "TX" },
  { city: "Glendale", state: "CA" }, { city: "Huntington Beach", state: "CA" }, { city: "McKinney", state: "TX" },
  { city: "Montgomery", state: "AL" }, { city: "Augusta", state: "GA" }, { city: "Tempe", state: "AZ" },
  { city: "Little Rock", state: "AR" }, { city: "Akron", state: "OH" }, { city: "Overland Park", state: "KS" },
  { city: "Grand Prairie", state: "TX" }, { city: "Tallahassee", state: "FL" }, { city: "Cape Coral", state: "FL" },
  { city: "Mobile", state: "AL" }, { city: "Knoxville", state: "TN" }, { city: "Shreveport", state: "LA" },
  { city: "Worcester", state: "MA" }, { city: "Ontario", state: "CA" }, { city: "Sioux Falls", state: "SD" },
  { city: "Chattanooga", state: "TN" }, { city: "Brownsville", state: "TX" }, { city: "Fort Lauderdale", state: "FL" },
  { city: "Providence", state: "RI" }, { city: "Newport News", state: "VA" }, { city: "Rancho Cucamonga", state: "CA" },
  { city: "Santa Rosa", state: "CA" }, { city: "Peoria", state: "AZ" }, { city: "Oceanside", state: "CA" },
  { city: "Elk Grove", state: "CA" }, { city: "Salem", state: "OR" }, { city: "Pembroke Pines", state: "FL" },
  { city: "Eugene", state: "OR" }, { city: "Garden Grove", state: "CA" }, { city: "Cary", state: "NC" },
  { city: "Corona", state: "CA" }, { city: "Springfield", state: "MO" }, { city: "Springfield", state: "IL" },
  { city: "Springfield", state: "MA" }, { city: "Springfield", state: "OH" }, { city: "Fort Collins", state: "CO" },
  { city: "Jackson", state: "MS" }, { city: "Alexandria", state: "VA" }, { city: "Hayward", state: "CA" },
  { city: "Lancaster", state: "CA" }, { city: "Salinas", state: "CA" }, { city: "Palmdale", state: "CA" },
  { city: "Hollywood", state: "FL" }, { city: "Sunnyvale", state: "CA" }, { city: "Macon", state: "GA" },
  { city: "Pomona", state: "CA" }, { city: "Escondido", state: "CA" }, { city: "Kansas City", state: "KS" },
  { city: "Savannah", state: "GA" }, { city: "Clarksville", state: "TN" }, { city: "Pasadena", state: "TX" },
  { city: "Naperville", state: "IL" }, { city: "Bellevue", state: "WA" }, { city: "Joliet", state: "IL" },
  { city: "Murfreesboro", state: "TN" }, { city: "Midland", state: "TX" }, { city: "Rockford", state: "IL" },
  { city: "Paterson", state: "NJ" }, { city: "Bridgeport", state: "CT" }, { city: "Miramar", state: "FL" },
  { city: "Killeen", state: "TX" }, { city: "Roseville", state: "CA" }, { city: "Surprise", state: "AZ" },
  { city: "Denton", state: "TX" }, { city: "McAllen", state: "TX" }, { city: "Hartford", state: "CT" },
  { city: "Torrance", state: "CA" }, { city: "Visalia", state: "CA" }, { city: "Waco", state: "TX" },
  { city: "Sterling Heights", state: "MI" }, { city: "New Haven", state: "CT" }, { city: "Olathe", state: "KS" },
  { city: "Thousand Oaks", state: "CA" }, { city: "Cedar Rapids", state: "IA" }, { city: "Charleston", state: "SC" },
  { city: "Columbia", state: "SC" }, { city: "Columbia", state: "MO" }, { city: "Stamford", state: "CT" },
  { city: "Concord", state: "CA" }, { city: "Elizabeth", state: "NJ" }, { city: "Coral Springs", state: "FL" },
  { city: "Carrollton", state: "TX" }, { city: "Topeka", state: "KS" }, { city: "Simi Valley", state: "CA" },
  { city: "Gainesville", state: "FL" }, { city: "Meridian", state: "ID" }, { city: "West Valley City", state: "UT" },
  { city: "Victorville", state: "CA" }, { city: "Abilene", state: "TX" }, { city: "Beaumont", state: "TX" },
  { city: "Vallejo", state: "CA" }, { city: "Independence", state: "MO" }, { city: "Provo", state: "UT" },
  { city: "Murrieta", state: "CA" }, { city: "Ann Arbor", state: "MI" }, { city: "El Monte", state: "CA" },
  { city: "Berkeley", state: "CA" }, { city: "Lansing", state: "MI" }, { city: "Downey", state: "CA" },
  { city: "Costa Mesa", state: "CA" }, { city: "Clearwater", state: "FL" }, { city: "Inglewood", state: "CA" },
  { city: "Miami Gardens", state: "FL" }, { city: "Arvada", state: "CO" }, { city: "West Palm Beach", state: "FL" },
  { city: "Round Rock", state: "TX" }, { city: "Fargo", state: "ND" }, { city: "Westminster", state: "CO" },
  { city: "Centennial", state: "CO" }, { city: "Odessa", state: "TX" }, { city: "Temecula", state: "CA" },
  { city: "Palm Bay", state: "FL" }, { city: "Pompano Beach", state: "FL" }, { city: "Green Bay", state: "WI" },
  { city: "Dayton", state: "OH" }, { city: "Boulder", state: "CO" }, { city: "Lakeland", state: "FL" },
  { city: "West Jordan", state: "UT" }, { city: "Tyler", state: "TX" }, { city: "Davie", state: "FL" },
  { city: "Burbank", state: "CA" }, { city: "San Mateo", state: "CA" }, { city: "Lewisville", state: "TX" },
  { city: "Richardson", state: "TX" }, { city: "Broken Arrow", state: "OK" }, { city: "College Station", state: "TX" },
  { city: "Sandy Springs", state: "GA" }, { city: "High Point", state: "NC" }, { city: "Lakewood", state: "CO" },
  { city: "League City", state: "TX" }, { city: "Allen", state: "TX" }, { city: "West Covina", state: "CA" },
  { city: "Sparks", state: "NV" }, { city: "Tuscaloosa", state: "AL" }, { city: "Wichita Falls", state: "TX" },
  { city: "Norwalk", state: "CA" }, { city: "Lee's Summit", state: "MO" }, { city: "Davenport", state: "IA" },
  { city: "San Marcos", state: "TX" }, { city: "Wilmington", state: "NC" }, { city: "Longmont", state: "CO" },
  { city: "Daly City", state: "CA" }, { city: "Tracy", state: "CA" }, { city: "Edinburg", state: "TX" },
  { city: "Mission", state: "TX" }, { city: "Redding", state: "CA" }, { city: "South Bend", state: "IN" },
  { city: "Duluth", state: "MN" }, { city: "Woodbridge", state: "NJ" }, { city: "Vacaville", state: "CA" },
  { city: "Hesperia", state: "CA" }, { city: "New Braunfels", state: "TX" }, { city: "Chico", state: "CA" },
  { city: "Asheville", state: "NC" }, { city: "Greenville", state: "SC" }, { city: "Evansville", state: "IN" },
  { city: "Bend", state: "OR" }, { city: "Santa Maria", state: "CA" }, { city: "Pueblo", state: "CO" },
  { city: "Peoria", state: "IL" }, { city: "Las Cruces", state: "NM" }, { city: "Conroe", state: "TX" },
  { city: "Lowell", state: "MA" }, { city: "Jurupa Valley", state: "CA" }, { city: "San Leandro", state: "CA" },
  { city: "Menifee", state: "CA" }, { city: "Nampa", state: "ID" }, { city: "Pensacola", state: "FL" },
  { city: "Federal Way", state: "WA" }, { city: "Carson", state: "CA" }, { city: "Santa Clara", state: "CA" },
  { city: "Roanoke", state: "VA" }, { city: "Daytona Beach", state: "FL" },
  { city: "Champaign", state: "IL" }, { city: "Bloomington", state: "IN" }, { city: "Bloomington", state: "IL" },
  { city: "Albany", state: "NY" }, { city: "Harrisburg", state: "PA" }, { city: "Scranton", state: "PA" },
  { city: "Trenton", state: "NJ" }, { city: "Erie", state: "PA" }, { city: "Flint", state: "MI" },
  { city: "Kalamazoo", state: "MI" }, { city: "Canton", state: "OH" }, { city: "Youngstown", state: "OH" },
];

/** Find cities matching a prefix (case-insensitive). Returns up to `limit` results. */
export function searchCities(query: string, limit = 8): UsCity[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: UsCity[] = [];
  const seen = new Set<string>();

  // Exact prefix matches first
  for (const c of CITIES) {
    if (results.length >= limit) break;
    const key = `${c.city}|${c.state}`;
    if (!seen.has(key) && c.city.toLowerCase().startsWith(q)) {
      seen.add(key);
      results.push(c);
    }
  }

  // Then substring matches
  if (results.length < limit) {
    for (const c of CITIES) {
      if (results.length >= limit) break;
      const key = `${c.city}|${c.state}`;
      if (!seen.has(key) && c.city.toLowerCase().includes(q)) {
        seen.add(key);
        results.push(c);
      }
    }
  }

  return results;
}

/**
 * Check if a city name is unambiguous (exists in only one state).
 * If so, return that state code. Otherwise return null.
 */
export function getUnambiguousState(cityName: string): string | null {
  const q = cityName.trim().toLowerCase();
  const states = new Set<string>();
  for (const c of CITIES) {
    if (c.city.toLowerCase() === q) {
      states.add(c.state);
    }
  }
  return states.size === 1 ? [...states][0] : null;
}
