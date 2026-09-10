// server/index.ts
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "64kb" }));
  app.post("/api/hina", async (req, res) => {
    const { messages, destination, catalog } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "A conversation is required." });
    }
    const forgeUrl = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
    const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;
    if (!forgeUrl || !forgeKey) {
      return res.status(503).json({ error: "Live HINA is not configured." });
    }
    const context = destination ? `The user is currently viewing ${destination.name}, ${destination.state}. Catalog notes: ${destination.description}. Best time in the catalog: ${destination.bestTime}. Activities in the catalog: ${(destination.activities || []).join(", ")}.` : "No destination page is currently active.";
    const catalogText = Array.isArray(catalog) ? `
Hidden India destination catalog (use only these destination names for recommendations):
${catalog.map((item) => `- ${item.name} \u2014 ${item.state}; ${item.description}; best time: ${item.bestTime}; activities: ${(item.activities || []).join(", ")}`).join("\n")}` : "";
    const system = `You are HINA, the warm and practical travel assistant for Hidden India. ${context}
Use the supplied conversation history and Hidden India context. Answer naturally in concise Markdown. Recommend only destinations and activities supported by the supplied catalog. Ask a short follow-up question when the request lacks destination, duration, season, budget or travel style.
Never invent restaurant names, hotel names, addresses, ratings, prices, opening hours, availability, weather, transport details, coordinates or booking information. For food, cafes, restaurants, hotels or stays, say exactly: \u201CI don\u2019t have verified live information for that yet. Please use the nearby search on this destination page for current results.\u201D Then direct the user to the destination page's live Google Maps search. Clearly label estimates and uncertainty. Do not claim to have searched live data unless a live tool result is provided.${catalogText}`;
    try {
      const response = await fetch(`${forgeUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${forgeKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-5-mini", messages: [{ role: "system", content: system }, ...messages.slice(-14)], max_completion_tokens: 900 })
      });
      if (!response.ok) return res.status(502).json({ error: "The live assistant is temporarily unavailable." });
      const payload = await response.json();
      const content = payload.choices?.[0]?.message?.content;
      if (!content) return res.status(502).json({ error: "The assistant returned an empty response." });
      return res.json({ content });
    } catch (error) {
      console.error("HINA request failed", error);
      return res.status(502).json({ error: "The live assistant is temporarily unavailable." });
    }
  });
  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
  const port = process.env.PORT || 3e3;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
