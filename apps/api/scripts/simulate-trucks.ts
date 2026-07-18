import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  path: '/socket.io',
});

socket.on('connect', () => {
  console.log('Simulateur de camion connecté au WebSocket');

  // Camion 1 partant de Douala Centre vers Bonabéri
  let lat = 4.0511;
  let lng = 9.7679;
  const entityId = 'TRUCK-' + Math.floor(Math.random() * 10000);

  setInterval(() => {
    // Déplacement aléatoire vers le nord-ouest
    lat += (Math.random() * 0.001) + 0.0001;
    lng -= (Math.random() * 0.001) + 0.0001;

    socket.emit('update_my_location', { lat, lng });
    console.log(`Position envoyée pour ${entityId} : [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
  }, 2000); // Mise à jour toutes les 2 secondes
});

socket.on('disconnect', () => {
  console.log('Déconnecté');
});
