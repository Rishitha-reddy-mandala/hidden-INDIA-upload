import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Bookmark,
  Camera,
  Check,
  ChevronDown,
  Compass,
  ExternalLink,
  Heart,
  Home as HomeIcon,
  Leaf,
  MapPin,
  Menu,
  Mountain,
  Search,
  Sparkles,
  Sun,
  Waves,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  CATEGORIES,
  DESTINATIONS,
  HERO_IMAGE,
  MOODS,
  REGIONS,
  STATES,
  type Destination,
} from "@shared/destinations";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { AIChatBox, type Message as HinaMessage } from "./components/AIChatBox";
import { MapView } from "./components/Map";
import { CURATED_CATEGORIES, FOOD_GUIDES, type CuratedCategory } from "./curated";

const SPIRITUAL_IMAGE = "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=2200&q=88";
const ease = [0.23, 1, 0.32, 1] as const;
type ActivityDetail = {
  slug: string;
  title: string;
  label: string;
  description: string;
  detail: string;
  why: string;
  bestTime: string;
  tips: readonly string[];
  images: string[];
};
const ACTIVITY_LIBRARY = [
  { key: "wildlife", label: "WILDLIFE", title: "Wildlife encounters", description: "Move quietly through the habitats and edges where this region’s wild life still sets the pace.", detail: "Look for low-impact ways to experience the landscape: a local naturalist, a marked trail, or a patient hour at the edge of a wetland or forest. The best sightings are never guaranteed, which is part of the point.", tips: ["Use a local guide where access is sensitive.", "Keep distance from animals and never feed wildlife."] },
  { key: "water", label: "WATER", title: "Water, slowly found", description: "Spend time beside the lakes, rivers, falls or coastlines that shape the character of this place.", detail: "Give the water more than a quick photograph. Follow a shoreline, sit with the changing light, or ask a local host which access points remain respectful and open in the current season.", tips: ["Check local access and weather before setting out.", "Carry back every piece of waste, including snack wrappers."] },
  { key: "birding", label: "BIRDING", title: "Birding by ear", description: "Trade the checklist for a slow morning listening to the region’s wetlands, groves and open country.", detail: "Early light reveals a different layer of the destination. Even without specialist equipment, a quiet walk with a local birder or naturalist can turn familiar trees and fields into a living field guide.", tips: ["Start before the heat and carry binoculars if you have them.", "Avoid playback calls around nesting areas."] },
  { key: "peaceful", label: "SLOW TRAVEL", title: "A quieter way to be here", description: "Make room for unhurried walks, long views and the small rhythms that do not fit an itinerary.", detail: "The most memorable part of this destination may be an hour without a plan: tea with a host, a village lane at dusk, or a bench facing the landscape. Leave gaps in the day for those moments.", tips: ["Keep one half-day deliberately unscheduled.", "Choose locally run stays and experiences where possible."] },
  { key: "food", label: "FOOD & PLACE", title: "Eat the landscape", description: "Follow the local food story from regional ingredients to markets, cafés and everyday kitchens.", detail: "Start with the region rather than a fixed restaurant list. Ask where residents buy breakfast, which market is active today, and what seasonal dish is worth seeking. Live listings below keep current recommendations destination-specific.", tips: ["Search current food listings before travelling.", "Ask about ingredients and dietary needs directly at each place."] },
  { key: "photography", label: "LIGHT / FRAME", title: "Photograph with patience", description: "Find the angles, textures and human details that reward a slower eye.", detail: "This is a place for observing before framing. Work with changing light, ask before photographing people, and look beyond the obvious viewpoint for details that belong to the destination itself.", tips: ["Ask permission before photographing people or homes.", "Avoid climbing or entering fragile structures for a frame."] },
  { key: "heritage", label: "LIVING HERITAGE", title: "Read the layers of place", description: "Trace the architecture, craft, memory and everyday rituals that give this region its depth.", detail: "Heritage is not only a monument. Notice the materials, foodways, festivals and working landscapes around it. A local storyteller or guide can help you understand what a quick visit leaves out.", tips: ["Dress and behave appropriately at active sacred sites.", "Support local guides, makers and community-run spaces."] },
  { key: "adventure", label: "OUTDOORS", title: "Take the scenic route", description: "Choose a grounded outdoor adventure that lets the terrain reveal itself at walking pace.", detail: "Whether the route is a ridge, backroad, forest edge or village trail, choose the version that matches the season and your ability. The goal is a deeper relationship with the landscape, not a box to tick.", tips: ["Confirm route conditions and permits locally.", "Share your route and carry water, sun protection and a charged phone."] },
  { key: "village", label: "VILLAGE / CULTURE", title: "Meet the everyday India", description: "Spend time with the people, crafts and routines that make this destination more than a view.", detail: "Go with curiosity, not a performance brief. Buy directly from makers, follow community guidance, and let conversations happen naturally rather than turning daily life into a backdrop.", tips: ["Ask before entering homes, farms or community spaces.", "Pay fairly for guided visits, workshops and handmade work."] },
] as const;
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function getDestinationActivities(destination: Destination): ActivityDetail[] {
  const signals = `${destination.name} ${destination.state} ${destination.region} ${destination.description} ${destination.whyHidden} ${destination.categories.join(" ")} ${destination.travelStyles.join(" ")} ${destination.activities.join(" ")}`.toLowerCase();
  const priority = ["wildlife", "water", "birding", "peaceful", "food", "photography", "heritage", "adventure", "village"];
  const ranked = ACTIVITY_LIBRARY.map((item) => ({ item, score: priority.indexOf(item.key) + (signals.includes(item.key) ? -6 : 0) })).sort((a, b) => a.score - b.score).slice(0, 6).map(({ item }) => item);
  const related = DESTINATIONS.filter((item) => item.region === destination.region && item.slug !== destination.slug).flatMap((item) => [item.image, ...item.gallery]);
  const images = Array.from(new Set([...destination.gallery, destination.image, ...related]));
  return ranked.map((item, index) => ({ ...item, slug: item.key, description: `${item.description} In ${destination.name}, ${destination.state}, it becomes a way to notice the place on its own terms.`, detail: `${item.detail} ${destination.whyHidden}`, why: `${destination.name} is a natural fit because its ${destination.categories.slice(0, 2).join(" and ").toLowerCase()} character keeps the experience connected to the landscape rather than a generic attraction.`, bestTime: destination.bestTime, images: [images[index % images.length], images[(index + 1) % images.length]].filter(Boolean) }));
}

function imageFallback(event: React.SyntheticEvent<HTMLImageElement>) {
  const slug = event.currentTarget.alt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const placeholder = `/placeholders/${slug}.svg`;
  if (event.currentTarget.src !== placeholder) event.currentTarget.src = placeholder;
}

function IconForMood({ value }: { value: string }) {
  const iconProps = { size: 18, strokeWidth: 1.7 };
  if (value === "Mountains") return <Mountain {...iconProps} />;
  if (value === "Water") return <Waves {...iconProps} />;
  if (value === "Photography") return <Camera {...iconProps} />;
  if (value === "Village") return <HomeIcon {...iconProps} />;
  if (value === "Offbeat") return <Sparkles {...iconProps} />;
  if (value === "Adventure") return <Compass {...iconProps} />;
  return <Leaf {...iconProps} />;
}

