import Fastify from "fastify";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import axios from "axios";
import { DeployBody } from '../interfaces';

dotenv.config();

const fastify = Fastify({
  logger: true,
  ajv: {
    customOptions: { coerceTypes: false }
  }
});

// Charger ABI + bytecode du contrat compilé
const contractPath = path.join(__dirname, "../../../../artifacts/contracts/Tournament.sol/Tournament.json");
const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const abi = contractJson.abi;
const bytecode = contractJson.bytecode;

// Connexion à la blockchain
const provider = new ethers.JsonRpcProvider(process.env.FUJI_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// Instance de contrat (sera définie après déploiement)
let contract: ethers.BaseContract | null = null;

// Pour éviter les erreurs BigInt → JSON
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// -----------------------------
// Fonction: Déployer un tournoi
// -----------------------------
async function deployTournament(body: DeployBody) {
  const { nicknames, ranks, points, name } = body;

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployed = await factory.deploy(body.id, nicknames, ranks, points);
  await deployed.waitForDeployment();

  const contractAddress = await deployed.getAddress();

  const newTournament = {
    nom: name || `Tournament-${Date.now()}`,
    address: contractAddress,
    network: "fuji",
    date: new Date().toISOString(),
  };

  return { date: newTournament.date, address: newTournament.address };
}

// -----------------------------
// Fonction: Récupérer joueurs
// -----------------------------
async function getPlayersByTournament(id: string) {
  const response = await axios.get(`http://api_bdd:3020/v1/tournamentes/${Number(id)}`);
  const tournament = response.data;

  if (!tournament) {
    throw new Error("Tournament not found");
  }

  const contract = new ethers.Contract(tournament.contract_id, abi, provider);
  const players = await contract.getAllPlayers();

  return players.map((p: any) => ({
    nickname: p.nickname,
    rank: p.rank.toString(),
    points: p.points.toString(),
  }));
}

// -----------------------------
// Fonction: Récupérer tout les tournois
// -----------------------------
async function getAllTournament(){
  // 👉 Récupérer tous les tournois depuis l'API DB
  const response = await axios.get("http://api_bdd:3020/v1/tournamentes/all");
  const tournaments = response.data;

  // 👉 Formater la réponse
  return tournaments.map((p: any) => ({
    id: p.id.toString(),
    nom: p.tournament_name.toString(),
    date: p.ended_at.toString(),
  }));
}

export const tournament_model = {
  deployTournament,
  getPlayersByTournament,
  getAllTournament
};