import { initMap } from './initMap';
// import { showRegionsList } from './regions.js';
import firebase from './firebase.js';
// import { connexionToFirebase } from './firebase.js';
import { getFirestore } from 'firebase/firestore';
import { addRegionsToFirestore, addDepartementsToFirestore, addCommunesToFirestore, toggleHouseBtn, openModal } from './utilitaire.js';
import { showRegionsListAdmin } from './admin.js';
// import regionsData from './data/regionsData.geojson';
// import departementsData from './data/departementsData.geojson';
// import communesData from './data/communes.geojson';

const { app, analytics } = firebase;
const db = getFirestore(app);

const mapStart = initMap();

// AJOUTER LES REGIONS ET RESET LA BDD ATTENTION
// addRegionsToFirestore(regionsData);

// AJOUTER LES DEPARTEMENTS ET RESET LA BDD ATTENTION
// addDepartementsToFirestore(departementsData);

// AJOUTER LES DEPARTEMENTS ET RESET LA BDD ATTENTION
// addCommunesToFirestore(communesData);

// ouverture/fermeture du panneau de droite
toggleHouseBtn();

// Appel de la fonction pour récupérer la variable isConnected
// const isConnected = await connexionToFirebase();

// // ouverture modal pour connexion
openModal();

// on crée un list des régions dans le panneau admin
document.getElementById("bouton-admin").addEventListener("click", () => {
    showRegionsListAdmin();
});

// export { isConnected };