function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("hidden-india-favorites") ?? "[]");
    } catch {
      return [];
    }
  });
  const toggle = (slug: string) => {
    setFavorites((current) => {
      const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
      localStorage.setItem("hidden-india-favorites", JSON.stringify(next));
      return next;
    });
  };
  return { favorites, toggle };
}

function App() {
  const [location, setLocation] = useLocation();
  const { favorites, toggle } = useFavorites();
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [surprise, setSurprise] = useState<Destination | null>(null);
  const [toast, setToast] = useState("");

  const go = (path: string) => {
    setLocation(path);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };
  const surpriseMe = () => {
    const next = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];
    setSurprise(next);
    notify("A new escape found for you");
  };

  const detailMatch = location.match(/^\/destinations\/([^/]+)/);
  const activityMatch = location.match(/^\/destinations\/([^/]+)\/activities\/([^/]+)/);
  const planMatch = location.match(/^\/plan-my-trip(?:\/([^/]+))?/);
  const stateMatch = location.match(/^\/states\/([^/]+)/);
  const categoryMatch = location.match(/^\/categories\/([^/]+)/);
  const detail = detailMatch ? DESTINATIONS.find((destination) => destination.slug === detailMatch[1]) : undefined;
  const activityDestination = activityMatch ? DESTINATIONS.find((destination) => destination.slug === activityMatch[1]) : undefined;
  const activity = activityDestination && activityMatch ? getDestinationActivities(activityDestination).find((item) => item.slug === activityMatch[2]) : undefined;
  const planDestination = planMatch?.[1] ? DESTINATIONS.find((item) => item.slug === planMatch[1]) : undefined;
  const stateName = stateMatch ? decodeURIComponent(stateMatch[1]).replace(/-/g, " ") : undefined;
  const stateDestinations = stateName
    ? DESTINATIONS.filter((destination) => destination.state.toLowerCase().replace(/[^a-z]+/g, "-") === stateMatch?.[1])
    : [];

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <div className="site-shell">
            <Navigation location={location} favoritesCount={favorites.length} mobileNav={mobileNav} setMobileNav={setMobileNav} go={go} />
            <AnimatePresence mode="wait">
              <motion.main key={location} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                {location === "/" && <HomePage go={go} search={search} setSearch={setSearch} surpriseMe={surpriseMe} surprise={surprise} toggle={toggle} favorites={favorites} />}
                {location === "/explore" && <ExplorePage go={go} search={search} setSearch={setSearch} toggle={toggle} favorites={favorites} />}
                {location === "/states" && <StatesPage go={go} />}
                {planMatch && <PlanTripPage go={go} preselected={planDestination} />}
                {location === "/categories" && <CategoryDirectoryPage go={go} />}
                {categoryMatch && <CategoryPage go={go} category={CURATED_CATEGORIES.find((item) => item.slug === categoryMatch[1])} />}
                {stateMatch && <StatePage go={go} stateName={stateName ?? ""} destinations={stateDestinations} toggle={toggle} favorites={favorites} />}
                {activityMatch && <ActivityPage go={go} destination={activityDestination} activity={activity} />}
                {!activityMatch && detailMatch && <DestinationPage go={go} destination={detail} toggle={toggle} favorites={favorites} />}
                {location === "/my-hidden-list" && <SavedPage go={go} favorites={favorites} toggle={toggle} />}
                {location === "/about" && <AboutPage go={go} />}
                {location !== "/" && location !== "/explore" && location !== "/states" && !planMatch && location !== "/categories" && !categoryMatch && !stateMatch && !detailMatch && !activityMatch && location !== "/my-hidden-list" && location !== "/about" && <NotFound go={go} />}
              </motion.main>
            </AnimatePresence>
            <Footer go={go} />
            <HinaAssistant destination={detail} />
            <AnimatePresence>{toast && <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}><Check size={16} />{toast}</motion.div>}</AnimatePresence>
            <Toaster />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function HinaAssistant({ destination }: { destination?: Destination }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<HinaMessage[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem("hidden-india-hina-chat") ?? "[]");
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    sessionStorage.setItem("hidden-india-hina-chat", JSON.stringify(messages));
  }, [messages]);
  const newChat = () => {
    setMessages([]);
    sessionStorage.removeItem("hidden-india-hina-chat");
  };
  const findPlaces = (query: string) => DESTINATIONS.filter((item) => `${item.name} ${item.state} ${item.region} ${item.categories.join(" ")} ${item.travelStyles.join(" ")} ${item.description}`.toLowerCase().includes(query)).slice(0, 3);
  const liveSearchNote = (place: string, kind: "food" | "stay") => {
    const query = kind === "food" ? `restaurants cafes local food near ${place}` : `hotels homestays resorts near ${place}`;
    const label = kind === "food" ? "nearby Local Food search" : "Where to Stay Nearby search";
    return `I don’t have verified live ${kind === "food" ? "food" : "accommodation"} listings for **${place}**. Use the [${label}](/destinations/${slugify(place.split(",")[0])}) for current names, distance, ratings, menus, prices, opening hours and availability. Live Google Maps search: [Open current results](https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}).`;
  };
  const respond = (content: string) => {
    const query = content.toLowerCase().trim();
    const activePlace = destination ? `${destination.name}, ${destination.state}` : "";
    const context = destination ? `You’re viewing **${destination.name}**, ${destination.state}. ` : "";
    const mentioned = DESTINATIONS.filter((item) => query.includes(item.name.toLowerCase())).slice(0, 3);
    if (!query) return "Tell me what kind of trip you’re imagining and I’ll help you shape it.";
    if ((query.includes("food") || query.includes("restaurant") || query.includes("cafe") || query.includes("eat"))) return `${context}${liveSearchNote(activePlace || mentioned[0]?.name || "your selected destination", "food")}`;
    if (query.includes("hotel") || query.includes("stay") || query.includes("accommodation") || query.includes("homestay")) return `${context}${liveSearchNote(activePlace || mentioned[0]?.name || "your selected destination", "stay")}`;
    if (query.includes("compare") || query.includes(" vs ") || query.includes("versus")) {
      const compare = mentioned.length >= 2 ? mentioned : findPlaces(query.replace(/compare|versus|vs/g, "").trim());
      if (compare.length < 2) return "Which two destinations should I compare? Tell me their names, and I’ll look at pace, landscape, best time and the kind of traveller each suits.";
      return `### ${compare[0].name} vs ${compare[1].name}\n\n- **${compare[0].name}:** ${compare[0].description} Best time: ${compare[0].bestTime}.\n- **${compare[1].name}:** ${compare[1].description} Best time: ${compare[1].bestTime}.\n\nChoose **${compare[0].name}** for ${compare[0].travelStyles.slice(0, 2).join(" and ").toLowerCase()} energy; choose **${compare[1].name}** for ${compare[1].travelStyles.slice(0, 2).join(" and ").toLowerCase()} days.`;
    }
    if (query.includes("plan") || query.includes("itinerary") || query.includes("day trip") || query.includes("days")) {
      if (!destination && !mentioned[0]) return "I can make a simple day-by-day plan. Which destination, how many days, and what pace do you want: peaceful, food-led, photography, heritage or adventure?";
      const place = destination ?? mentioned[0];
      const days = Number(query.match(/(\d+)\s*day/)?.[1] ?? 2);
      const activities = place.activities.slice(0, Math.max(2, Math.min(days + 1, 4)));
      return `### A gentle ${days}-day outline for ${place.name}\n\n${Array.from({ length: Math.min(days, 4) }, (_, index) => `**Day ${index + 1}** — ${activities[index % activities.length] ?? "Arrive, settle in and follow the local pace."}. Leave time for an unplanned walk and ask locally about current access.`).join("\n\n")}\n\nBest time: **${place.bestTime}**. I’m keeping live restaurants, stays, prices and transport out of this plan because I don’t have verified current listings.`;
    }
    if (query.includes("peaceful") || query.includes("quiet") || query.includes("slow")) {
      const places = destination ? [destination] : findPlaces("peaceful");
      return `${context}For a quieter trip, look at **${places.map((item) => item.name).join(", ")}**. Prioritise local stays, one anchor activity per day and space for the destination to surprise you.`;
    }
    if (query.includes("mountain") || query.includes("himalaya")) return "For mountain air and a slower rhythm, start with **Mechuka Valley**, **Dzongu Valley** or **Munsiyari** in the catalog. Tell me your season and number of days and I’ll narrow it down.";
    if (query.includes("coast") || query.includes("beach")) return "For a quieter coast, look at **Galgibaga**, **Long Island** or **Nagoa Village Coast**. Tell me whether you want swimming, photography, food or very little planned.";
    if (query.includes("photo") || query.includes("photography")) return "For a photography-led escape, consider **Dholavira**, **Gandikota**, **Munsiyari Backroads** or **Chitrakote Hinterland**. Ask before photographing people and avoid fragile viewpoints.";
    if (query.includes("best time") || query.includes("when should") || query.includes("season")) return destination ? `For **${destination.name}**, the catalog suggests **${destination.bestTime}**. Seasonal access can change, so confirm locally before travelling.` : "Which destination are you considering? I can share the catalog’s best-time note and flag what should be checked locally.";
    return `${context}I can help with destination ideas, comparisons, a day-by-day outline, the best time to visit, or live-search links for food and stays. What matters most: mood, budget, duration, season or interests?`;
  };
  const send = async (content: string) => {
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setIsLoading(true);
    try {
      const response = await fetch("/api/hina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, destination: destination ? { name: destination.name, state: destination.state, description: destination.description, bestTime: destination.bestTime, activities: destination.activities } : undefined, catalog: DESTINATIONS.map((item) => ({ name: item.name, state: item.state, region: item.region, description: item.description, bestTime: item.bestTime, categories: item.categories, travelStyles: item.travelStyles, activities: item.activities })) }),
      });
      if (!response.ok) throw new Error("live assistant unavailable");
      const payload = await response.json() as { content?: string };
      if (!payload.content) throw new Error("empty assistant response");
      setMessages((current) => [...current, { role: "assistant", content: payload.content! }]);
    } catch {
      // Keep HINA useful in static previews or when the live model is unavailable.
      setMessages((current) => [...current, { role: "assistant", content: respond(content) }]);
    } finally {
      setIsLoading(false);
    }
  };
  return <>
    <motion.button className="hina-launcher" onClick={() => setOpen(!open)} whileHover={{ y: -4 }} whileTap={{ scale: .95 }} aria-label="Open HINA travel guide"><span className="hina-launcher-pulse" /><Bot size={19} /><span>Ask HINA</span></motion.button>
    <AnimatePresence>{open && <motion.aside className="hina-panel" initial={{ opacity: 0, y: 28, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: .97 }} transition={{ duration: .28, ease }}><div className="hina-panel-head"><div><span className="hina-avatar"><Bot size={18} /></span><div><strong>HINA</strong><small>{destination ? `Exploring ${destination.name}` : "Hidden India Navigation Assistant"}</small></div></div><div className="hina-panel-actions"><button onClick={newChat} aria-label="Start a new HINA chat" title="New chat">New chat</button><button onClick={() => setOpen(false)} aria-label="Close HINA"><X size={17} /></button></div></div><AIChatBox messages={messages} onSendMessage={send} isLoading={isLoading} height="440px" placeholder="Ask about places, food, stays or trip plans…" emptyStateMessage={destination ? `Ask me about ${destination.name}.` : "Your personal map starts here."} suggestedPrompts={["Find me a peaceful 3-day mountain trip", "What should I eat here?", "Compare two quiet weekend escapes"]} className="hina-chat" /></motion.aside>}</AnimatePresence>
  </>;
}

