export type CuratedCategory = {
  slug: string;
  title: string;
  kicker: string;
  description: string;
  destinationNames: string[];
  coverName: string;
};

/** Additive editorial collections. Each name resolves to an existing destination record and its exact mapped image. */
export const CURATED_CATEGORIES: CuratedCategory[] = [
  { slug: "lakes", title: "Lakes", kicker: "WATER / SLOW TRAVEL", description: "Still water, high-altitude horizons and wetlands where the day moves at a gentler pace.", destinationNames: ["Laknavaram Lake", "Ousteri Wetlands", "Moirang Wetlands", "Kanjli Wetland", "Dudhni Lakeside", "Kadmat Lagoon", "Harike Wetlands", "Sukhna Nature Trails"], coverName: "Laknavaram Lake" },
  { slug: "forests", title: "Forests", kicker: "WILD / GROUNDING", description: "National parks, forest trails and living landscapes for a quieter kind of adventure.", destinationNames: ["Kanger Valley", "Polo Forest", "Kalesar Forest", "Buxa Foothills", "Yuksom Forests", "Baratang Mangroves", "Agumbe Hinterland", "Valmiki Forest"], coverName: "Kanger Valley" },
  { slug: "peaceful-places", title: "Peaceful Places", kicker: "QUIET / UNHURRIED", description: "Valleys, villages and slow corners of India that make space for the mind to breathe.", destinationNames: ["Mechuka Valley", "Gurez Valley", "Lolab Valley", "Munsiyari Backroads", "Hmuifang", "Nongriat Village", "Mawsynram", "Pabbar Valley"], coverName: "Mechuka Valley" },
  { slug: "weekend-getaways", title: "Weekend Getaways", kicker: "48 HOURS / ELSEWHERE", description: "Short escapes with enough distance to feel like a reset and enough time to return refreshed.", destinationNames: ["Bhandardara Backroads", "Patratu Valley", "Netarhat", "Orchha Rural Circuit", "Barot Valley", "Kaas Plateau Edge", "Netravali", "Sukhna Nature Trails"], coverName: "Bhandardara Backroads" },
  { slug: "local-food", title: "Local Food", kicker: "TASTE / PLACE", description: "A starting point for regional dishes and the neighbourhoods where the food story begins.", destinationNames: ["Charminar", "Amaravati", "Bishnupur Craft Trails", "Kumbalangi", "Ananthagiri Hills", "Dholavira", "Nagoa Village Coast", "Galgibaga"], coverName: "Kumbalangi" },
  { slug: "photography-places", title: "Photography Places", kicker: "LIGHT / FRAME", description: "Fort walls, wetlands, valleys and living heritage that reward a slower eye.", destinationNames: ["Gandikota", "Dholavira", "Chitrakote Hinterland", "Munsiyari Backroads", "Dzuko Valley Trail", "Nongriat Village", "Rakhigarhi", "Ayodhya"], coverName: "Gandikota" },
];

export type FoodGuide = { city: string; state: string; dish: string; note: string };
export const FOOD_GUIDES: FoodGuide[] = [
  { city: "Hyderabad", state: "Telangana", dish: "Hyderabadi biryani", note: "Use the live nearby search for currently open restaurants and local food streets." },
  { city: "Amritsar", state: "Punjab", dish: "Amritsari kulcha", note: "Search the exact destination area for current shops and opening hours." },
  { city: "Lucknow", state: "Uttar Pradesh", dish: "Awadhi cuisine", note: "Restaurant names, ratings and prices are intentionally live-search only." },
  { city: "Indore", state: "Madhya Pradesh", dish: "Poha and street food", note: "Try the destination-aware Google Maps search for current stalls." },
  { city: "Kochi", state: "Kerala", dish: "Sadya and coastal cuisine", note: "Check live listings before travelling; menus and hours change." },
  { city: "Jaipur", state: "Rajasthan", dish: "Dal baati churma", note: "Use the nearby search to compare current local options." },
  { city: "Mumbai", state: "Maharashtra", dish: "Vada pav and street food", note: "Live listings are provided instead of invented recommendations." },
  { city: "Chennai", state: "Tamil Nadu", dish: "Dosa and South Indian cuisine", note: "Search by the selected destination for current food options." },
];
