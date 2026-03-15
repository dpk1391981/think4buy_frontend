export interface CityData {
  name: string;
  state: string;
  famousFor: string;
  overview: string;
  realEstateOverview: string;
  buyOverview: string;
  rentOverview: string;
  newProjectsOverview: string;
  topLocalitiesBuy: { name: string; note: string }[];
  topLocalitiesRent: { name: string; note: string }[];
  topLocalitiesNewProjects: { name: string; note: string }[];
  priceRangeBuy: string;
  priceRangeRent: string;
  avgPricePerSqft: string;
  connectivity: string[];
  highlights: string[];
  whyInvest: string[];
  marketTrend: string;
  faqs: { q: string; a: string }[];
}

export interface StateData {
  name: string;
  capital: string;
  overview: string;
  realEstateOverview: string;
  topCities: { name: string; slug: string; note: string }[];
  highlights: string[];
  marketTrend: string;
}

// ─── CITY DATA ────────────────────────────────────────────────────────────────

const cityDatabase: Record<string, CityData> = {
  mumbai: {
    name: "Mumbai",
    state: "Maharashtra",
    famousFor: "India's financial capital and Bollywood hub",
    overview:
      "Mumbai is India's financial capital and the most populous city in the country. Home to the Bombay Stock Exchange, Bollywood, and India's largest port, Mumbai attracts millions of migrants and professionals every year. The city's cosmopolitan culture, world-class infrastructure, and unmatched career opportunities make it the most aspirational city to live and invest in.",
    realEstateOverview:
      "Mumbai's real estate market is among the most dynamic and high-value in Asia. With limited land and ever-growing demand, property prices in Mumbai have historically appreciated strongly. The city spans multiple micro-markets — from ultra-luxury South Mumbai to rapidly developing corridors in Thane and Navi Mumbai.",
    buyOverview:
      "Buying property in Mumbai is a significant investment with strong long-term appreciation. South Mumbai commands premium prices with heritage architecture and sea views. The Western Suburbs (Bandra, Andheri, Goregaon) offer a balance of lifestyle and connectivity. The Eastern Suburbs and beyond (Mulund, Thane, Navi Mumbai) offer better value for money.",
    rentOverview:
      "Mumbai has one of the most active rental markets in India, driven by professionals, students, and migrant workers. Furnished 1BHK flats in Andheri typically rent for Rs 25,000-45,000/month, while premium 2BHKs in Bandra or Worli command Rs 70,000-2 lakh+ per month.",
    newProjectsOverview:
      "Mumbai's new project pipeline is concentrated in the Eastern suburbs, Thane-Belapur belt, Navi Mumbai, and the upcoming Navi Mumbai Airport influence zone (NAINA). Infrastructure projects like the Mumbai Metro expansions, Coastal Road, and Trans-Harbour Link are opening new residential corridors.",
    topLocalitiesBuy: [
      { name: "Bandra West", note: "Premium, upscale living — Queen of the Suburbs" },
      { name: "Andheri West", note: "Commercial hub, excellent connectivity" },
      { name: "Powai", note: "IT lake-side township, premium high-rises" },
      { name: "Worli", note: "Luxury sea-view apartments, BKC proximity" },
      { name: "Goregaon East", note: "Emerging hub with NESCO and Film City" },
      { name: "Mulund West", note: "Affordable, green suburb with good schools" },
      { name: "Chembur", note: "Well-connected via Eastern Freeway and Monorail" },
      { name: "Kandivali East", note: "Large township projects, family-friendly" },
    ],
    topLocalitiesRent: [
      { name: "Andheri East", note: "Near airport, IT offices, affordable bachelor flats" },
      { name: "Bandra Kurla Complex", note: "Corporate belt, premium furnished rentals" },
      { name: "Malad West", note: "Budget-friendly with good mall access" },
      { name: "Powai", note: "IT professionals preferred, high-quality PGs and flats" },
      { name: "Goregaon", note: "Balanced cost for working professionals" },
      { name: "Thane West", note: "Spacious apartments at lower rents than Mumbai city" },
    ],
    topLocalitiesNewProjects: [
      { name: "Panvel / NAINA Zone", note: "Upcoming Navi Mumbai Airport growth corridor" },
      { name: "Thane East", note: "Large integrated townships with amenities" },
      { name: "Dombivali", note: "Affordable new launches by top builders" },
      { name: "Borivali East", note: "Metro connectivity driving new supply" },
      { name: "Kurla", note: "BKC overflow — luxury high-rises coming up" },
    ],
    priceRangeBuy: "Rs 70L – Rs 15Cr+",
    priceRangeRent: "Rs 18,000 – Rs 2,00,000/month",
    avgPricePerSqft: "Rs 12,000 – Rs 50,000/sqft",
    connectivity: [
      "Chhatrapati Shivaji Maharaj International Airport — India's 2nd busiest",
      "Mumbai Metro — 9 operational lines with expansions underway",
      "Mumbai Suburban Railway — largest commuter rail network in Asia",
      "Eastern and Western Express Highways",
      "Bandra-Worli Sea Link and upcoming Coastal Road",
      "Trans-Harbour Link connecting Mumbai to Navi Mumbai",
    ],
    highlights: [
      "India's #1 financial and commercial centre — BSE, NSE, RBI HQ",
      "Bollywood and entertainment industry base",
      "World-class hospitals: Lilavati, Kokilaben, Breach Candy",
      "Top schools: Dhirubhai Ambani, Cathedral, St. Xavier's",
      "Vibrant nightlife, dining, beaches — Juhu, Marine Drive, Aksa",
      "Strong expat and NRI community",
    ],
    whyInvest: [
      "Consistent property price appreciation of 6-12% annually",
      "Highest rental yield among Indian metros at 3-5%",
      "Limited land supply ensures scarcity premium",
      "Multiple upcoming infrastructure projects unlocking new corridors",
      "Strong NRI investment demand driving premium segment",
      "RERA compliance and organised developer ecosystem",
    ],
    marketTrend:
      "Mumbai real estate saw a record 12,000+ registrations in a single month in 2024. Premium and luxury segments (Rs 2Cr+) are outperforming, especially in South Mumbai, BKC, and Worli. The Thane-Navi Mumbai belt offers the best value-to-appreciation ratio for mid-income buyers.",
    faqs: [
      {
        q: "What is the average flat price in Mumbai?",
        a: "The average flat price in Mumbai ranges from Rs 70 lakh for a 1BHK in suburbs to Rs 5Cr+ for a 3BHK in premium areas like Bandra or Worli. South Mumbai luxury flats can exceed Rs 15 crore.",
      },
      {
        q: "Which are the best areas to buy a flat in Mumbai?",
        a: "Top areas to buy flats in Mumbai include Bandra West, Andheri, Powai, Chembur, Mulund, and Goregaon. For value, Thane and Navi Mumbai extension offer competitive pricing.",
      },
      {
        q: "Is RERA applicable for properties in Mumbai?",
        a: "Yes. All new residential projects in Mumbai with more than 8 units or 500 sqm of land area must be registered with MahaRERA. Always verify RERA registration before booking.",
      },
      {
        q: "What is the stamp duty rate in Mumbai?",
        a: "Stamp duty in Mumbai is 5% for male buyers, 4% for female buyers, plus 1% Metro cess and 1% Local Body Tax, totalling 6-7% typically.",
      },
    ],
  },

  delhi: {
    name: "Delhi",
    state: "Delhi",
    famousFor: "India's national capital and political nerve centre",
    overview:
      "Delhi, the National Capital Territory of India, is the country's political, administrative, and cultural nerve centre. With a population exceeding 33 million, the Delhi NCR region is the second-largest urban agglomeration in the world. Delhi blends Mughal heritage monuments with ultra-modern infrastructure, making it an exciting city to live, work, and invest in.",
    realEstateOverview:
      "Delhi's real estate market covers a wide spectrum — from government-regulated DDA flats to builder floors in South Delhi and high-rise luxury towers in Lutyens' Delhi. The NCR region includes sub-markets like Gurgaon, Noida, Faridabad, and Ghaziabad, each with distinct price points and growth trajectories.",
    buyOverview:
      "Buying property in Delhi offers diverse choices. South Delhi (Vasant Kunj, Saket, Greater Kailash) is premium. West Delhi (Dwarka, Uttam Nagar) is well-planned and affordable. North Delhi (Rohini, Pitampura) is family-oriented with good connectivity. East Delhi is emerging with new township projects.",
    rentOverview:
      "Delhi has a vast rental market driven by students (DU, JNU, IIT Delhi), government employees, and corporate professionals. South Delhi and Lutyens' zones command the highest rents. Areas near metro stations and commercial hubs like Connaught Place see strong demand.",
    newProjectsOverview:
      "Delhi's new project activity is primarily in periphery areas — Dwarka Expressway, L-Zone, and along the new Ring Road metro corridors. The Delhi Master Plan 2041 has unlocked several new development zones with mixed-use projects.",
    topLocalitiesBuy: [
      { name: "Vasant Kunj", note: "South Delhi premium — malls, greenery, DLF presence" },
      { name: "Dwarka", note: "Planned sector township, excellent metro connectivity" },
      { name: "Greater Kailash", note: "Upscale South Delhi, heritage bungalows and builder floors" },
      { name: "Rohini", note: "Largest planned township in Asia, affordable family homes" },
      { name: "Saket", note: "South Delhi premium, near Select City Walk Mall" },
      { name: "Janakpuri", note: "Mid-segment West Delhi with good metro access" },
      { name: "Uttam Nagar", note: "Budget-friendly, strong resale market" },
      { name: "Pitampura", note: "North Delhi, well-established residential area" },
    ],
    topLocalitiesRent: [
      { name: "Lajpat Nagar", note: "South Delhi, near market hubs, strong demand" },
      { name: "Dwarka Sector 10/11", note: "Affordable rentals near metro" },
      { name: "Karol Bagh", note: "Central Delhi, budget furnished rooms and flats" },
      { name: "Hauz Khas", note: "Young professionals, creative crowd, cafes and parks" },
      { name: "Saket", note: "Near metro, malls, and South Delhi offices" },
      { name: "Vikaspuri", note: "Family-friendly, affordable 2BHK flats" },
    ],
    topLocalitiesNewProjects: [
      { name: "Dwarka L-Zone", note: "Delhi Master Plan 2041 zone, new integrated townships" },
      { name: "Rohini Sector 37-40", note: "New sub-sectors with affordable DDA-style flats" },
      { name: "Narela Zone", note: "Affordable upcoming area near KMP Expressway" },
    ],
    priceRangeBuy: "Rs 60L – Rs 20Cr+",
    priceRangeRent: "Rs 12,000 – Rs 1,50,000/month",
    avgPricePerSqft: "Rs 6,500 – Rs 35,000/sqft",
    connectivity: [
      "Indira Gandhi International Airport — one of Asia's busiest",
      "Delhi Metro — 391 km, 9 lines, 286 stations (world's 4th largest)",
      "National Highway network — NH48, NH44, NH24 radiating outward",
      "Delhi-Meerut Expressway, Eastern Peripheral Expressway",
      "Ring Road and Outer Ring Road connecting all directions",
      "New Delhi Railway Station — largest railway junction in North India",
    ],
    highlights: [
      "Seat of Indian Parliament, Supreme Court, all central ministries",
      "UNESCO World Heritage Sites: Red Fort, Qutub Minar, Humayun's Tomb",
      "Top universities: DU, JNU, IIT Delhi, AIIMS",
      "World-class hospitals: AIIMS, Fortis, Max",
      "Growing startup ecosystem in Aerocity and Connaught Place",
      "Excellent green cover in South Delhi and Lutyens' zones",
    ],
    whyInvest: [
      "Central government employee demand provides constant housing need",
      "Delhi Metro expansion continuously opens new investment corridors",
      "Strong rental yield in student and professional belts (3-4.5%)",
      "Infrastructure push under Delhi Master Plan 2041",
      "Limited supply in premium South Delhi keeps prices firm",
      "Gentrification of East Delhi driving appreciation",
    ],
    marketTrend:
      "Delhi real estate in 2024 saw strong luxury demand in South Delhi and Lutyens' zone. The DDA housing scheme continues to attract first-time buyers. Areas along the new Pink Line and Silver Line metro extensions are witnessing fresh interest from investors.",
    faqs: [
      {
        q: "What is the average property price in Delhi?",
        a: "Average property prices in Delhi range from Rs 60L for flats in outer areas like Uttam Nagar to Rs 5-20Cr for bungalows and luxury apartments in South Delhi or Lutyens' Delhi.",
      },
      {
        q: "Which is the best area to buy a flat in Delhi?",
        a: "Dwarka is the most popular for planned township living. Rohini is ideal for affordable family homes. South Delhi (Vasant Kunj, Greater Kailash) is preferred for premium buyers.",
      },
      {
        q: "What is stamp duty in Delhi?",
        a: "Stamp duty in Delhi is 6% for men, 4% for women, and 5% for joint ownership. Registration charges are 1% of property value.",
      },
    ],
  },

  bangalore: {
    name: "Bangalore",
    state: "Karnataka",
    famousFor: "India's Silicon Valley and IT capital",
    overview:
      "Bangalore (Bengaluru) is India's technology capital and the fastest-growing major city in the country. Home to over 10,000 tech companies including global giants like Infosys, Wipro, and Flipkart, along with hundreds of unicorn startups, Bangalore attracts the brightest minds from across India. Known for its pleasant climate, cosmopolitan culture, and vibrant pub and cafe scene, Bangalore consistently tops liveability surveys.",
    realEstateOverview:
      "Bangalore's real estate market is driven by a young, well-paid IT workforce. The city has expanded dramatically eastward (Whitefield, Sarjapur) and northward (Hebbal, Yelahanka), while South Bangalore (Jayanagar, Koramangala) remains the most sought-after residential zone. The metro network expansion is reshaping property values across the city.",
    buyOverview:
      "Buying a flat in Bangalore is among the best long-term real estate investments in India. East Bangalore (Whitefield, Sarjapur Road) offers tech-centric living with township projects. North Bangalore (Hennur, Hebbal, Thanisandra) is the fastest appreciating zone thanks to the airport expressway. South Bangalore (Jayanagar, JP Nagar) is evergreen for traditional families.",
    rentOverview:
      "Bangalore has India's most active rental market per capita, fuelled by millions of IT professionals. Koramangala and Indiranagar command premium rents (Rs 35,000-1.2L for 2BHK). HSR Layout and BTM Layout are popular startup and young professional zones. Electronic City and Whitefield offer lower rents near IT parks.",
    newProjectsOverview:
      "Bangalore's new project pipeline is massive, particularly along the Outer Ring Road, Sarjapur Road extension, Bagalur (near airport), and the Peripheral Ring Road (PRR) corridor. The upcoming Namma Metro Phase 2 and Phase 2A are unlocking fresh corridors in North and West Bangalore.",
    topLocalitiesBuy: [
      { name: "Whitefield", note: "IT hub, large townships, top schools and hospitals" },
      { name: "Sarjapur Road", note: "Startup corridor, gated communities, high appreciation" },
      { name: "Koramangala", note: "Premium startup and cafe zone, evergreen demand" },
      { name: "Hebbal", note: "North Bangalore growth zone near Manyata Tech Park" },
      { name: "Jayanagar", note: "Old South Bangalore, premium, limited supply" },
      { name: "JP Nagar", note: "Family-friendly, good schools, stable prices" },
      { name: "Yelahanka", note: "Near airport, new township projects" },
      { name: "Electronic City", note: "Tech park proximity, affordable housing" },
    ],
    topLocalitiesRent: [
      { name: "Koramangala", note: "Startups, premium cafes, young professionals" },
      { name: "Indiranagar", note: "Vibrant social scene, metro access" },
      { name: "HSR Layout", note: "Startup ecosystem, well-planned, high demand" },
      { name: "BTM Layout", note: "Affordable for IT workers, near ORR" },
      { name: "Marathahalli", note: "Budget rentals near IT offices on ORR" },
      { name: "Electronic City Phase 1", note: "Best value near Infosys and Wipro campuses" },
    ],
    topLocalitiesNewProjects: [
      { name: "Bagalur / Shettigere", note: "Near BIA — massive township launches underway" },
      { name: "Devanahalli", note: "Aerospace SEZ, KIADB plotted developments" },
      { name: "Sarjapur Extension", note: "High-volume launches by Prestige, Godrej, Brigade" },
      { name: "Channasandra / Kadugodi", note: "Metro Phase 2 boost, mid-segment projects" },
    ],
    priceRangeBuy: "Rs 55L – Rs 8Cr",
    priceRangeRent: "Rs 14,000 – Rs 1,20,000/month",
    avgPricePerSqft: "Rs 5,500 – Rs 22,000/sqft",
    connectivity: [
      "Kempegowda International Airport (BIA) — India's 3rd busiest, 40 km north",
      "Namma Metro — Phase 1, 2, 2A, 2B (over 70 km operational)",
      "NICE Road (Peripheral Ring Road) connecting all quadrants",
      "Outer Ring Road (ORR) — tech office corridor",
      "NH44 (Delhi-Chennai) and NH48 passing through",
      "Upcoming Peripheral Ring Road (PRR) 73 km project",
    ],
    highlights: [
      "10,000+ tech companies, highest IT employment in India",
      "India's startup capital — 40+ unicorns headquartered here",
      "Pleasant climate year-round (15-30 deg C avg), Garden City",
      "Top engineering colleges: IISc, IITs, NITs nearby",
      "World-class hospitals: Manipal, Narayana, Apollo, Fortis",
      "Thriving pub, cafe, and co-working ecosystem",
    ],
    whyInvest: [
      "Highest salary growth in India driving housing demand",
      "Namma Metro Phase 2 unlocking multiple new corridors",
      "8-15% annual appreciation in growth corridors like North Bangalore",
      "Strong rental yield of 3-4% near IT parks",
      "Top developers (Prestige, Brigade, Sobha, Godrej) delivering quality supply",
      "Proposed PRR (Peripheral Ring Road) will further boost satellite areas",
    ],
    marketTrend:
      "Bangalore recorded the highest property registrations among South Indian metros in 2024. North Bangalore (Hebbal, Yelahanka, Bagalur) led appreciation. Premium luxury launches (Rs 3Cr+) by Prestige, Sobha, and Brigade saw record bookings. Rental markets hit all-time highs due to RTO mandates and return-to-office policies.",
    faqs: [
      {
        q: "What is the average flat price in Bangalore?",
        a: "Flat prices in Bangalore range from Rs 55L for a 2BHK in Electronic City to Rs 3-8Cr for premium flats in Koramangala or Indiranagar. North Bangalore is the sweet spot at Rs 80L-1.8Cr for 2-3BHK apartments.",
      },
      {
        q: "Which are the best areas to invest in Bangalore?",
        a: "Whitefield, Sarjapur Road, and Hebbal offer the best appreciation potential. For rental income, Koramangala, Indiranagar, and HSR Layout are top choices.",
      },
      {
        q: "What is the stamp duty in Bangalore / Karnataka?",
        a: "Stamp duty in Karnataka is 5% for properties above Rs 45L, 3% for Rs 21L-45L, and 2% for below Rs 20L. Registration charges are 1% of property value.",
      },
    ],
  },

  pune: {
    name: "Pune",
    state: "Maharashtra",
    famousFor: "IT hub, education capital, and rising manufacturing centre",
    overview:
      "Pune is Maharashtra's second-largest city and one of India's fastest-growing IT and manufacturing hubs. Known as the Oxford of the East for its numerous educational institutions, Pune attracts students and professionals from across India. The city offers a high quality of life with a cooler climate than Mumbai, excellent infrastructure, and a vibrant social culture.",
    realEstateOverview:
      "Pune's real estate market has grown significantly over the past decade, driven by IT/ITES companies in Hinjewadi, Kharadi, and Magarpatta. The city offers a diverse range of properties — from affordable housing in Wagholi and Undri to premium gated communities in Koregaon Park and Kalyani Nagar.",
    buyOverview:
      "Buying property in Pune offers excellent value compared to Mumbai. The western IT corridor (Hinjewadi, Baner, Balewadi) is most active. Kharadi and Viman Nagar in the east cater to IT professionals near EON IT Park. Premium areas like Koregaon Park and Boat Club Road offer luxury living.",
    rentOverview:
      "Pune's rental market is driven by IT employees, students, and migrant professionals. Hinjewadi caters to tech companies while Koregaon Park attracts expats and entrepreneurs. Wakad and Baner are popular for mid-segment rentals with good restaurant and social infrastructure.",
    newProjectsOverview:
      "Pune's new project corridor runs along the Pune Ring Road, Hinjewadi Phase 2 and 3, Talegaon, and Chakan. The Pune Metro now operational on two corridors is boosting projects in Pimpri-Chinchwad, Shivajinagar, and Vanaz-Ramwadi stretch.",
    topLocalitiesBuy: [
      { name: "Baner", note: "Premium IT suburb, excellent restaurants and nightlife" },
      { name: "Hinjewadi", note: "IT park zone, high rental demand, good appreciation" },
      { name: "Kharadi", note: "EON IT Park proximity, premium township living" },
      { name: "Koregaon Park", note: "Upscale green zone, expat and NRI favourite" },
      { name: "Wakad", note: "Affordable, near Hinjewadi, good connectivity" },
      { name: "Wagholi", note: "Budget friendly east Pune, strong 2BHK supply" },
      { name: "Hadapsar", note: "Magarpatta proximity, mid-segment to luxury" },
      { name: "Undri", note: "Emerging south Pune, affordable family zone" },
    ],
    topLocalitiesRent: [
      { name: "Hinjewadi Phase 1", note: "TCS, Infosys, Wipro — highest IT rental demand" },
      { name: "Viman Nagar", note: "Airport proximity, young professionals" },
      { name: "Koregaon Park", note: "Expats, startup founders, premium furnished flats" },
      { name: "Baner", note: "Social scene, mid-premium rentals" },
      { name: "Kothrud", note: "Families, established area, university proximity" },
      { name: "Hadapsar", note: "Affordable near Magarpatta IT campus" },
    ],
    topLocalitiesNewProjects: [
      { name: "Mahalunge / Balewadi", note: "Sports township, premium launches near Baner" },
      { name: "Talegaon", note: "Affordable plotted developments, Mumbai highway access" },
      { name: "Pirangut / Lavasa Road", note: "Hill township projects, weekend home segment" },
      { name: "Chakan", note: "Industrial belt, affordable housing for workforce" },
    ],
    priceRangeBuy: "Rs 45L – Rs 4Cr",
    priceRangeRent: "Rs 12,000 – Rs 80,000/month",
    avgPricePerSqft: "Rs 5,000 – Rs 16,000/sqft",
    connectivity: [
      "Pune International Airport — 12 km from city centre",
      "Pune Metro — Blue Line and Purple Line operational (33 km)",
      "Mumbai-Pune Expressway (NH48) — 2 hours to Mumbai",
      "Pune Ring Road (under construction) — 170 km beltway",
      "Pune Railway Junction — major node on CR and Deccan routes",
      "Upcoming Hyperloop Pune-Mumbai (proposed)",
    ],
    highlights: [
      "3,500+ educational institutes including Savitribai Phule Pune University",
      "Largest IT park in India — Hinjewadi Phase 1, 2 and 3",
      "Headquarters of Tata Motors, Bajaj Auto, Forbes Marshall",
      "Pleasant hill-station climate, 600m above sea level",
      "Weekend getaways to Lonavala, Mahabaleshwar within 2 hours",
      "Fastest growing smart city in Maharashtra",
    ],
    whyInvest: [
      "IT sector employs 6 lakh+ professionals, sustaining strong housing demand",
      "Pune Metro expansion unlocking appreciation in new micro-markets",
      "Lower entry price than Mumbai with comparable growth",
      "Strong student rental market — 1.5 million students in the city",
      "Manufacturing boom (Tesla, Foxconn suppliers) driving east Pune growth",
      "MahaRERA compliance among the highest in India",
    ],
    marketTrend:
      "Pune property registrations hit an all-time high in 2024 with 1.5 lakh registrations in a year. Hinjewadi and Wakad corridors saw 12-18% appreciation. The luxury segment in Koregaon Park and Kalyani Nagar is witnessing strong NRI interest post-COVID.",
    faqs: [
      {
        q: "What is the average flat price in Pune?",
        a: "Flat prices in Pune range from Rs 45L for a 1BHK in Wagholi to Rs 2.5-4Cr for a premium 3BHK in Koregaon Park or Kalyani Nagar. The IT corridors (Hinjewadi, Kharadi) average Rs 75L-1.6Cr for a 2BHK.",
      },
      {
        q: "Which area is best to buy property in Pune for IT professionals?",
        a: "Hinjewadi, Wakad, and Baner are best for Hinjewadi IT Park employees. Kharadi, Viman Nagar, and Hadapsar are ideal for those working in EON/Magarpatta belt.",
      },
      {
        q: "What is stamp duty in Pune?",
        a: "Stamp duty in Pune (Maharashtra) is 6% for men, 5% for women, plus 1% LBT and 1% Metro Cess. Total effective rate is 7-8%.",
      },
    ],
  },

  gurgaon: {
    name: "Gurgaon",
    state: "Haryana",
    famousFor: "India's corporate and financial services hub of NCR",
    overview:
      "Gurgaon (officially Gurugram) is the corporate engine of the Delhi NCR region and one of India's fastest-growing cities. Home to 250+ Fortune 500 company offices, iconic skyscrapers of Cyber City, and a thriving luxury real estate market, Gurgaon represents modern India's ambition. The city is known for its premium malls, upscale restaurants, golf courses, and excellent expressway connectivity.",
    realEstateOverview:
      "Gurgaon has the highest per-capita luxury residential supply in India. The Golf Course Road, Golf Course Extension Road, and Dwarka Expressway are the three defining real estate corridors. Sohna Road and New Gurgaon are mid-segment growth zones with strong appreciation potential.",
    buyOverview:
      "Gurgaon offers India's most diverse premium-to-ultra-luxury housing options. Golf Course Road is the pinnacle of luxury with DLF properties. Dwarka Expressway is the fastest-growing mid-to-premium zone. Sector 65-85 on the Golf Course Extension is extremely popular for gated community living.",
    rentOverview:
      "Gurgaon's rental market is driven by India's highest-earning corporate professionals. Furnished serviced apartments near Cyber City and DLF Phase 2 command Rs 50,000-2L/month. Sector 47-56 is popular for families, while Sohna Road offers affordable rental options.",
    newProjectsOverview:
      "Gurgaon's newest launches are concentrated on the Dwarka Expressway (now operational), Southern Peripheral Road, and New Gurgaon (Sectors 76-95). The proposed Kundli-Manesar-Palwal (KMP) Expressway is opening Industrial Model Townships that will drive residential demand.",
    topLocalitiesBuy: [
      { name: "Golf Course Road", note: "Ultra-luxury — DLF Crest, Camellias, Magnolias" },
      { name: "Golf Course Extension", note: "Sec 65-79 premium gated communities" },
      { name: "Dwarka Expressway", note: "Mid-premium, fastest appreciation in 2024" },
      { name: "Sohna Road", note: "Affordable-to-mid, family townships, green zones" },
      { name: "Sector 56 / 57", note: "Established, quiet, DLF zone proximity" },
      { name: "South of Gurgaon (Sectors 82-95)", note: "New Gurgaon emerging mid-segment" },
      { name: "Palam Vihar", note: "Independent floors, builder floors, budget" },
      { name: "Malibu Towne", note: "Plotted and villa living, upscale residential" },
    ],
    topLocalitiesRent: [
      { name: "DLF Cyber City (Phase 2/3)", note: "Corporate hub, premium furnished apartments" },
      { name: "Sector 47 / 50 / 56", note: "Family expat zones, good schools nearby" },
      { name: "Sohna Road Sectors", note: "Budget-friendly with good connectivity" },
      { name: "MG Road / IFFCO Chowk", note: "Central Gurgaon, metro access" },
      { name: "Nirvana Country", note: "Premium villas and row houses for senior executives" },
    ],
    topLocalitiesNewProjects: [
      { name: "Dwarka Expressway Sectors", note: "Record registrations, mid-premium launches" },
      { name: "Southern Peripheral Road (SPR)", note: "Emerging commercial and residential belt" },
      { name: "New Gurgaon Sector 85-92", note: "Mass housing, new infrastructure being laid" },
      { name: "Manesar", note: "Industrial proximity, affordable upcoming township" },
    ],
    priceRangeBuy: "Rs 75L – Rs 25Cr+",
    priceRangeRent: "Rs 20,000 – Rs 3,00,000/month",
    avgPricePerSqft: "Rs 7,500 – Rs 45,000/sqft",
    connectivity: [
      "Delhi-Gurgaon Expressway (NH48) — 30 min to Aerocity/IGI Airport",
      "Rapid Metro Gurgaon — connecting Cyber City to Sikanderpur",
      "Delhi Metro Yellow Line extended to Millennium City Centre",
      "KMP (Kundli-Manesar-Palwal) Western Peripheral Expressway",
      "Dwarka Expressway (NH248BB) — now fully operational",
      "Proposed Metro Phase-2 covering Golf Course Road",
    ],
    highlights: [
      "250+ Fortune 500 companies including Google, Microsoft, IBM India HQ",
      "India's largest IT/financial services office market after Mumbai",
      "Highest concentration of luxury malls — Ambience, DLF Mega Mall, MGF",
      "World-class golf courses — Classic Golf and Country Club, Tarudhan Valley",
      "Top international schools: The Shri Ram School, DPS, Pathways",
      "Highest average IT salary city in India",
    ],
    whyInvest: [
      "Dwarka Expressway completion driving 20%+ appreciation in adjacent sectors",
      "India's highest luxury residential demand outside Mumbai",
      "Strong expat and senior executive rental demand sustaining premium yield",
      "Limited supply in Golf Course zone keeping prices firm",
      "New commercial development on SPR creating fresh office demand",
      "Consistently top-ranked city in Ease of Doing Business",
    ],
    marketTrend:
      "Gurgaon luxury real estate (Rs 5Cr+) registered record sales in 2024, with DLF ultra-luxury projects selling out within days of launch. Dwarka Expressway sector properties appreciated 25-35% post-expressway opening. Rental markets are at all-time highs driven by large MNCs enforcing return-to-office.",
    faqs: [
      {
        q: "What is the average property price in Gurgaon?",
        a: "Prices range from Rs 75L for a 2BHK on Sohna Road to Rs 5-25Cr for ultra-luxury units on Golf Course Road. Dwarka Expressway mid-segment averages Rs 1.2-2.5Cr for a 2-3BHK.",
      },
      {
        q: "What is stamp duty in Gurgaon?",
        a: "Haryana stamp duty is 7% for men, 5% for women. Registration charge is 0.5% capped at Rs 50,000 for residential properties.",
      },
    ],
  },

  noida: {
    name: "Noida",
    state: "Uttar Pradesh",
    famousFor: "IT/media hub and planned smart city of NCR",
    overview:
      "Noida (New Okhla Industrial Development Authority) is a planned city in Uttar Pradesh and a key part of the Delhi NCR. Known for its wide roads, green sectors, and strong IT/media presence, Noida is one of India's most liveable planned cities. It houses India's largest media corridor (Film City, TV9, NDTV, Star) and major IT campuses of TCS, Wipro, and HCL.",
    realEstateOverview:
      "Noida offers the best price-to-infrastructure ratio in NCR. Society-style apartment living is the norm, with thousands of gated communities across Sectors 50-150. Greater Noida West (Noida Extension) has India's densest concentration of under-construction and ready inventory in the Rs 40-80L budget segment.",
    buyOverview:
      "Noida offers excellent value compared to Gurgaon or South Delhi. Sectors 44, 50, 76-78 are premium. Sectors 100-137 on the Noida-Greater Noida Expressway are growing. Sector 150 is the newest premium residential zone with sporting infrastructure and metro connectivity.",
    rentOverview:
      "Noida rental market is driven by media professionals, IT employees, and students from Amity and Sharda universities. Sector 18 (Atta Market) area has abundant mid-segment rentals. Sectors 44, 50, 76 command premium rents. Noida Extension offers the most affordable options for young professionals.",
    newProjectsOverview:
      "Noida's biggest new project corridor is Sector 150 (Noida's first sports city), Sectors 78, 79, 105 along the aqua metro line, and Greater Noida West where 50,000+ units are under various stages of completion.",
    topLocalitiesBuy: [
      { name: "Sector 150", note: "Sports City — premium green township, metro access" },
      { name: "Sector 137 (Expressway)", note: "Mid-premium, metro aqua line station" },
      { name: "Sector 44", note: "Upscale established, premium resale" },
      { name: "Sector 76/77/78", note: "Active mid-segment supply by top builders" },
      { name: "Sector 50/51/52", note: "IT belt, premium established society living" },
      { name: "Greater Noida West", note: "Maximum budget housing supply, Rs 40-70L range" },
      { name: "Sectors 100-104", note: "Expressway corridor, mid-premium apartments" },
    ],
    topLocalitiesRent: [
      { name: "Sector 18 / Atta Market", note: "Central Noida, abundant rental supply" },
      { name: "Sector 62", note: "IT campus zone, strong demand from techies" },
      { name: "Sector 44", note: "Premium families and expats" },
      { name: "Greater Noida West (Gaur City)", note: "Budget rentals, young professionals" },
      { name: "Sector 119 / 121", note: "Near Botanical Garden metro, modern societies" },
    ],
    topLocalitiesNewProjects: [
      { name: "Sector 150", note: "ATS, Eldeco, Supertech delivering premium inventory" },
      { name: "Sector 79 / 105 / 108", note: "Aqua metro line boost, new project launches" },
      { name: "Greater Noida West Phase 2", note: "Thousands of units reaching possession" },
    ],
    priceRangeBuy: "Rs 40L – Rs 4Cr",
    priceRangeRent: "Rs 10,000 – Rs 80,000/month",
    avgPricePerSqft: "Rs 4,500 – Rs 12,000/sqft",
    connectivity: [
      "Delhi Metro Blue Line and Aqua Line (Noida-Greater Noida)",
      "Noida-Greater Noida Expressway — 24 km, 8-lane",
      "Yamuna Expressway — Delhi to Agra via Noida",
      "Eastern Peripheral Expressway connecting to NH58/Meerut",
      "Noida International Airport at Jewar (under construction, opening 2025)",
      "DND (Delhi-Noida Direct) flyway — 10 min to South Delhi",
    ],
    highlights: [
      "India's media capital — Film City, NDTV, ABP, Zee studios",
      "Major IT campuses: TCS, Wipro, HCL, Tech Mahindra",
      "Amity University and Sharda University serving 1L+ students",
      "Formula 1 track (Buddh International Circuit) nearby in Greater Noida",
      "World-class indoor stadiums and cricket academy",
      "Green development — highest per-capita green cover in NCR",
    ],
    whyInvest: [
      "Jewar International Airport will be Delhi NCR's second airport, driving Yamuna Expressway appreciation",
      "Aqua Metro Line connecting Noida to Greater Noida has unlocked new investment corridors",
      "Best price per sqft among planned NCR cities",
      "Large institutional IT/media employment ensures sustained rental demand",
      "UP RERA among the most active RERAs — completed project delivery improving",
      "Sector 150 sports township expected to appreciate 30-40% post-possession",
    ],
    marketTrend:
      "Noida real estate in 2024 saw Sector 150 emerge as the most registered new society area in NCR. Jewar airport excitement is driving 15-20% appreciation in Yamuna Expressway properties. The long-pending stuck projects (Supertech, Amrapali) are gradually being resolved through NBCC, restoring buyer confidence.",
    faqs: [
      {
        q: "What is the average flat price in Noida?",
        a: "Flat prices in Noida range from Rs 40L for a 2BHK in Greater Noida West to Rs 3-4Cr for premium units in Sector 44 or Sector 150. Mid-segment 2BHKs in sectors 75-100 average Rs 70L-1.3Cr.",
      },
      {
        q: "What is stamp duty in Noida (Uttar Pradesh)?",
        a: "Stamp duty in UP is 7% for men, 6% for women, and 6.5% for joint registration. Registration charge is 1% with a cap of Rs 30,000 for residential property.",
      },
    ],
  },

  hyderabad: {
    name: "Hyderabad",
    state: "Telangana",
    famousFor: "India's Pharma City and fastest-growing IT hub",
    overview:
      "Hyderabad, the capital of Telangana, is India's most exciting real estate market right now. The city has transformed from a heritage city of Nizams into India's largest pharmaceutical and second-largest IT hub. HITEC City is home to Google, Microsoft, Facebook, and Amazon's largest offices outside their home countries. The city's business-friendly government, affordable cost of living, and excellent infrastructure make it a top choice for investors and professionals.",
    realEstateOverview:
      "Hyderabad real estate is the fastest appreciating major market in India. The city stands out for offering relatively large, good-quality apartments at prices well below Bangalore, Mumbai, or Delhi. The Western corridor (HITEC City-Kondapur-Gachibowli) is the IT zone. Kokapet and Nanakramguda are the luxury zones. Financial District has the highest office demand.",
    buyOverview:
      "Hyderabad offers the best quality-to-price ratio for flat buyers in India. Gachibowli, Kondapur, and Manikonda offer premium IT-proximate living at 30-40% below Bangalore rates. Kokapet (Neopolis) is Hyderabad's luxury destination. Bachupally and Miyapur in North Hyderabad offer affordable options.",
    rentOverview:
      "Hyderabad rental market is fuelled by its massive IT workforce. Madhapur and Kondapur near HITEC City see strong demand. Gachibowli rentals are the priciest near Financial District. Bachupally and Kukatpally offer affordable options for budget-conscious renters.",
    newProjectsOverview:
      "Hyderabad's new project boom is concentrated in Kokapet (Neopolis Zone), Tellapur, Mokila (ORR outskirts), and Shadnagar along the Hyderabad-Bengaluru highway. The Regional Ring Road (RRR) is expected to open entirely new development zones.",
    topLocalitiesBuy: [
      { name: "Gachibowli", note: "Financial District proximity, premium IT living" },
      { name: "Kondapur", note: "HITEC City zone, high rental demand, evergreen" },
      { name: "Kokapet", note: "Luxury — Neopolis Master Plan, fastest appreciation" },
      { name: "Manikonda", note: "Mid-premium, close to all IT hubs" },
      { name: "Bachupally", note: "North Hyderabad, affordable townships" },
      { name: "Kukatpally", note: "Established, value for money, metro access" },
      { name: "Miyapur", note: "Metro terminal, affordable high-rises" },
      { name: "Narsingi", note: "Upcoming south IT zone, new launches" },
    ],
    topLocalitiesRent: [
      { name: "Madhapur / HITEC City", note: "Highest IT rental demand, premium rates" },
      { name: "Kondapur", note: "Near HITEC, mid-premium, young professionals" },
      { name: "Gachibowli", note: "Financial District workers, premium furnished" },
      { name: "Kukatpally", note: "Affordable family rentals, JNTU proximity" },
      { name: "Miyapur", note: "Budget, metro access, student-friendly" },
    ],
    topLocalitiesNewProjects: [
      { name: "Kokapet (Neopolis)", note: "Luxury master-planned city, Prestige/Lodha launches" },
      { name: "Tellapur / Nallagandla", note: "Mid-premium, rapid new supply" },
      { name: "Mokila / Shankarpalle", note: "ORR outskirts, villa plots and weekend homes" },
      { name: "Shadnagar", note: "HMDA approved, affordable township projects" },
    ],
    priceRangeBuy: "Rs 50L – Rs 6Cr",
    priceRangeRent: "Rs 12,000 – Rs 1,00,000/month",
    avgPricePerSqft: "Rs 4,500 – Rs 15,000/sqft",
    connectivity: [
      "Rajiv Gandhi International Airport — 25 km, GHMC access",
      "Hyderabad Metro Rail — 69 km, 3 corridors (world's longest elevated metro)",
      "Outer Ring Road (ORR) — 158 km beltway connecting all quadrants",
      "NH65 (Hyderabad-Pune), NH44 (Hyderabad-Bangalore)",
      "Regional Ring Road (RRR) — 340 km under construction",
      "Hyderabad-Secunderabad twin city connectivity via MMTS rail",
    ],
    highlights: [
      "World's largest IT campus: Microsoft, Google, Facebook, Amazon R&D centres",
      "India's pharmaceutical capital — 30% of India's pharma exports",
      "Hyderabad Metro — world's longest elevated metro network",
      "Historic Charminar, Golkonda Fort, Ramoji Film City",
      "Excellent food culture — Hyderabadi Biryani, cafe scene",
      "One of India's most business-friendly states (Telangana)",
    ],
    whyInvest: [
      "Fastest property appreciation in India — 20-30% in western Hyderabad (2023-24)",
      "Entry prices still 35-40% below Bangalore for comparable quality",
      "Business-friendly Telangana government with TS-iPass clearances",
      "Massive data centre and global capability centre investments underway",
      "Kokapet luxury zone expected to see sustained demand from CXO segment",
      "RERA-registered projects, strong builder delivery track record",
    ],
    marketTrend:
      "Hyderabad recorded its highest ever property registrations in 2024 with 70,000+ units sold. The luxury segment (Rs 2Cr+) grew 45% year-on-year. Kokapet has become India's hottest luxury micro-market. NRI investment is surging, particularly from US-based Telugu diaspora.",
    faqs: [
      {
        q: "What is the average flat price in Hyderabad?",
        a: "Flat prices in Hyderabad range from Rs 50L for a 2BHK in Kukatpally to Rs 3-6Cr for luxury flats in Kokapet or Gachibowli. Mid-segment 2BHKs near HITEC City average Rs 85L-1.8Cr.",
      },
      {
        q: "What is stamp duty in Hyderabad / Telangana?",
        a: "Stamp duty in Telangana is 4% for all residential buyers (no gender differential). Registration charges are 0.5%, and transfer duty is 1.5%. Total effective cost is 6%.",
      },
    ],
  },

  chennai: {
    name: "Chennai",
    state: "Tamil Nadu",
    famousFor: "Automobile capital of India and South Indian IT hub",
    overview:
      "Chennai, Tamil Nadu's capital, is India's fourth-largest city and the gateway to South India. Known as the Detroit of Asia for its automobile industry (home to Ford, Hyundai, BMW, Renault-Nissan plants), Chennai also hosts a thriving IT sector along the Old Mahabalipuram Road (OMR). The city blends traditional Tamil culture with modern IT suburbs, making it uniquely attractive for both conservative families and young professionals.",
    realEstateOverview:
      "Chennai's real estate market is characterised by strong end-user demand (low speculative buying), stable prices, and excellent developer quality. Anna Nagar, Adyar, and Besant Nagar are evergreen residential zones. OMR (Old Mahabalipuram Road) is the IT corridor. Pallikaranai, Perungudi, and Sholinganallur are mid-segment growth areas.",
    buyOverview:
      "Chennai offers stable, dependable real estate investment. Anna Nagar is the gold standard for residential living. Adyar and Besant Nagar are premium coastal zones. Pallikaranai and Sholinganallur on OMR offer IT-proximate living at mid-segment prices. Perambur and Ambattur in North Chennai offer affordable housing for factory workers.",
    rentOverview:
      "Chennai rental market is driven by IT professionals along OMR and manufacturing workers near Ambattur and Sriperumbudur. Velachery is a sought-after mid-segment rental hub near Phoenix Mall. OMR rental corridor is active from Perungudi to Siruseri.",
    newProjectsOverview:
      "Chennai's new projects are primarily along the OMR Phase 2 (Sholinganallur to Mahabalipuram), ECR (East Coast Road), and the upcoming Chennai Peripheral Ring Road zones. Chennai Metro Phase 2 (118 km) corridor-adjacent projects are gaining investor interest.",
    topLocalitiesBuy: [
      { name: "Anna Nagar", note: "Premium, best civic amenities, evergreen demand" },
      { name: "Adyar", note: "South Chennai premium, heritage neighbourhood" },
      { name: "Velachery", note: "Mid-premium, near Phoenix Mall and MRTS" },
      { name: "Sholinganallur", note: "OMR IT corridor, mid-segment apartments" },
      { name: "Pallikaranai", note: "Emerging IT zone, affordable flats" },
      { name: "Perambur", note: "North Chennai, affordable end-user friendly" },
      { name: "Chromepet", note: "Near airport, mid-segment, family area" },
      { name: "Nungambakkam", note: "Premium central, diplomatic zone" },
    ],
    topLocalitiesRent: [
      { name: "Sholinganallur / Perungudi", note: "OMR IT professionals, highest rental demand" },
      { name: "Velachery", note: "Central south, young professionals, good access" },
      { name: "Anna Nagar West", note: "Families, premium furnished flats" },
      { name: "T Nagar", note: "Commercial heart, retail zone proximity" },
      { name: "Ambattur", note: "Manufacturing belt, budget rentals" },
    ],
    topLocalitiesNewProjects: [
      { name: "OMR Phase 2 (Siruseri-Mahabalipuram)", note: "IT expansion zone, new township launches" },
      { name: "Perumbakkam / Medavakkam", note: "Affordable high-density projects near Velachery" },
      { name: "Red Hills (NH716)", note: "North Chennai growth zone, industrial proximity" },
    ],
    priceRangeBuy: "Rs 45L – Rs 5Cr",
    priceRangeRent: "Rs 10,000 – Rs 80,000/month",
    avgPricePerSqft: "Rs 5,000 – Rs 18,000/sqft",
    connectivity: [
      "Chennai International Airport — 13 km from T Nagar",
      "Chennai Metro Rail — 54 km, Blue and Green Line (Phase 2 under construction)",
      "MRTS (Mass Rapid Transit System) — south Chennai coastal rail link",
      "NH48 (Chennai-Bangalore), NH32 (Chennai-Kolkata)",
      "Old Mahabalipuram Road (OMR) — 60 km IT expressway",
      "Chennai Port Trust — India's second-largest port",
    ],
    highlights: [
      "30%+ of India's automobile production — Hyundai, Ford, BMW, Renault-Nissan",
      "Second-largest IT cluster in India along OMR",
      "IIT Madras, Anna University, Loyola College — top educational institutions",
      "Marina Beach — world's second longest urban beach",
      "Traditional Kanchipuram sarees, Carnatic music, Bharatanatyam — living culture",
      "Apollo, Fortis, MIOT — world-class medical tourism destination",
    ],
    whyInvest: [
      "Stable end-user market with low speculative bubbles",
      "Strong rental demand from IT (OMR) and manufacturing belt",
      "Chennai Metro Phase 2 (118 km) will unlock numerous new corridors",
      "Port-led industrial growth driving North Chennai appreciation",
      "TNRERA has fast-tracked project completions, improving buyer confidence",
      "ECR (East Coast Road) sea-view properties gaining weekend home interest",
    ],
    marketTrend:
      "Chennai property market in 2024 showed stable 7-10% appreciation in OMR and mid-segment zones. Anna Nagar and Adyar prices remained firm with limited supply. The luxury segment is growing along Nungambakkam and Boat Club Road. Metro Phase 2 construction is pushing pre-launch pricing in adjacent sectors.",
    faqs: [
      {
        q: "What is the average flat price in Chennai?",
        a: "Flat prices in Chennai range from Rs 45L for a 2BHK in Ambattur to Rs 3-5Cr in Anna Nagar or Adyar. Mid-segment 2BHKs on OMR average Rs 65L-1.4Cr.",
      },
      {
        q: "What is stamp duty in Chennai / Tamil Nadu?",
        a: "Stamp duty in Tamil Nadu is 7% for all buyers (no gender differential). Registration charges are 4% of guideline value. Total effective rate is 11% — among the highest in India.",
      },
    ],
  },

  ahmedabad: {
    name: "Ahmedabad",
    state: "Gujarat",
    famousFor: "India's first UNESCO World Heritage City and textile-pharma hub",
    overview:
      "Ahmedabad, the largest city in Gujarat, is one of India's most liveable and fastest-growing cities. The commercial capital of Gujarat and home to Indian industry icons like Adani, Torrent, Cadila, and Nirma, Ahmedabad blends heritage charm (UNESCO World Heritage City status) with modern infrastructure. The city's pro-business culture, low cost of living, and strong community values make it a preferred destination for professionals and families alike.",
    realEstateOverview:
      "Ahmedabad has a balanced real estate market — affordable to mid-premium, end-user driven, with low speculative activity. SG Highway (Sarkhej-Gandhinagar) is the IT and premium residential corridor. Prahlad Nagar and Bopal are popular for mid-premium buyers. South Ahmedabad (Narol, Vatva) is the industrial housing zone.",
    buyOverview:
      "Buying property in Ahmedabad offers the best value-for-money in any major Indian city. SG Highway, Prahlad Nagar, and Bodakdev offer premium options with excellent amenities. Bopal, Shilaj, and South Bopal are rapidly growing mid-segment zones. The upcoming Metro and GIFT City proximity are appreciating many corridors.",
    rentOverview:
      "Ahmedabad rental market is driven by professionals at Torrent, GIFT City (Gandhinagar), Pharmacity, and textile industries. Satellite and Prahladnagar are premium. Maninagar and Vatva cater to industrial workers. University Road has student demand from CEPT, Gujarat University, and IIM Ahmedabad vicinity.",
    newProjectsOverview:
      "New project activity in Ahmedabad is concentrated on SG Highway extension, Shela, South Bopal, Dholera SIR (India's first greenfield smart city), and GIFT City's residential zone in Gandhinagar.",
    topLocalitiesBuy: [
      { name: "SG Highway", note: "Premium IT corridor, gated high-rises, best amenities" },
      { name: "Prahlad Nagar", note: "Upscale, corporate crowd, premium malls nearby" },
      { name: "Bodakdev", note: "Old premium area, independent bungalows and high-rises" },
      { name: "Bopal", note: "Mid-segment townships, young families" },
      { name: "South Bopal", note: "Emerging, affordable, good builder projects" },
      { name: "Chandkheda", note: "North Ahmedabad, affordable near ISRO and PDPU" },
      { name: "Shela", note: "New suburban township zone, upcoming area" },
    ],
    topLocalitiesRent: [
      { name: "Satellite", note: "Premium, central west Ahmedabad, high demand" },
      { name: "Prahlad Nagar", note: "Corporate, mid-premium, young professionals" },
      { name: "Navrangpura", note: "Central, near CG Road, student-professional mix" },
      { name: "Bopal", note: "Affordable family rentals, growing hub" },
      { name: "Maninagar", note: "South Ahmedabad, budget rentals" },
    ],
    topLocalitiesNewProjects: [
      { name: "Dholera SIR", note: "India's first greenfield smart city — massive opportunity" },
      { name: "Shela / Ghuma", note: "New township zone on SH-17" },
      { name: "GIFT City (Gandhinagar)", note: "International financial centre residential component" },
    ],
    priceRangeBuy: "Rs 35L – Rs 3Cr",
    priceRangeRent: "Rs 8,000 – Rs 60,000/month",
    avgPricePerSqft: "Rs 3,500 – Rs 10,000/sqft",
    connectivity: [
      "Sardar Vallabhbhai Patel International Airport — 12 km",
      "Ahmedabad Metro (BRTS and Metro Rail) — Blue Line operational",
      "Ahmedabad-Mumbai National Highway NH48",
      "Ahmedabad-Vadodara Expressway (6-lane)",
      "Delhi-Mumbai Industrial Corridor (DMIC) node",
      "Bullet Train terminal (Ahmedabad-Mumbai MAHSR) coming by 2027",
    ],
    highlights: [
      "UNESCO World Heritage City — Walled City (pols) listed 2017",
      "IIM Ahmedabad — India's top MBA college",
      "Lowest cost of living among Indian metros",
      "GIFT City — India's first IFSC (International Financial Services Centre)",
      "Dholera SIR — India's first greenfield smart city under development",
      "Adani Group, Torrent Group, Zydus HQ — job security",
    ],
    whyInvest: [
      "Dholera Smart City is expected to be a 100-year investment — largest greenfield city in India",
      "GIFT City expansion driving corporate residential demand in Gandhinagar",
      "Bullet train corridor will bring Ahmedabad closer to Mumbai, boosting property values",
      "Best price per sqft in any major Indian city",
      "Stable market, low NPA rates, trustworthy developer ecosystem",
      "Pro-industry Gujarati business culture driving consistent employment growth",
    ],
    marketTrend:
      "Ahmedabad property market saw 8-12% appreciation in 2024, led by SG Highway and South Bopal. GIFT City residential component is seeing early-mover interest. The Bullet Train corridor announcement has already driven 15-20% appreciation in properties along NH48.",
    faqs: [
      {
        q: "What is the average flat price in Ahmedabad?",
        a: "Flat prices range from Rs 35L for a 2BHK in Maninagar or Chandkheda to Rs 1.5-3Cr for premium 3BHK on SG Highway. The mid-segment average is Rs 55-90L for a 2BHK.",
      },
      {
        q: "What is stamp duty in Ahmedabad / Gujarat?",
        a: "Stamp duty in Gujarat is 4.9% for all residential buyers. Registration charges are 1%. Total effective rate is approximately 5.9% — among the lowest in India.",
      },
    ],
  },

  jaipur: {
    name: "Jaipur",
    state: "Rajasthan",
    famousFor: "India's Pink City — heritage tourism and gems and jewellery hub",
    overview:
      "Jaipur, the Pink City and capital of Rajasthan, is one of India's most beautiful and historically rich cities. Known globally for its Amber Fort, Hawa Mahal, and vibrant bazaars, Jaipur has also emerged as a growing IT, manufacturing, and logistics hub. The city offers an exceptional quality of life — traditional architecture, warm community culture, and affordable cost of living — attracting both retirees and young professionals.",
    realEstateOverview:
      "Jaipur's real estate market is among the most affordable among India's Tier-1 cities. Malviya Nagar and C-Scheme are established premium zones. Mansarovar is the most popular planned township. Vaishali Nagar and Pratap Nagar are active mid-segment corridors. The Ajmer Road and Tonk Road corridors are seeing new township development.",
    buyOverview:
      "Buying property in Jaipur offers excellent value with strong appreciation potential due to infrastructure development (DMIC, Ring Road, Metro). Mansarovar and Vaishali Nagar are family favourites. Tonk Road is the emerging premium corridor. Ajmer Road is the industrial and budget housing zone.",
    rentOverview:
      "Jaipur rental market is driven by IT professionals, government employees, and students at Malaviya National Institute of Technology and University of Rajasthan. Malviya Nagar and C-Scheme command the highest rents. Mansarovar offers mid-range family rentals.",
    newProjectsOverview:
      "New project activity in Jaipur is concentrated on Tonk Road (Jagatpura zone), Ajmer Road (Mahindra SEZ corridor), Sirsi Road, and the upcoming Jaipur Ring Road influence zone.",
    topLocalitiesBuy: [
      { name: "Mansarovar", note: "Largest planned township, family-centric, all amenities" },
      { name: "Vaishali Nagar", note: "Upscale west Jaipur, premium malls and restaurants" },
      { name: "Malviya Nagar", note: "South Jaipur premium, IT belt proximity" },
      { name: "Tonk Road (Jagatpura)", note: "Emerging premium corridor, new high-rises" },
      { name: "Pratap Nagar", note: "Affordable mid-segment, good value" },
      { name: "Ajmer Road", note: "Industrial proximity, budget housing" },
    ],
    topLocalitiesRent: [
      { name: "Malviya Nagar", note: "IT professionals, premium flats" },
      { name: "C-Scheme", note: "Central Jaipur, government and corporate employees" },
      { name: "Vaishali Nagar", note: "Young families, social infrastructure" },
      { name: "Mansarovar", note: "Budget to mid-range, students and families" },
    ],
    topLocalitiesNewProjects: [
      { name: "Jagatpura (Tonk Road)", note: "Premium high-rises and villas coming up" },
      { name: "Sirsi Road", note: "Ring Road proximity, affordable township launches" },
      { name: "Muhana (Ring Road Zone)", note: "Large plotted development on peripheral road" },
    ],
    priceRangeBuy: "Rs 30L – Rs 2.5Cr",
    priceRangeRent: "Rs 7,000 – Rs 50,000/month",
    avgPricePerSqft: "Rs 3,000 – Rs 9,000/sqft",
    connectivity: [
      "Jaipur International Airport — Sanganer, 12 km from city",
      "Jaipur Metro — two corridors operational",
      "Delhi-Jaipur Highway (NH48) — 5.5 hours",
      "Delhi-Mumbai Industrial Corridor (DMIC) Khushkhera-Bhiwadi-Neemrana node",
      "Jaipur Ring Road — 150 km beltway under construction",
      "Dedicated Freight Corridor (DFC) terminal near Ajmer Road",
    ],
    highlights: [
      "UNESCO World Heritage Walled City, Amber Fort, Jantar Mantar",
      "Gems and Jewellery export hub — 25% of India's exports",
      "India's 3rd largest IT city by growth rate",
      "Rajasthan's capital — government employment base",
      "Tourism — 10 million+ tourists annually",
      "Lowest cost of premium residential living among Tier-1 cities",
    ],
    whyInvest: [
      "DMIC corridor investment driving industrial housing demand",
      "Tourism economy creates strong short-term rental (Airbnb) market",
      "Jaipur Ring Road will add 100+ km of development corridors",
      "IT sector growing at 20% annually — Infosys, Wipro expanding",
      "Entry prices 50-60% below NCR cities with comparable connectivity",
      "Heritage tourism city premium for boutique hotel conversions",
    ],
    marketTrend:
      "Jaipur property market appreciated 10-14% in 2024. The Tonk Road corridor is the hottest zone. Luxury home demand is growing from Delhi NCR second-home buyers. Mansarovar Extension and Pratap Nagar Phase 2 saw strong first-time buyer absorption.",
    faqs: [
      {
        q: "What is the average flat price in Jaipur?",
        a: "Flat prices in Jaipur range from Rs 30L for a 2BHK in Pratap Nagar to Rs 1.5-2.5Cr for premium 3BHK in Vaishali Nagar or Tonk Road. The sweet spot is Rs 50-85L for a 2BHK in Mansarovar.",
      },
      {
        q: "What is stamp duty in Jaipur / Rajasthan?",
        a: "Stamp duty in Rajasthan is 6% for men and 5% for women. Registration charge is 1%. Total effective rate is 7% for men and 6% for women.",
      },
    ],
  },

  lucknow: {
    name: "Lucknow",
    state: "Uttar Pradesh",
    famousFor: "City of Nawabs — culture, cuisine, and UP government hub",
    overview:
      "Lucknow, the capital of Uttar Pradesh, is one of India's most culturally rich cities. Known for its Nawabi architecture (Bara Imambara, Rumi Darwaza), sophisticated tehzeeb (etiquette), Chikankari embroidery, and Tunday Kababi cuisine, Lucknow is also transforming rapidly into a modern IT and services hub. The city hosts the UP Secretariat, High Court, and is the administrative centre for India's most populous state.",
    realEstateOverview:
      "Lucknow's real estate market has seen significant growth over the past five years, driven by Expressway connectivity to Agra and Kanpur, Lucknow Metro operations, and UPSIDA industrial estates. Gomti Nagar is the premium zone. Vibhuti Khand and Aliganj are established mid-segment areas. New township development is happening along Faizabad Road and Sultanpur Road.",
    buyOverview:
      "Buying property in Lucknow offers excellent value — large apartments at prices significantly below Delhi NCR. Gomti Nagar Extension is the hottest new zone with luxury high-rises and township projects. Shaheed Path and Sultanpur Road are emerging corridors with major builder presence.",
    rentOverview:
      "Lucknow rental market is driven by government employees, IT professionals, and students of Lucknow University, IIM Lucknow, and SGPGI. Gomti Nagar and Indira Nagar are popular rental zones for professionals. Aliganj is student-heavy.",
    newProjectsOverview:
      "New projects are concentrated in Gomti Nagar Extension, Shaheed Path belt, Sultanpur Road, and the Lucknow Smart City Mission zones. Sushant Golf City is a large integrated township seeing new launches.",
    topLocalitiesBuy: [
      { name: "Gomti Nagar", note: "Premium, UP government HQ proximity, established" },
      { name: "Gomti Nagar Extension", note: "Fastest growing — luxury high-rises and plots" },
      { name: "Sushant Golf City", note: "International township, golf course, villas" },
      { name: "Indira Nagar", note: "Mid-segment, highly liveable, all amenities" },
      { name: "Aliganj", note: "Affordable, old established residential" },
      { name: "Shaheed Path", note: "Emerging expressway-proximate new development" },
    ],
    topLocalitiesRent: [
      { name: "Gomti Nagar", note: "Government and corporate rentals, premium" },
      { name: "Indira Nagar", note: "IT professionals, families, mid-range" },
      { name: "Hazratganj", note: "Central Lucknow, commercial hub proximity" },
      { name: "Aliganj", note: "Students, budget rentals" },
    ],
    topLocalitiesNewProjects: [
      { name: "Gomti Nagar Extension (Sectors 1-7)", note: "Premium high-rises, ATS, Supertech" },
      { name: "Sultanpur Road", note: "Upcoming expressway-adjacent township launches" },
      { name: "Raebareli Road", note: "Affordable plotted development zone" },
    ],
    priceRangeBuy: "Rs 30L – Rs 2Cr",
    priceRangeRent: "Rs 7,000 – Rs 40,000/month",
    avgPricePerSqft: "Rs 3,000 – Rs 8,000/sqft",
    connectivity: [
      "Chaudhary Charan Singh International Airport — 15 km",
      "Lucknow Metro — Blue and Red line (23 km operational)",
      "Agra-Lucknow Expressway (302 km, 6-lane)",
      "Lucknow-Kanpur Expressway (60 km under construction)",
      "NH27 (Lucknow-Gorakhpur), NH28 (Lucknow-Muzaffarpur)",
      "Charbagh Railway Station — one of the most beautiful stations in India",
    ],
    highlights: [
      "India's most culturally distinctive city — Nawabi heritage",
      "UP Government Capital — largest state administration employer",
      "IIM Lucknow, Lucknow University, SGPGI medical university",
      "Growing IT parks at Vibhuti Khand, TCS and Wipro campuses",
      "Lucknow Metro rated India's best metro system for service quality",
      "Low crime rate, high liveability index among Tier-2 cities",
    ],
    whyInvest: [
      "Agra-Lucknow Expressway driving residential development in adjacent zones",
      "State capital status ensures steady government employee housing demand",
      "Property prices 40-60% below Delhi NCR with similar quality new projects",
      "Gomti Nagar Extension is the fastest appreciating zone in UP after Noida",
      "Lucknow Metro expansion boosting values along new corridors",
      "IIM Lucknow executive rental demand near Sitapur Road",
    ],
    marketTrend:
      "Lucknow real estate appreciated 10-14% in 2024. Gomti Nagar Extension is the standout performer. Premium villa and plotted developments near Sushant Golf City are fully sold out. Smart City infrastructure work is regenerating the Hazratganj central zone.",
    faqs: [
      {
        q: "What is the average flat price in Lucknow?",
        a: "Flat prices in Lucknow range from Rs 30L for a 2BHK in Aliganj to Rs 1.5-2Cr for premium flats in Gomti Nagar Extension or Sushant Golf City. Mid-segment 2BHKs average Rs 45-80L.",
      },
    ],
  },
};