function PlanTripPage({ go, preselected }: { go: (path: string) => void; preselected?: Destination }) {
  const [origin, setOrigin] = useState("Delhi");
  const [state, setState] = useState(preselected?.state ?? "");
  const [destinationSlug, setDestinationSlug] = useState(preselected?.slug ?? "");
  const [travelers, setTravelers] = useState(2);
  const [days, setDays] = useState(3);
  const [mode, setMode] = useState("Train");
  const [stay, setStay] = useState("Standard");
  const [food, setFood] = useState("Standard");
  const [roundTrip, setRoundTrip] = useState(true);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [calculated, setCalculated] = useState(false);
  const stateDestinations = DESTINATIONS.filter((item) => item.state === state);
  const destination = DESTINATIONS.find((item) => item.slug === destinationSlug);
  const toggleActivity = (activity: string) => setSelectedActivities((current) => current.includes(activity) ? current.filter((item) => item !== activity) : [...current, activity]);
  const estimate = (tier: string) => {
    if (!destination || !origin || days < 1) return null;
    const modeRate = mode === "Flight" ? 5200 : mode === "Car" ? 2600 : mode === "Bus" ? 1300 : 1900;
    const tierRate = tier === "Premium" ? 2.1 : tier === "Budget" ? .72 : 1;
    const travel = Math.round(modeRate * travelers * (roundTrip ? 2 : 1) * tierRate);
    const stayCost = Math.round(days * travelers * (tier === "Premium" ? 2600 : tier === "Budget" ? 900 : 1500));
    const foodCost = Math.round(days * travelers * (food === "Premium" ? 1100 : food === "Budget" ? 420 : 700));
    const local = Math.round(days * travelers * (tier === "Premium" ? 650 : 350));
    const activities = Math.round(selectedActivities.length * travelers * (tier === "Premium" ? 850 : 350));
    const misc = Math.round((travel + stayCost + foodCost) * .08);
    return { travel, stay: stayCost, food: foodCost, local, activities, misc, total: travel + stayCost + foodCost + local + activities + misc };
  };
  const result = calculated ? estimate(stay) : null;
  return <main className="planner-page"><section className="planner-intro"><span className="eyebrow">PLAN MY TRIP</span><h1>Turn the detour into a<br /><em>plan.</em></h1><p>Build a destination-specific estimate from your starting point, pace and priorities. All amounts are estimates; actual prices vary.</p></section><section className="planner-form"><div className="planner-step"><span>01</span><label>Starting location<input value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="e.g. Delhi" /></label></div><div className="planner-step"><span>02</span><label>Destination state / UT<select value={state} onChange={(event) => { setState(event.target.value); setDestinationSlug(""); }}><option value="">Choose a state</option>{STATES.map((item) => <option key={item}>{item}</option>)}</select></label><label>Exact destination<select value={destinationSlug} onChange={(event) => setDestinationSlug(event.target.value)} disabled={!state}><option value="">Choose a place</option>{stateDestinations.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label></div><div className="planner-step"><span>03</span><label>Travelers<input type="number" min="1" max="12" value={travelers} onChange={(event) => setTravelers(Number(event.target.value))} /></label><label>Days<input type="number" min="1" max="30" value={days} onChange={(event) => setDays(Number(event.target.value))} /></label><label>Travel mode<select value={mode} onChange={(event) => setMode(event.target.value)}>{["Flight", "Train", "Bus", "Car"].map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="planner-step"><span>04</span><label>Stay<select value={stay} onChange={(event) => setStay(event.target.value)}>{["Budget", "Standard", "Premium"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Food<select value={food} onChange={(event) => setFood(event.target.value)}>{["Budget", "Standard", "Premium"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="planner-check"><input type="checkbox" checked={roundTrip} onChange={(event) => setRoundTrip(event.target.checked)} /> Round trip</label></div>{destination && <div className="planner-activities"><span className="eyebrow">{destination.name.toUpperCase()} · ACTIVITIES</span><p>Choose only from activities already recorded for this destination.</p><div>{destination.activities.map((item) => <label key={item}><input type="checkbox" checked={selectedActivities.includes(item)} onChange={() => toggleActivity(item)} />{item}</label>)}</div></div>}<button className="button button-dark planner-calculate" onClick={() => setCalculated(true)}>Calculate my budget <ArrowRight size={16} /></button>{(!destination || !origin || days < 1) && <p className="planner-error">Please select your destination and trip duration to calculate your budget.</p>}</section>{result && <section className="planner-result"><span className="eyebrow">YOUR TRIP PLAN</span><h2>{origin} → {destination?.name}, {destination?.state}</h2><p>{travelers} travelers · {days} days / {Math.max(0, days - 1)} nights · {mode}{roundTrip ? " · Round trip" : " · One way"}</p><div className="planner-tiers">{(["Budget", "Standard", "Premium"] as const).map((level) => { const item = estimate(level)!; return <button key={level} className={stay === level ? "active" : ""} onClick={() => setStay(level)}><strong>{level}</strong><span>₹{item.total.toLocaleString("en-IN")}</span></button>; })}</div><div className="planner-breakdown">{[["Travel", result.travel], ["Stay", result.stay], ["Food", result.food], ["Local transport", result.local], ["Activities", result.activities], ["Miscellaneous", result.misc]].map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>₹{Number(value).toLocaleString("en-IN")}</strong></div>)}</div><div className="planner-total"><span>Estimated total · actual prices may vary</span><strong>₹{result.total.toLocaleString("en-IN")}</strong></div></section>}</main>;
}

function Navigation({ location, favoritesCount, mobileNav, setMobileNav, go }: { location: string; favoritesCount: number; mobileNav: boolean; setMobileNav: (value: boolean) => void; go: (path: string) => void }) {
  return <header className={`topbar ${location === "/" ? "topbar-over-hero" : ""}`}>
    <button className="wordmark" onClick={() => go("/")} aria-label="Go to Hidden India home"><span className="wordmark-symbol">H</span><span><strong>HIDDEN INDIA</strong><small>India, beyond the postcards</small></span></button>
    <nav className={mobileNav ? "nav-links open" : "nav-links"} aria-label="Primary navigation">
      <button onClick={() => go("/explore")}>Explore</button>
      <button onClick={() => go("/categories")}>Collections</button>
      <button onClick={() => go("/states")}>States</button>
      <button onClick={() => go("/plan-my-trip")}>Plan my trip</button>
      <button onClick={() => go("/about")}>Our story</button>
      <button className="nav-save" onClick={() => go("/my-hidden-list")}><Bookmark size={16} /> My list <span>{favoritesCount}</span></button>
    </nav>
    <button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle menu">{mobileNav ? <X size={22} /> : <Menu size={22} />}</button>
  </header>;
}

function HomePage({ go, search, setSearch, surpriseMe, surprise, toggle, favorites }: { go: (path: string) => void; search: string; setSearch: (value: string) => void; surpriseMe: () => void; surprise: Destination | null; toggle: (slug: string) => void; favorites: string[] }) {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.28], [0, 120]);
  const pointerX = useSpring(useMotionValue(0), { stiffness: 70, damping: 22 });
  const pointerY = useSpring(useMotionValue(0), { stiffness: 70, damping: 22 });
  const detailX = useTransform(pointerX, [-0.5, 0.5], [-16, 16]);
  const detailY = useTransform(pointerY, [-0.5, 0.5], [-12, 12]);
  const photoX = useTransform(pointerX, [-0.5, 0.5], [8, -8]);
  const photoY = useTransform(pointerY, [-0.5, 0.5], [5, -5]);
  const featured = DESTINATIONS.slice(0, 6);
  const handleHeroMove = (event: React.MouseEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };
  const resetHeroMove = () => { pointerX.set(0); pointerY.set(0); };
  return <>
    <section className="hero-section" onMouseMove={handleHeroMove} onMouseLeave={resetHeroMove}>
      <motion.div className="hero-photo supplied-hero-fill" style={{ x: photoX, y: heroY, backgroundImage: `url(${SPIRITUAL_IMAGE})` }} />
      <motion.div className="hero-photo supplied-hero-photo" style={{ x: photoX, y: heroY, backgroundImage: `url(${SPIRITUAL_IMAGE})` }} />
      <div className="hero-wash" />
      <div className="hero-grain" /><div className="hero-scanline" />
      <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-orbit orbit-three" />
      <div className="hero-grid" />
      <motion.div className="hero-field-note" style={{ x: detailX, y: detailY }}>
        <span className="field-note-top"><span className="pulse-dot" /> LIVE FIELD NOTE <span>01 / 36</span></span>
        <div className="field-note-coordinates"><strong>15° 04′ N</strong><strong>78° 52′ E</strong></div>
        <div className="field-note-rule" /><p>Somewhere between<br /><em>the known & the next.</em></p>
        <span className="field-note-mark">H / 2026</span>
      </motion.div>
      <motion.div className="hero-vertical-note" style={{ y: detailY }}><span>CURATED FOR THE CURIOUS</span><i /></motion.div>
      <div className="hero-content supplied-hero-content">
        <motion.div className="eyebrow light" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7, ease }}>HIDDEN INDIA / FIELD NOTE 02</motion.div>
        <motion.div className="supplied-hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8, ease }}><strong>Discover India,<br /><em>unknown.</em></strong><span>Go beyond the familiar and find the places that still feel like a secret.</span></motion.div>
        <motion.div className="hero-actions" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52, duration: 0.75, ease }}>
          <button className="button button-accent" onClick={() => go("/explore")}>Explore hidden India <ArrowRight size={17} /></button>
          <button className="button button-glass" onClick={() => go("/states")}>Explore by state</button>
        </motion.div>
        <motion.div className="hero-search" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.64, duration: 0.75, ease }}>
          <Search size={19} /><input aria-label="Search hidden destinations" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && go("/explore")} placeholder="Where do you want to disappear?" /><button onClick={() => go("/explore")}>Search</button>
        </motion.div>
      </div>
      <div className="hero-bottom"><span>36 states & union territories</span><span>70+ quiet places to begin</span><div className="hero-bottom-rule" /><button onClick={() => document.getElementById("first-discover")?.scrollIntoView({ behavior: "smooth" })}>Scroll to discover <ArrowDown size={15} /></button></div>
    </section>

    <section id="first-discover" className="section section-white discover-section">
      <SectionHeading kicker="START ANYWHERE" title="A different kind of map" action="See all destinations" onAction={() => go("/explore")} />
      <div className="destination-rail">{featured.map((destination, index) => <DestinationCard key={destination.id} destination={destination} index={index} go={go} saved={favorites.includes(destination.slug)} toggle={toggle} />)}</div>
    </section>

    <section className="section mood-section">
      <div className="section-intro"><span className="eyebrow">FOLLOW YOUR FEELING</span><h2>What are you looking for?</h2><p>There’s more than one way to find a place. Start with the feeling you want to bring home.</p></div>
      <div className="mood-grid">{MOODS.slice(0, 6).map((mood, index) => <motion.button key={mood.value} className="mood-card" whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }} onClick={() => go(`/explore?mood=${mood.value}`)} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: index * 0.06, duration: 0.45, ease }}><span className="mood-icon"><IconForMood value={mood.value} /></span><strong>{mood.label}</strong><ArrowRight size={16} /></motion.button>)}</div>
    </section>

    <section className="section category-discovery-section"><SectionHeading kicker="START WITH A LANDSCAPE" title="Find your kind of India." action="See all collections" onAction={() => go("/categories")} /><div className="category-card-grid">{CURATED_CATEGORIES.map((category, index) => <CategoryCard key={category.slug} category={category} go={go} index={index} />)}</div></section>

    <section className="feature-split section-dark"><div className="feature-copy"><span className="eyebrow accent">A LITTLE SERENDIPITY</span><h2>Let the road<br /><em>choose you.</em></h2><p>Not every good trip starts with a plan. Let us surface a quiet corner of India for your next story.</p><button className="button button-accent" onClick={surpriseMe}>Surprise me <Sparkles size={17} /></button></div><AnimatePresence mode="wait">{surprise ? <motion.div key={surprise.slug} className="surprise-card" initial={{ opacity: 0, scale: 0.94, x: 35 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.55, ease }}><img src={surprise.image} onError={imageFallback} alt={surprise.name} /><div className="surprise-card-content"><span className="eyebrow accent">YOUR NEXT ESCAPE IS…</span><h3>{surprise.name}</h3><p>{surprise.state} · {surprise.region}</p><button className="text-link" onClick={() => go(`/destinations/${surprise.slug}`)}>Open destination <ArrowRight size={15} /></button></div></motion.div> : <motion.div className="surprise-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Compass size={50} strokeWidth={1} /><p>Tap surprise me.<br />Your map is about to get bigger.</p></motion.div>}</AnimatePresence></section>

    <section className="editorial-section"><div className="editorial-image"><img src={DESTINATIONS[12].image} onError={imageFallback} alt="A quiet Indian landscape" /><span className="image-stamp">FIELD NOTES<br /><strong>01 / 36</strong></span></div><div className="editorial-copy"><span className="eyebrow">WHY HIDDEN INDIA</span><h2>Travel a little<br /><em>more gently.</em></h2><p>India has thousands of extraordinary places beyond the destinations that dominate travel guides. Hidden India helps you discover the quieter side of the country — while keeping communities, landscapes and local stories at the centre.</p><button className="text-link" onClick={() => go("/about")}>Read our story <ArrowRight size={15} /></button></div></section>
  </>;
}

