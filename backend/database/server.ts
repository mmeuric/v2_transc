import Fastify from "fastify";
import { db } from "./db";
import path from 'path';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { userApiDoc } from './doc';
import multipart from '@fastify/multipart';

console.log("Api_db v2025.10.15");

//----------------
//  Fastify init  
//----------------
const fastify = Fastify({
  logger: {
    level: 'warn', // or 'warn' for even less, or 'error' for only errors
  },
  ajv: {        // needed for parsing and schemas for validations will stop the behavior of payloads 741="741"
    customOptions: { coerceTypes: false }
  }
});

fastify.register(multipart);

// NEW: instrumentation Prometheus
import { collectDefaultMetrics, Counter, Histogram, register } from "prom-client";

// NEW: collecte de métriques système
collectDefaultMetrics({ prefix: "ft_" });

// NEW: compteur HTTP
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
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
});

// NEW: hook début requêtes
fastify.addHook("onRequest", async (req, reply) => {
  // @ts-ignore
  reply._start = process.hrtime.bigint();
});

// NEW: hook fin requêtes
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

// NEW: endpoint de test health
fastify.get("/health", async () => {
  return { status: "ok", service: "database-service" };
});

// NEW: endpoint metrics Prometheus
fastify.get("/metrics", async (_req, reply) => {
  reply.header("Content-Type", register.contentType);
  return register.metrics();
});

//----------------
//  Swagger init  
//----------------
fastify.register(swagger, {
  mode: 'static',
  specification: {
    document: userApiDoc
  }
});

fastify.register(swaggerUi, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  staticCSP: true,
  transformSpecification: (swaggerObject, request, reply) => swaggerObject,
  transformSpecificationClone: true
});

//---------------------
//  API endpoints init  
//---------------------
async function start() {
  const db_conection = await db.connectDB();
  await db.initSchema(db_conection);

  //Users features endpoints. V1 real endpoints V2 just for exemple.
  fastify.register(await import(path.resolve(__dirname, './src/users/v1/routes')).then(m => m.default), { prefix: '/v1/users', db: db_conection });
  fastify.register(await import(path.resolve(__dirname, './src/users/v2/routes')).then(m => m.default), { prefix: '/v2/users', db: db_conection });

  // Users images
  fastify.register(await import(path.resolve(__dirname, './src/users_imgs/index.ts')).then(m => m.default), { prefix: '/v1/users_img', db: db_conection });
 
  // Game history feature:
  fastify.register(await import(path.resolve(__dirname, './src/games_history/v1/routes')).then(m => m.default), { prefix: '/v1/games_history', db: db_conection });
  
  // Tournaments
  fastify.register(await import(path.resolve(__dirname, './src/tournamentes/v1/routes')).then(m => m.default), { prefix: '/v1/tournamentes', db: db_conection });

  // Friendships
  fastify.register(await import(path.resolve(__dirname, './src/friendships/index')).then(m => m.default), { prefix: '/v1/friendships', db: db_conection });

  // stats
  fastify.register(await import(path.resolve(__dirname, './src/gh_stats/index.ts')).then(m => m.default), { prefix: '/v1/stats', db: db_conection });
  
  // users_online_status               DB__API_DB/src/users_online_status
  fastify.register(await import(path.resolve(__dirname, './src/users_online_status/index.ts')).then(m => m.default), { prefix: '/v1/user_online_status', db: db_conection });

  //DB__API_DB\src\gh_stats\index.ts
  await fastify.listen({ port: 3020, host: "0.0.0.0" });
  console.log("🚀 Serveur démarré sur http://localhost:3020");
}

start().catch(console.error);
