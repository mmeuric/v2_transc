#!/bin/sh
# frontend/scripts/frontend-entrypoint.sh

echo "Waiting for gateway:4001 ..."
while ! nc -z gateway 4001; do
  sleep 1
done
echo "Gateway is up!"

# Démarrer Nginx en arrière-plan
nginx

# Boucle jusqu'à ce que Nginx réponde
echo "Waiting for Nginx to be ready on port 80 ..."
until curl -s http://localhost/ >/dev/null; do
  sleep 1
done
echo "Nginx is ready, container healthy."
# Ne pas quitter le script pour Docker, garder le container actif
tail -f /dev/null