function SpiritualChapter({ go }: { go: (path: string) => void }) {
  const letters = "INDIA".split("");
  const particles = Array.from({ length: 14 });
  return <section className="spiritual-section">
    <div className="spiritual-art" style={{ backgroundImage: `url(${SPIRITUAL_IMAGE})` }} />
    <div className="spiritual-overlay" />
    <div className="spiritual-glow spiritual-glow-one" /><div className="spiritual-glow spiritual-glow-two" />
    <div className="spiritual-particles" aria-hidden="true">{particles.map((_, index) => <i key={index} style={{ ["--particle-x" as string]: `${(index * 31) % 100}%`, ["--particle-y" as string]: `${20 + ((index * 17) % 65)}%`, ["--particle-delay" as string]: `${index * -0.35}s` }} />)}</div>
    <div className="spiritual-content">
      <motion.span className="eyebrow spiritual-eyebrow" initial={{ opacity: 0, letterSpacing: ".45em" }} whileInView={{ opacity: 1, letterSpacing: ".22em" }} viewport={{ once: true }} transition={{ duration: 1.1, ease }}>SPIRITUAL & ANCIENT LAND</motion.span>
      <div className="spiritual-title" aria-label="India">{letters.map((letter, index) => <motion.span key={`${letter}-${index}`} initial={{ opacity: 0, y: 90, rotateX: -75, filter: "blur(14px)" }} whileInView={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.45 }} transition={{ delay: 0.18 + index * 0.13, duration: .9, ease }}>{letter}</motion.span>)}</div>
      <motion.div className="spiritual-caption" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 1, duration: .8, ease }}><span>FIELD NOTE / 02</span><p>Where every horizon holds<br />a story older than the road.</p><button className="button button-glass" onClick={() => go("/explore")}>Find your next story <ArrowRight size={16} /></button></motion.div>
    </div>
    <div className="spiritual-scroll"><span>MOVE THROUGH THE LAND</span><i /></div>
  </section>;
}

