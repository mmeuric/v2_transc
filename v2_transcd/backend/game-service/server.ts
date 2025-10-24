import Fastify from "fastify";
import dotenv from "dotenv";
import path from "path";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";

dotenv.config();

const fastify = Fastify({
  logger: {
    level: 'info',
  },
  ajv: {
    customOptions: { coerceTypes: false }
  }
});

// -----------------------------
// CORS
// -----------------------------
fastify.register(fastifyCors, {
  origin: ["http://localhost:3000"], // le frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

// Secret pour les access tokens
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || "supersecret",
  sign: { expiresIn: "15m" } // access token 15 minutes
});

fastify.register(fastifyCookie);

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Endpoint de test
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'game-service' }
})

// NEW: instrumentation Prometheus
import { collectDefaultMetrics, Counter, Histogram, register } from "prom-client";

// NEW: collecte des métriques système (CPU, mémoire, GC, etc.)
collectDefaultMetrics({ prefix: "ft_" });

// NEW: compteur de requêtes HTTP
const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Nombre total de requêtes HTTP",
  labelNames: ["method", "route", "status_code"] as const,
});

// NEW: histogramme de latence HTTP
const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Durée des requêtes HTTP en secondes",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2] // NEW: buckets ajoutés
});

// NEW: enregistrer le début de chaque requête
fastify.addHook("onRequest", async (req, reply) => {
  // @ts-ignore
  reply._start = process.hrtime.bigint();
});

// NEW: calculer la durée et enregistrer la requête
fastify.addHook("onResponse", async (req, reply) => {
  const route = req.url;
  const method = req.method;
  const status = reply.statusCode;
  // @ts-ignore
  const start = reply._start;
  if (start) {
    const delta = Number(process.hrtime.bigint() - start) / 1e9;
    httpRequestDuration.labels(method, route, String(status)).observe(delta);
  }
  httpRequestsTotal.labels(method, route, String(status)).inc();
});

// NEW: endpoint /metrics pour Prometheus
fastify.get("/metrics", async (_req, reply) => {
  reply.header("Content-Type", register.contentType);
  return register.metrics();
});

// -----------------------------
// Lancer le serveur
// -----------------------------
async function start() {
  
  // route for global stats
  const module1 = await import("./src/global_stats/v1/routes");
  fastify.register(module1.default, { prefix: "/v1/global_stats" });

  // route for register new 1v1
  const module2 = await import("./src/matchs_history/v1/routes");
  fastify.register(module2.default, { prefix: "/v1/matchs_history" });

  fastify.listen({ port: 4002, host: "0.0.0.0" }).then(() => {
    console.log(`🚀 API running at http://localhost:4002`);
  });
}

start().catch(console.error);

/*
curl -X POST http://localhost:4002/v1/matchs_history/new_match \
  -H "Content-Type: application/json" \
  -d '{
    "game_type": "1vs1",
    "team_1_player_user_id_1": 4,           
    "team_2_player_user_id_2": 5,
    "started_at": "2025-09-16T10:00:00Z",
    "ended_at": "2025-09-16T11:00:00Z",
    "score_team_1": 5,
    "score_team_2": 2,
    "winner_user_id_1": 4,
  }'
*/