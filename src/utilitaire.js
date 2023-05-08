import { getFirestore, collection, addDoc, getDocs, query, where, setDoc, doc } from 'firebase/firestore';
import { showRegionsList } from './regions.js';
import { map } from './initMap';
import { isConnected } from './admin.js';
import fetch from 'node-fetch';

// import fs from 'fs';
// import { pipeline, Readable } from 'stream';
// import { parser } from 'stream-json/Parser';
// import { pick } from 'stream-json/filters/Pick';
// import { streamArray } from 'stream-json/streamers/StreamArray';

// fonction qui ajoute toutes les régions dans firebase
const addRegionsToFirestore = async(regionsData) => {
    // Récupérer une référence à la collection "regions"
    const regionsRef = collection(getFirestore(), 'regions');

    // Ajouter un champ d'index de tri à chaque entité
    regionsData.features.forEach(async(feature, index) => {
        // Extraire les données nécessaires pour ajouter à la collection Firestore
        const data = {
            NOM_REG_M: feature.properties.NOM_REG_M,
            INSEE_REG: feature.properties.INSEE_REG,
            Region_Mayane: feature.properties.Region_Mayane,
            order: index + 1 // Ajouter un champ d'index de tri
        };

        // Vérifier si la région n'existe pas déjà
        const existingRegion = await getDocs(query(regionsRef, where('NOM_REG_M', '==', data.NOM_REG_M)));
        if (!existingRegion.empty) {
            console.log('Region already exists in Firestore:', data.NOM_REG_M);
            return;
        }

        // Ajouter les données à la collection Firestore
        try {
            await addDoc(regionsRef, data);
            console.log('Region data added successfully:', data.NOM_REG_M);
        } catch (error) {
            console.log('Error adding document:', error);
        }
    });
};

// fonction qui ajoute toutes les régions dans firebase
const addDepartementsToFirestore = async(departementsData) => {
    // Récupérer une référence à la collection "regions"
    const departementsRef = collection(getFirestore(), 'departements');

    departementsData.features.forEach(async(feature, index) => {
        // Extraire les données nécessaires pour ajouter à la collection Firestore
        const data = {
            NOM_DEP_M: feature.properties.NOM_DEP_M,
            INSEE_REG: feature.properties.INSEE_REG,
            INSEE_DEP: feature.properties.INSEE_DEP,
            Departement_Mayane: feature.properties.Departement_Mayane,
            order: feature.properties.INSEE_DEP
        };
        // console.log(data);

        // Vérifier si le département n'existe pas déjà
        const existingDepartement = await getDocs(query(departementsRef, where('INSEE_DEP', '==', data.INSEE_DEP)));
        if (!existingDepartement.empty) {
            console.log('Departement already exists in Firestore:', data.INSEE_DEP);
            return;
        }

        if (!data.NOM_DEP_M || data.NOM_DEP_M.trim() === '') {
            console.log('Error: invalid NOM_DEP_M value:', data.NOM_DEP_M);
            return;
        }

        // Ajouter les données à la collection Firestore en utilisant set() au lieu de addDoc()
        try {
            await setDoc(doc(departementsRef, data.INSEE_DEP), data);
            console.log('Departement data added successfully:', data.INSEE_DEP);
        } catch (error) {
            console.log('Error adding document:', error);
        }
    });

};

const processCommunesBatch = async(communesData, index, batchSize) => {
    const communesRef = collection(getFirestore(), "communes");

    for (let i = index; i < index + batchSize && i < communesData.features.length; i++) {
        const feature = communesData.features[i];
        if (feature.properties.COMMUNE_MAYANE === "TRUE") {
            const data = {
                NOM_COM_M: feature.properties.NOM_COM_M,
                INSEE_COM: feature.properties.INSEE_COM,
                INSEE_DEP: feature.properties.INSEE_DEP,
                INSEE_REG: feature.properties.INSEE_REG,
                pmun_2022_comm: feature.properties.pmun_2022_comm,
                PCS: feature.properties.PCS,
                DICRIM: feature.properties.DICRIM,
                Exercice: feature.properties.Exercice,
                Date_realisation_PCS_Mayane: feature.properties.Date_realisation_PCS_Mayane,
                Referent: feature.properties.Referent,
                mail: feature.properties.mail,
                Telephone: feature.properties.Telephone,
                Nom_EPCI_fp: feature.properties.Nom_EPCI_fp,
                Nature: feature.properties.Nature,
                Nb_communes_membres: feature.properties.Nb_communes_membres,
                total_pop_mun_EPCI: feature.properties.total_pop_mun_EPCI,
                COMMUNE_MAYANE: feature.properties.COMMUNE_MAYANE,
            };

            const docRef = doc(communesRef, data.INSEE_COM);

            try {
                await setDoc(docRef, data);
                console.log("Commune added successfully:", data.INSEE_COM);
            } catch (error) {
                console.log("Error adding document:", error);
            }
        }
    }
};

const addCommunesToFirestore = async(communesData, batchSize = 50, delay = 500) => {
    const totalCommunes = communesData.features.length;
    let index = 0;

    while (index < totalCommunes) {
        await new Promise((resolve) => {
            setTimeout(async() => {
                await processCommunesBatch(communesData, index, batchSize);
                index += batchSize;
                resolve();
            }, delay);
        });
    }
};

const communesData = {
    features: [],
};

const processCommunesFile = async(url, batchSize = 50, delay = 500) => {
    try {
        const response = await fetch(url);
        const json = await response.json();
        communesData.features = json.features;
        await addCommunesToFirestore(communesData, batchSize, delay);
        console.log('Communes processed successfully.');
    } catch (error) {
        console.error('Error fetching file:', error);
    }
};

// Replace this with the path to your communesData GeoJSON file
const communesDataUrl = 'http://localhost:8080/data/communes.geojson';

// AJOUTER LES DEPARTEMENTS ET RESET LA BDD ATTENTION
// processCommunesFile(communesDataUrl);

// menu latéral droit
const toggleHouseBtn = () => {
    const houseElt = document.getElementById("house");
    const houseDivElt = document.getElementById("panneau-lateral-droit");
    houseElt.addEventListener("click", function() {
        houseDivElt.classList.toggle('show');
        // on crée la liste des régions
        showRegionsList();
    })
}

// modal connexion
function openModal() {
    if (isConnected !== true) {
        const adminButton = document.querySelector('#admin');
        adminButton.addEventListener('click', (e) => {
            e.preventDefault();
            // Ouvrez le modal de connexion
            const modal = document.querySelector('#modal');
            modal.classList.toggle('show-modal');
        });
    }
}

// retour initial de la carte des régions
function returnRegionsShow(button, geoJSONLayerRegion, geoJSONLayerDepartement) {
    button.addEventListener('click', () => {
        map.fitBounds(geoJSONLayerRegion.getBounds());
        if (geoJSONLayerDepartement) {
            map.removeLayer(geoJSONLayerDepartement);
        }
        const houseDivElt = document.getElementById('panneau-lateral-droit');
        houseDivElt.classList.toggle('show');
        const contenaireDiv = document.getElementById('contenaire');
        contenaireDiv.innerHTML = '';
    });
}

export {
    addRegionsToFirestore,
    addDepartementsToFirestore,
    addCommunesToFirestore,
    toggleHouseBtn,
    openModal,
    returnRegionsShow
}