function SectionHeading({ kicker, title, action, onAction }: { kicker: string; title: string; action: string; onAction: () => void }) {
  return <div className="section-heading"><div><span className="eyebrow">{kicker}</span><h2>{title}</h2></div><button className="text-link" onClick={onAction}>{action} <ArrowRight size={15} /></button></div>;
}

function DestinationCard({ destination, index, go, saved, toggle }: { destination: Destination; index: number; go: (path: string) => void; saved: boolean; toggle: (slug: string) => void }) {
  return <motion.article className="destination-card" initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: index * 0.06, duration: 0.55, ease }} whileHover={{ y: -7 }}>
    <button className="card-image" onClick={() => go(`/destinations/${destination.slug}`)} aria-label={`Open ${destination.name}`}><img src={destination.image} onError={imageFallback} alt={destination.name} loading="lazy" /><span className="image-overlay" /><span className="card-location"><MapPin size={12} /> {destination.state}</span><span className="card-arrow"><ArrowUpRight /></span></button>
    <div className="card-body"><div className="card-kicker"><span>{destination.region}</span><button className={saved ? "heart-button saved" : "heart-button"} onClick={() => toggle(destination.slug)} aria-label={saved ? `Remove ${destination.name} from saved list` : `Save ${destination.name}`}><Heart size={17} fill={saved ? "currentColor" : "none"} /></button></div><h3>{destination.name}</h3><p>{destination.description}</p><div className="tag-row"><span>{destination.classification === "Famous" ? "Famous" : "Hidden / Lesser-known"}</span>{destination.categories.slice(0, 2).map((category) => <span key={category}>{category}</span>)}</div></div>
  </motion.article>;
}

