const MARGIN = 8;
const MV_PADDLE = 300;
let lastDecisionTime = 0;
let lastFrameTime = 0;
let targetY = 0;
let isInitialized = false;
export function handleAI(game, lvlAI, currentTime) {
    if (lvlAI === 1)
        AIlvl1(game, currentTime);
    if (lvlAI === 2)
        AIlvl2(game, currentTime);
    if (lvlAI === 3)
        AIlvl3(game, currentTime);
}
/**========================================================================
 *                           Easy
 *========================================================================**/
function AIlvl1(game, currentTime) {
    if (!isInitialized) {
        lastFrameTime = currentTime;
        targetY = game.ballY;
        isInitialized = true;
    }
    const REACTION_MS = 250 + Math.random() * 150; // temps de réaction variable
    const SPEED_PX_PER_SEC = MV_PADDLE; // vitesse un peu variable
    const DEAD_ZONE = 6; // plus de tolérance
    if (currentTime - lastDecisionTime >= REACTION_MS) {
        lastDecisionTime = currentTime;
        if (Math.random() < 0.6) {
            // suit la balle (mais pas précisément)
            targetY = game.ballY + (Math.random() * 40 - 20); // erreur volontaire
        }
        else {
            // bouge vers une zone aléatoire
            targetY = Math.random() * (game.height - game.paddleHeight - 2 * MARGIN) +
                MARGIN + game.paddleHeight / 2;
        }
    }
    const dt = Math.max(0, (currentTime - lastFrameTime) / 1000);
    lastFrameTime = currentTime;
    const paddleCenter = game.rightPaddleY + game.paddleHeight / 2;
    const diff = targetY - paddleCenter;
    if (Math.abs(diff) <= DEAD_ZONE)
        return;
    // parfois elle fait un petit mouvement dans le mauvais sens
    let move = Math.sign(diff) * Math.min(Math.abs(diff), SPEED_PX_PER_SEC * dt);
    if (Math.random() < 0.05)
        move *= -1;
    game.rightPaddleY += move;
    game.rightPaddleY = Math.max(MARGIN, Math.min(game.rightPaddleY, game.height - game.paddleHeight - MARGIN));
}
/**========================================================================
 *                           Medium
 *========================================================================**/
function AIlvl2(game, currentTime) {
    if (!isInitialized) {
        lastFrameTime = currentTime;
        targetY = game.ballY;
        isInitialized = true;
    }
    const REACTION_MS = 100;
    const SPEED_PX_PER_SEC = MV_PADDLE;
    const DEAD_ZONE = 4;
    if (currentTime - lastDecisionTime >= REACTION_MS) {
        lastDecisionTime = currentTime;
        // suit la balle directement (pas de prédiction)
        if (Math.random() < 0.85) {
            targetY = game.ballY;
        }
        else {
            // de temps en temps, prend une cible "imprécise"
            targetY = game.ballY + (Math.random() * 60 - 30);
        }
    }
    const dt = Math.max(0, (currentTime - lastFrameTime) / 1000);
    lastFrameTime = currentTime;
    const paddleCenter = game.rightPaddleY + game.paddleHeight / 2;
    const diff = targetY - paddleCenter;
    if (Math.abs(diff) <= DEAD_ZONE)
        return;
    // mouvement fluide, pas instantané
    const move = Math.sign(diff) * Math.min(Math.abs(diff), SPEED_PX_PER_SEC * dt);
    game.rightPaddleY += move;
    // empêche la raquette de sortir de l’écran
    game.rightPaddleY = Math.max(MARGIN, Math.min(game.rightPaddleY, game.height - game.paddleHeight - MARGIN));
}
/**========================================================================
 *                           Hard
 *========================================================================**/
function AIlvl3(game, currentTime) {
    if (!isInitialized) {
        lastFrameTime = currentTime;
        targetY = game.ballY;
        isInitialized = true;
    }
    // ⚖️ Ajuste les capacités de l’IA selon la vitesse de la balle
    let REACTION_MS = 60;
    const SPEED_PX_PER_SEC = MV_PADDLE;
    // let SPEED_PX_PER_SEC = 400;
    // if (game.ballSpeed > 400) {          // balle très rapide
    //     REACTION_MS = 220;              // prend plus de temps à réagir
    //     SPEED_PX_PER_SEC = 180;         // très lente pour suivre
    // } else if (game.ballSpeed > 250) {   // balle moyenne
    //     REACTION_MS = 160;              
    //     SPEED_PX_PER_SEC = 240;         // moins rapide
    // } else {                             // balle lente
    //     REACTION_MS = 100;              
    //     SPEED_PX_PER_SEC = 280;         
    // }
    if (currentTime - lastDecisionTime >= REACTION_MS) {
        lastDecisionTime = currentTime;
        // prédiction avec rebonds
        let predictedY = game.ballY;
        let ballX = game.ballX;
        let ballY = game.ballY;
        let dx = game.ballDX;
        let dy = Math.sin(game.ballAngle);
        while (ballX < game.width - game.paddleWidth - MARGIN) {
            ballX += dx * game.ballSpeed * 0.05;
            ballY += dy * game.ballSpeed * 0.05;
            if (ballY <= 0 || ballY >= game.height) {
                dy *= -1;
            }
        }
        predictedY = ballY;
        targetY = predictedY + (Math.random() * 20 - 10); // petite marge d’erreur
    }
    const dt = Math.max(0, (currentTime - lastFrameTime) / 1000);
    lastFrameTime = currentTime;
    const paddleCenter = game.rightPaddleY + game.paddleHeight / 2;
    const diff = targetY - paddleCenter;
    const easing = 0.25;
    const smoothDiff = diff * easing;
    const move = Math.sign(smoothDiff) * Math.min(Math.abs(smoothDiff), SPEED_PX_PER_SEC * dt);
    game.rightPaddleY += move;
    game.rightPaddleY = Math.max(MARGIN, Math.min(game.rightPaddleY, game.height - game.paddleHeight - MARGIN));
}