// ─── STATE DATA ───────────────────────────────────────────────────────────────

export const stateDatabase: Record<string, StateData> = {
  maharashtra: {
    name: "Maharashtra",
    capital: "Mumbai",
    overview:
      "Maharashtra is India's wealthiest and most industrialised state, contributing nearly 15% of India's GDP. Home to the country's financial capital (Mumbai), IT hub (Pune), and entertainment industry (Bollywood), Maharashtra offers unparalleled economic opportunity. The state's coastline, Western Ghats, and Konkan belt also make it a top destination for second homes and tourism investment.",
    realEstateOverview:
      "Maharashtra has India's most mature and developed real estate market, governed by MahaRERA — one of the country's strictest regulatory frameworks. The market ranges from ultra-luxury Mumbai towers to affordable plotted developments in Nashik, Nagpur, and Aurangabad.",
    topCities: [
      { name: "Mumbai", slug: "mumbai", note: "India's financial capital" },
      { name: "Pune", slug: "pune", note: "IT and education hub" },
      { name: "Thane", slug: "thane", note: "Mumbai's growing neighbour" },
      { name: "Navi Mumbai", slug: "navi-mumbai", note: "Planned township, new airport coming" },
      { name: "Nashik", slug: "nashik", note: "Wine capital, affordable tier-2" },
      { name: "Nagpur", slug: "nagpur", note: "Zero Mile City, MIHAN, new opportunities" },
    ],
    highlights: [
      "India's largest state economy — Rs 36 lakh crore GDP",
      "Mumbai — BSE, NSE, RBI, and 60% of India's FDI",
      "MahaRERA — strongest consumer protection in Indian real estate",
      "Coastal Konkan and Western Ghats — natural beauty and tourism economy",
      "DMIC (Delhi-Mumbai Industrial Corridor) passing through Pune-Nashik axis",
    ],
    marketTrend:
      "Maharashtra recorded 9.5 lakh property registrations in 2024 — highest ever. Mumbai, Pune, and Thane-Navi Mumbai belt account for 75% of volumes. The state government has reduced stamp duty for women buyers from 6% to 5%, boosting first-time buyer demand.",
  },
  karnataka: {
    name: "Karnataka",
    capital: "Bangalore",
    overview:
      "Karnataka is South India's largest economy and India's technology powerhouse. Bengaluru alone accounts for 37% of India's IT exports and hosts the world's most vibrant startup ecosystem outside Silicon Valley. The state's varied geography — coastal Mangalore, coffee-growing Coorg, and the heritage-rich Hampi — gives it both economic strength and lifestyle appeal.",
    realEstateOverview:
      "Karnataka's real estate market is dominated by Bengaluru, which alone accounts for 90% of the state's residential transactions. RERA Karnataka (K-RERA) is active and transparent. Cities like Mysuru, Mangaluru, and Hubli-Dharwad are also seeing growing interest from professionals and retirees.",
    topCities: [
      { name: "Bangalore", slug: "bangalore", note: "India's Silicon Valley" },
      { name: "Mysuru", slug: "mysuru", note: "Heritage city, retiree favourite" },
      { name: "Mangaluru", slug: "mangaluru", note: "Coastal city, NRI investment hub" },
      { name: "Hubli-Dharwad", slug: "hubli", note: "North Karnataka commercial centre" },
    ],
    highlights: [
      "37% of India's IT exports — Bengaluru alone",
      "40+ unicorn startups headquartered in Karnataka",
      "Namma Metro Phase 2 — 70+ km metro operational",
      "Aerospace and Defence manufacturing hub (HAL, ISRO, DRDO)",
      "Coffee, silk, and sandalwood trade sustaining rural economy",
    ],
    marketTrend:
      "Karnataka (led by Bengaluru) recorded 1.4 lakh property registrations in 2024. North Bangalore appreciation hit 25-30% in some sectors. Luxury Rs 3Cr+ segment grew 40% year-on-year. Mysuru is seeing retirement community demand from Bangalore residents.",
  },
  "uttar-pradesh": {
    name: "Uttar Pradesh",
    capital: "Lucknow",
    overview:
      "Uttar Pradesh is India's most populous state and the country's largest consumer market. The state's expressway network (Yamuna, Agra-Lucknow, Purvanchal, Bundelkhand) has unlocked industrial and residential development across the entire state. With major religious tourism (Ayodhya, Varanasi, Mathura), IT growth (Noida), and Defence manufacturing (Lucknow-Kanpur corridor), UP is a multi-dimensional investment story.",
    realEstateOverview:
      "UP RERA is one of India's most active real estate regulators, having resolved thousands of stalled project cases. Noida and Greater Noida are the state's premium residential markets. Lucknow offers excellent value. Varanasi, Agra, and Ayodhya are emerging tourism-driven real estate markets.",
    topCities: [
      { name: "Noida", slug: "noida", note: "Delhi NCR IT and media hub" },
      { name: "Greater Noida", slug: "greater-noida", note: "Planned city, Jewar airport vicinity" },
      { name: "Lucknow", slug: "lucknow", note: "State capital, Nawabi city" },
      { name: "Ghaziabad", slug: "ghaziabad", note: "NCR gateway, affordability hub" },
      { name: "Agra", slug: "agra", note: "Taj Mahal city, tourism real estate" },
      { name: "Varanasi", slug: "varanasi", note: "Spiritual capital, Smart City" },
    ],
    highlights: [
      "India's most populous state — 24 crore people",
      "Yamuna Expressway Industrial Development Area (YEIDA) — Jewar airport",
      "Expressway network: 5 operational, 3 under construction",
      "Defence Industrial Corridor — Kanpur to Lucknow belt",
      "Ayodhya Ram Temple driving tourism real estate boom",
    ],
    marketTrend:
      "UP real estate saw record registrations across all districts in 2024. The Yamuna Expressway zone (Greater Noida, Jewar) is the hottest corridor. Lucknow Gomti Nagar Extension and Lucknow-Kanpur Expressway zone are attracting builder launches. Ayodhya real estate has appreciated 50-80% since the temple inauguration.",
  },
};

// ─── LOOKUP HELPERS ───────────────────────────────────────────────────────────

export function getCityData(citySlug: string): CityData | null {
  if (!citySlug) return null;
  const key = citySlug.toLowerCase().replace(/\s+/g, "-");
  if (cityDatabase[key]) return cityDatabase[key];
  const noHyphen = key.replace(/-/g, "");
  const found = Object.keys(cityDatabase).find(
    (k) => k.replace(/-/g, "") === noHyphen,
  );
  return found ? cityDatabase[found] : null;
}

export function getStateData(stateSlug: string): StateData | null {
  if (!stateSlug) return null;
  const key = stateSlug.toLowerCase().replace(/\s+/g, "-");
  return stateDatabase[key] || null;
}

export type ContentVariant =
  | "buy"
  | "flats-for-sale"
  | "flats-for-rent"
  | "new-projects"
  | "rent"
  | "property-for-sale"
  | "property-for-rent"
  | "commercial"
  | "office-rent"
  | "villa-sale"
  | "plot-sale"
  | "pg";