function CategoryCard({ category, go, index }: { category: CuratedCategory; go: (path: string) => void; index: number }) {
  const destination = DESTINATIONS.find((item) => item.name === category.coverName) ?? DESTINATIONS[index];
  return <motion.button className="category-card" onClick={() => go(`/categories/${category.slug}`)} whileHover={{ y: -7 }} whileTap={{ scale: .98 }} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .05, duration: .45, ease }}><img src={destination.image} onError={imageFallback} alt={category.title} loading="lazy" /><span className="category-card-wash" /><span className="category-card-copy"><small>{category.kicker}</small><strong>{category.title}</strong><span>{category.destinationNames.length} places to explore <ArrowRight size={14} /></span></span></motion.button>;
}

function CategoryDirectoryPage({ go }: { go: (path: string) => void }) {
  return <div className="page-wrap"><PageIntro kicker="THE COLLECTIONS" title="Begin with a feeling, place or plate." copy="Six additive collections for finding more of India without losing the thread of the existing map." /><div className="category-directory-grid">{CURATED_CATEGORIES.map((category, index) => <CategoryCard key={category.slug} category={category} go={go} index={index} />)}</div></div>;
}

function CategoryPage({ go, category }: { go: (path: string) => void; category?: CuratedCategory }) {
  const [state, setState] = useState("All states");
  const [classification, setClassification] = useState("All types");
  if (!category) return <NotFound go={go} />;
  const places = category.destinationNames.map((name) => DESTINATIONS.find((destination) => destination.name === name)).filter(Boolean) as Destination[];
  const filtered = places.filter((place) => (state === "All states" || place.state === state) && (classification === "All types" || place.classification === classification));
  return <div className="page-wrap"><button className="back-link" onClick={() => go("/categories")}><ArrowLeft size={15} /> All collections</button><PageIntro kicker={category.kicker} title={category.title} copy={category.description} /><div className="category-filter-row"><FilterSelect label="State" value={state} onChange={setState} options={["All states", ...Array.from(new Set(places.map((place) => place.state))).sort()]} /><FilterSelect label="Type" value={classification} onChange={setClassification} options={["All types", "Famous", "Lesser-known"]} /></div><div className="results-bar"><span><strong>{filtered.length}</strong> places in this collection</span></div><div className="explore-grid">{filtered.map((place, index) => <DestinationCard key={place.id} destination={place} index={index} go={go} saved={false} toggle={() => undefined} />)}</div></div>;
}

function ExplorePage({ go, search, setSearch, toggle, favorites }: { go: (path: string) => void; search: string; setSearch: (value: string) => void; toggle: (slug: string) => void; favorites: string[] }) {
  const params = new URLSearchParams(window.location.search);
  const [state, setState] = useState(params.get("state") ?? "All states");
  const [region, setRegion] = useState("All regions");
  const [category, setCategory] = useState("All categories");
  const [classification, setClassification] = useState("All types");
  const [mood, setMood] = useState(params.get("mood") ?? "");
  const [filterOpen, setFilterOpen] = useState(false);
  const results = useMemo(() => DESTINATIONS.filter((destination) => {
    const q = search.trim().toLowerCase();
    const searchMatch = !q || [destination.name, destination.state, destination.region, destination.classification, destination.description, ...destination.categories, ...destination.travelStyles].join(" ").toLowerCase().includes(q);
    const stateMatch = state === "All states" || destination.state === state;
    const regionMatch = region === "All regions" || destination.region === region;
    const categoryMatch = category === "All categories" || destination.categories.includes(category);
    const classificationMatch = classification === "All types" || destination.classification === classification;
    const moodMatch = !mood || destination.categories.includes(mood) || destination.travelStyles.includes(mood);
    return searchMatch && stateMatch && regionMatch && categoryMatch && classificationMatch && moodMatch;
  }), [search, state, region, category, classification, mood]);
  const clear = () => { setSearch(""); setState("All states"); setRegion("All regions"); setCategory("All categories"); setClassification("All types"); setMood(""); };
  return <div className="page-wrap"><PageIntro kicker="THE COLLECTION" title="Find your kind of elsewhere." copy="Search by feeling, landscape, state or season. Every place here is a little less expected." /><div className="explore-tools"><div className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try “waterfalls”, “Nagaland” or “slow weekends”" /></div><button className="filter-toggle" onClick={() => setFilterOpen(!filterOpen)}><ChevronDown size={16} /> Filters</button><div className={filterOpen ? "filter-row open" : "filter-row"}><FilterSelect label="State" value={state} onChange={setState} options={["All states", ...STATES]} /><FilterSelect label="Region" value={region} onChange={setRegion} options={["All regions", ...REGIONS]} /><FilterSelect label="Category" value={category} onChange={setCategory} options={["All categories", ...CATEGORIES]} /><FilterSelect label="Type" value={classification} onChange={setClassification} options={["All types", "Famous", "Lesser-known"]} /></div></div><div className="results-bar"><span><strong>{results.length}</strong> places to disappear into</span>{(search || state !== "All states" || region !== "All regions" || category !== "All categories" || classification !== "All types" || mood) && <button onClick={clear}>Clear all <X size={14} /></button>}</div>{results.length ? <motion.div layout className="explore-grid">{results.map((destination, index) => <DestinationCard key={destination.id} destination={destination} index={index % 8} go={go} saved={favorites.includes(destination.slug)} toggle={toggle} />)}</motion.div> : <EmptyState onClear={clear} />}</div>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="filter-select"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return <div className="empty-state"><Compass size={36} /><h3>Nothing on this trail yet.</h3><p>Try widening your search, or let the map surprise you.</p><button className="button button-dark" onClick={onClear}>Reset filters</button></div>;
}

function StatesPage({ go }: { go: (path: string) => void }) {
  const [activeRegion, setActiveRegion] = useState("All India");
  const visibleStates = activeRegion === "All India" ? STATES : STATES.filter((state) => DESTINATIONS.find((destination) => destination.state === state)?.region === activeRegion);
  return <div className="page-wrap states-page"><PageIntro kicker="EXPLORE INDIA STATE BY STATE" title="The country, in quieter chapters." copy="Every state and Union Territory holds a different kind of beautiful. Pick a place to begin." /><div className="region-tabs"><button className={activeRegion === "All India" ? "active" : ""} onClick={() => setActiveRegion("All India")}>All India</button>{REGIONS.map((region) => <button className={activeRegion === region ? "active" : ""} key={region} onClick={() => setActiveRegion(region)}>{region.replace(" India", "")}</button>)}</div><div className="state-grid">{visibleStates.map((state, index) => { const destinations = DESTINATIONS.filter((destination) => destination.state === state); return <motion.button key={state} className="state-card" onClick={() => go(`/states/${state.toLowerCase().replace(/[^a-z]+/g, "-")}`)} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (index % 8) * 0.035, duration: 0.42, ease }} whileHover={{ y: -5 }}><img src={destinations[0].image} onError={imageFallback} alt="" loading="lazy" /><span className="state-card-wash" /><span className="state-card-text"><small>{destinations.length} hidden escapes</small><strong>{state}</strong><span>Open field notes <ArrowUpRight size={14} /></span></span></motion.button>; })}</div></div>;
}

