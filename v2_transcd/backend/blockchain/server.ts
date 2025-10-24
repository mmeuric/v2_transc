import Fastify from "fastify";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import axios from "axios";
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
const PORT = process.env.PORT || 3021;

// NEW: instrumentation Prometheus
import { collectDefaultMetrics, Counter, Histogram, register } from "prom-client";

// NEW: collecte des métriques système
collectDefaultMetrics({ prefix: "ft_" });

// NEW: total de requêtes HTTP
const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Nombre total de requêtes HTTP",
  labelNames: ["method", "route", "status_code"] as const,
});

// NEW: latence HTTP histogramme
const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Durée des requêtes HTTP en secondes",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2]
});

// NEW: hook début des requêtes
fastify.addHook("onRequest", async (req, reply) => {
  // @ts-ignore
  reply._start = process.hrtime.bigint();
});

// NEW: hook fin des requêtes
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
  sign: { expiresIn: "15m" }, // access token 15 minutes
  cookie: {
    cookieName: "session_token",
    signed: false,
  },
});

fastify.register(fastifyCookie);

// Endpoint de test
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'auth-service' }
})

// NEW: endpoint Prometheus
fastify.get("/metrics", async (_req, reply) => {
  reply.header("Content-Type", register.contentType);
  return register.metrics();
});

// -----------------------------
// Lancer le serveur
// -----------------------------
async function start() {
  
  fastify.register(await import(path.resolve(__dirname, 'src/users/v1/routes.js')).then(m => m.default), { prefix: '/v1/users' });

  fastify.listen({ port: Number(PORT), host: "0.0.0.0" }).then(() => {
    console.log(`🚀 API running at http://localhost:${PORT}`);
  });
}

start().catch(console.error);