function StatePage({ go, stateName, destinations, toggle, favorites }: { go: (path: string) => void; stateName: string; destinations: Destination[]; toggle: (slug: string) => void; favorites: string[] }) {
  if (!destinations.length) return <NotFound go={go} />;
  return <div className="page-wrap state-detail"><button className="back-link" onClick={() => go("/states")}><ArrowLeft size={15} /> All states</button><div className="state-hero"><div><span className="eyebrow">FIELD NOTES · {destinations[0].region.toUpperCase()}</span><h1>{destinations[0].state}</h1><p>A softer route through a familiar state — built around landscapes, people and places that invite you to stay a little longer.</p></div><div className="state-hero-stamp">{destinations.length}<small>quiet places<br />to begin</small></div></div><div className="section-heading"><div><span className="eyebrow">THE SHORTLIST</span><h2>Start with these.</h2></div></div><div className="explore-grid">{destinations.map((destination, index) => <DestinationCard key={destination.id} destination={destination} index={index} go={go} saved={favorites.includes(destination.slug)} toggle={toggle} />)}</div></div>;
}

function ActivityPage({ go, destination, activity }: { go: (path: string) => void; destination?: Destination; activity?: ActivityDetail }) {
  if (!destination || !activity) return <NotFound go={go} />;
  return <div className="activity-detail-page"><section className="activity-detail-hero" style={{ backgroundImage: `url(${activity.images[0]})` }}><div className="detail-hero-wash" /><div className="detail-hero-content"><button className="back-link light-back" onClick={() => go(`/destinations/${destination.slug}`)}><ArrowLeft size={15} /> Back to {destination.name}</button><span className="eyebrow light">{destination.name} · {activity.label}</span><h1>{activity.title}</h1><p>{activity.description}</p></div></section><div className="activity-detail-layout"><article><span className="eyebrow">THE EXPERIENCE</span><h2>{activity.title}, in the context of {destination.name}.</h2><p className="activity-lede">{activity.detail}</p><div className="activity-detail-facts"><Fact icon={<Sun />} label="Best time" value={activity.bestTime} /><Fact icon={<MapPin />} label="Why here" value={activity.why} /></div><section className="activity-copy-block"><span className="eyebrow">TRAVEL NOTES</span><h3>Go with care</h3><ul>{activity.tips.map((tip) => <li key={tip}><Check size={15} />{tip}</li>)}</ul></section>{activity.slug === "food" && <LocalFoodSearch destination={destination} />}</article><aside className="activity-detail-aside"><img src={activity.images[1]} onError={imageFallback} alt={`${activity.title} around ${destination.name}`} /><div><span className="eyebrow">A DIFFERENT WAY IN</span><p>{destination.whyHidden}</p></div></aside></div></div>;
}

function LocalFoodSearch({ destination }: { destination: Destination }) {
  const queries = ["regional food and local dishes", "markets and food shops", "cafes and bakeries", "street food"];
  return <section className="activity-food-search"><span className="eyebrow accent">LIVE, DESTINATION-SPECIFIC SEARCH</span><h3>Find the food that is current now.</h3><p>These links open live Google Maps searches for {destination.name}, {destination.state}. Results, names, ratings, prices and hours come directly from the current map listings.</p><div>{queries.map((query) => <a key={query} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${query} near ${destination.name}, ${destination.state}`)}`} target="_blank" rel="noreferrer">{query}<ExternalLink size={14} /></a>)}</div></section>;
}

function DestinationPage({ go, destination, toggle, favorites }: { go: (path: string) => void; destination?: Destination; toggle: (slug: string) => void; favorites: string[] }) {
  const [gallery, setGallery] = useState(0);
  if (!destination) return <NotFound go={go} />;
  const saved = favorites.includes(destination.slug);
  const activities = getDestinationActivities(destination);
  return <div className="detail-page"><section className="detail-hero" style={{ backgroundImage: `url(${destination.gallery[gallery]})` }}><div className="detail-hero-wash" /><div className="detail-hero-content"><button className="back-link light-back" onClick={() => go("/explore")}><ArrowLeft size={15} /> Back to explore</button><span className="eyebrow light">{destination.state} · {destination.region} · {destination.classification}</span><h1>{destination.name}</h1><p>{destination.description}</p><div className="detail-tags">{destination.categories.map((category) => <span key={category}>{category}</span>)}</div></div><div className="gallery-dots">{destination.gallery.map((_, index) => <button key={index} className={gallery === index ? "active" : ""} onClick={() => setGallery(index)} aria-label={`View image ${index + 1}`} />)}</div></section><div className="detail-layout"><article className="detail-main"><div className="detail-intro"><span className="eyebrow">WHY THIS PLACE</span><h2>Somewhere worth<br /><em>taking the long way to.</em></h2><p>{destination.whyHidden}</p></div><div className="detail-facts"><Fact icon={<Sun />} label="Best time" value={destination.bestTime} /><Fact icon={<MapPin />} label="Getting there" value={destination.location} /><Fact icon={<Mountain />} label="The pace" value={destination.difficulty} /></div><section className="detail-section"><span className="eyebrow">GO SLOWLY</span><h3>Things to do here</h3><div className="activity-grid">{activities.map((item, index) => <motion.button key={item.slug} className="activity-card" onClick={() => go(`/destinations/${destination.slug}/activities/${item.slug}`)} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.04, duration: 0.35, ease }}><img src={item.images[0]} onError={imageFallback} alt="" loading="lazy" /><span className="activity-card-wash" /><span className="activity-card-copy"><small>{item.label}</small><strong>{item.title}</strong><span>{item.description}</span><ArrowUpRight size={16} /></span></motion.button>)}</div><DestinationLocalInfo destination={destination} /></section><section className="detail-section responsible"><span className="eyebrow">LEAVE A LIGHTER TRACE</span><h3>Travel responsibly</h3><p>Respect local customs, carry out what you carry in, choose local hosts and guides, and follow access rules around wildlife and protected landscapes.</p><div className="responsible-list"><span><Check size={15} /> Support local livelihoods</span><span><Check size={15} /> Keep wild places wild</span><span><Check size={15} /> Ask before you photograph</span></div></section><DestinationMap destination={destination} /></article><aside className="detail-aside"><div className="save-panel"><button className={saved ? "button button-dark saved-wide" : "button button-dark saved-wide"} onClick={() => toggle(destination.slug)}>{saved ? <Check size={17} /> : <Bookmark size={17} />} {saved ? "Saved to my list" : "Save to my list"}</button><p>Keep the places you love close. Your list stays with you on this device.</p></div><div className="coordinates"><span className="eyebrow">ON THE MAP</span><div className="map-art"><div className="map-grid" /><span className="map-dot" /><span className="map-label">{destination.name}</span></div><small>{destination.latitude.toFixed(2)}° N · {destination.longitude.toFixed(2)}° E</small></div><div className="aside-note"><Sparkles size={17} /><p>Hidden India is an editorial starting point. Always check seasonal access, permits and local guidance before you go.</p></div></aside></div></div>;
}

function DestinationLocalInfo({ destination }: { destination: Destination }) {
  const encoded = encodeURIComponent(`${destination.name}, ${destination.state}`);
  const foodUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`restaurants cafes local food near ${destination.name}, ${destination.state}`)}`;
  const stayUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`hotels homestays resorts near ${destination.name}, ${destination.state}`)}`;
  const guide = FOOD_GUIDES.find((item) => item.state === destination.state || item.city.toLowerCase().includes(destination.name.toLowerCase()));
  return <section className="nearby-discovery"><div className="nearby-heading"><span className="eyebrow accent">LOCAL, CURRENT, DESTINATION-AWARE</span><h3>What’s nearby</h3><p>Live listings change. Use these exact-place searches for current results instead of invented names, ratings or prices.</p></div><div className="nearby-grid"><div className="nearby-panel"><span className="nearby-icon">✦</span><small>LOCAL FOOD</small><h4>{guide ? `${guide.dish} around ${guide.city}` : `Food near ${destination.name}`}</h4><p>{guide?.note ?? "I don’t have verified live information for that yet. Please use the nearby search on this destination page for current results."}</p><a className="button button-accent" href={foodUrl} target="_blank" rel="noreferrer">View restaurants on Google Maps <ExternalLink size={14} /></a></div><div className="nearby-panel"><span className="nearby-icon">⌂</span><small>WHERE TO STAY NEARBY</small><h4>Hotels, homestays & quiet stays</h4><p>I don’t have verified live accommodation information for this exact destination yet. Search current properties, distances, amenities and availability on Google Maps.</p><a className="button button-dark" href={stayUrl} target="_blank" rel="noreferrer">View hotels on Google Maps <ExternalLink size={14} /></a></div></div><span className="nearby-query-note">Search context: {decodeURIComponent(encoded)}</span></section>;
}

function DestinationMap({ destination }: { destination: Destination }) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "terrain">("roadmap");
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
  useEffect(() => { mapRef.current?.setMapTypeId(mapType); }, [mapType]);
  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    const marker = new google.maps.Marker({ map, position: { lat: destination.latitude, lng: destination.longitude }, title: destination.name });
    const info = new google.maps.InfoWindow({ content: `<div style="padding:6px 8px;font-family:Arial,sans-serif"><strong>${destination.name}</strong><br/><span>${destination.state}</span></div>` });
    marker.addListener("click", () => info.open({ map, anchor: marker }));
  };
  return <section className="real-map-section"><div className="real-map-heading"><div><span className="eyebrow accent">FIND YOUR WAY TO THE UNSEEN</span><h3>See it in the real world.</h3><p>Explore the actual location, then take the next step when you’re ready.</p></div><div className="map-switcher">{(["roadmap", "satellite", "terrain"] as const).map((type) => <button key={type} className={mapType === type ? "active" : ""} onClick={() => setMapType(type)}>{type}</button>)}</div></div><div className="real-map-shell"><MapView initialCenter={{ lat: destination.latitude, lng: destination.longitude }} initialZoom={11} onMapReady={handleMapReady} className="real-map" /><div className="real-map-card"><span className="eyebrow accent">{destination.state}</span><strong>{destination.name}</strong><small>{destination.latitude.toFixed(4)}° N · {destination.longitude.toFixed(4)}° E</small><a href={directionsUrl} target="_blank" rel="noreferrer" className="button button-accent">Get directions <ExternalLink size={14} /></a></div></div></section>;
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="fact"><span className="fact-icon">{icon}</span><small>{label}</small><strong>{value}</strong></div>; }

function SavedPage({ go, favorites, toggle }: { go: (path: string) => void; favorites: string[]; toggle: (slug: string) => void }) {
  const saved = DESTINATIONS.filter((destination) => favorites.includes(destination.slug));
  return <div className="page-wrap saved-page"><PageIntro kicker="MY HIDDEN LIST" title="Places to come back to." copy="A private little map of the escapes that made you stop scrolling." />{saved.length ? <div className="explore-grid">{saved.map((destination, index) => <DestinationCard key={destination.id} destination={destination} index={index} go={go} saved toggle={toggle} />)}</div> : <div className="saved-empty"><Bookmark size={42} strokeWidth={1.2} /><h3>Your list is still wide open.</h3><p>Save a destination when something makes you want to pack a bag.</p><button className="button button-dark" onClick={() => go("/explore")}>Start exploring <ArrowRight size={16} /></button></div>}</div>;
}

function AboutPage({ go }: { go: (path: string) => void }) { return <div className="page-wrap about-page"><PageIntro kicker="OUR STORY" title="The places between the lines." copy="Hidden India is a love letter to the country’s quieter corners — and a practical invitation to explore them with care." /><div className="about-grid"><div className="about-image"><img src={DESTINATIONS[20].image} onError={imageFallback} alt="A peaceful landscape in India" /></div><div className="about-copy"><span className="eyebrow">A DIFFERENT TRAVEL GUIDE</span><h2>Not more places.<br /><em>More meaningful ones.</em></h2><p>India has thousands of extraordinary places beyond the destinations that dominate travel guides. Hidden India exists to make those places easier to find without turning them into the next crowded checklist.</p><p>We favour local stories over rankings, a slower pace over packed itineraries, and responsible curiosity over collecting views. Start wherever you like. Stay open to being surprised.</p><button className="text-link" onClick={() => go("/explore")}>Find your first detour <ArrowRight size={15} /></button></div></div><div className="principles"><div><span>01</span><h3>Look closer</h3><p>There is always another road, trail or village worth noticing.</p></div><div><span>02</span><h3>Go gently</h3><p>Travel should leave value behind, not just footprints.</p></div><div><span>03</span><h3>Stay curious</h3><p>The best stories tend to begin outside the obvious route.</p></div></div></div>; }

function PageIntro({ kicker, title, copy }: { kicker: string; title: string; copy: string }) { return <div className="page-intro"><span className="eyebrow">{kicker}</span><h1>{title}</h1><p>{copy}</p></div>; }
function NotFound({ go }: { go: (path: string) => void }) { return <div className="not-found"><Compass size={48} strokeWidth={1} /><span className="eyebrow">OFF THE MAP</span><h1>This trail ends here.</h1><p>Let’s take you somewhere more interesting.</p><button className="button button-dark" onClick={() => go("/explore")}>Back to explore <ArrowRight size={16} /></button></div>; }
function Footer({ go }: { go: (path: string) => void }) { return <footer className="footer"><div className="footer-brand"><button className="wordmark footer-wordmark" onClick={() => go("/")}><span className="wordmark-symbol">H</span><span><strong>HIDDEN INDIA</strong><small>India, beyond the postcards</small></span></button><p>A field guide to the India you haven’t seen yet.</p></div><div className="footer-links"><button onClick={() => go("/explore")}>Explore</button><button onClick={() => go("/states")}>States</button><button onClick={() => go("/about")}>Our story</button><button onClick={() => go("/my-hidden-list")}>My list</button></div><div className="footer-end">© 2026 Hidden India<br /><span>Travel with care.</span></div></footer>; }

export default App;
