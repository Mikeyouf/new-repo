import { collection, getDocs, query, where, getFirestore } from 'firebase/firestore';
import { map, geoJSONLayerRegion } from './initMap';
import { geoJSONLayerDepartement } from './departements';

// charger les communes et departements en arrière plan
// async function loadDepartmentsData() {
//     const departmentData = {};

//     // Récupérer une référence à la collection "departements"
//     const departementsRef = collection(getFirestore(), 'departements');

//     // Récupérer tous les départements qui ont DEPARTEMENT_MAYANE === "TRUE"
//     const querySnapshot = await getDocs(query(departementsRef, where('DEPARTEMENT_MAYANE', '==', 'TRUE')));

//     // Parcourir les résultats de la requête et charger les données de chaque département
//     querySnapshot.forEach(async(doc) => {
//         const departement = doc.data();
//         departement.id = doc.id;

//         // Récupérer les communes qui ont COMMUNE_MAYANE === "TRUE" pour ce département
//         const communesRef = collection(departementsRef.doc(departement.id), 'communes');
//         const communesQuerySnapshot = await getDocs(query(communesRef, where('COMMUNE_MAYANE', '==', 'TRUE')));

//         // Créer un tableau pour stocker les communes qui ont COMMUNE_MAYANE === "TRUE"
//         const mayaneCommunes = [];

//         // Parcourir les résultats de la requête et ajouter les communes dans un tableau
//         communesQuerySnapshot.forEach((communeDoc) => {
//             const commune = communeDoc.data();
//             commune.id = communeDoc.id;
//             mayaneCommunes.push(commune);
//         });

//         // Stocker les données du département et de ses communes dans un objet
//         departmentData[departement.id] = {
//             departement: departement,
//             communes: mayaneCommunes,
//         };
//     });

//     return departmentData;
// }

async function loadCommunes(regionCode) {
    const response = await fetch(`./data/communes_${regionCode}.geojson`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const communesData = await response.json();

    const filteredCommunes = [];
    communesData.features.forEach((feature) => {
        if (feature.properties.COMMUNE_MAYANE === "TRUE") {
            filteredCommunes.push(feature);
        }
    });
    return filteredCommunes;
}

// On prend le niveau de zoom
function getCurrentZoom() {
    map.on('zoomend', function() {
        geoJSONLayerCommune.eachLayer(function(layer) {
            layer.setStyle(styleCommunes(layer.feature));
        });
    });
}

function styleCommunes(feature) {
    const currentZoomLevel = map.getZoom();
    return {
        fillColor: currentZoomLevel >= 13 ? 'transparent' : 'red',
        weight: currentZoomLevel >= 13 ? 4 : 2,
        opacity: 0.8,
        color: currentZoomLevel >= 13 ? 'red' : 'white',
        dashArray: '',
        fillOpacity: 0.2
    };
}

function onEachFeatureCommunes(feature, layer) {
    layer.on({
        mouseover: highlightFeatureCommunes,
        mouseout: resetHighlightCommunes,
        click: (e) => {
            zoomToFeatureCommunes(e);
            displayCommuneInfo(feature);
        },
    });
}

function highlightFeatureCommunes(e) {
    let layer = e.target;
    const currentZoomLevel = map.getZoom();
    layer.setStyle({
        weight: currentZoomLevel >= 13 ? 4 : 3,
        color: currentZoomLevel >= 13 ? 'red' : 'white',
        opacity: 1,
        dashArray: '',
        fillOpacity: 0.5,
        fillColor: currentZoomLevel >= 13 ? 'transparent' : 'red',
    });

    geoJSONLayerDepartement.setStyle({
            weight: 3,
            color: '#fff',
            opacity: 1,
            dashArray: '',
            fillOpacity: 0.1,
            fillColor: '#FEB24C',
        })
        // if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge && !window.geoJSONLayerCommune) {
        //     layer.bringToFront();
        // }
        // if (!window.geoJSONLayerCommune) {
        //     layer.bringToFront();
        // }
}

function resetHighlightCommunes(e) {
    const currentZoomLevel = map.getZoom();
    e.target.setStyle({
        fillColor: currentZoomLevel >= 13 ? 'transparent' : 'red',
        weight: currentZoomLevel >= 13 ? 4 : 2,
        opacity: 0.7,
        color: currentZoomLevel >= 13 ? 'red' : 'white',
        dashArray: '',
        fillOpacity: 0.2
    });
}

function zoomToFeatureCommunes(e) {
    map.fitBounds(e.target.getBounds());
}

let geoJSONLayerCommune = L.geoJSON();

async function getMayaneCommunes(depINSEE) {
    // Récupérer une référence à la collection "communes"
    const communesRef = collection(getFirestore(), 'communes');

    // Récupérer les communes qui ont COMMUNE_MAYANE === "TRUE" et qui appartiennent au département spécifié
    const querySnapshot = await getDocs(query(communesRef, where('COMMUNE_MAYANE', '==', 'TRUE'), where('INSEE_DEP', '==', depINSEE)));

    // Créer un tableau pour stocker les communes qui ont COMMUNE_MAYANE === "TRUE"
    const mayaneCommunes = [];

    // Parcourir les résultats de la requête et ajouter les communes dans un groupe de calques
    querySnapshot.forEach((doc) => {
        const commune = doc.data();
        commune.id = doc.id;
        mayaneCommunes.push(commune);
    });

    return mayaneCommunes;
}

// On récupère les infos de la commune choisie
function displayCommuneInfo(commune) {
    let panneauComm = document.getElementById('panneau-communes');
    panneauComm.classList.add('down');
    let titreComm = document.getElementById('nom-comm');
    let communeInfoDiv = document.getElementById('commune-info');

    let croixElt = document.getElementById('croix');
    croixElt.addEventListener('click', function() {
        panneauComm.classList.remove('down');
    });

    communeInfoDiv.innerHTML = '';

    // Créez un tableau avec les noms des propriétés à exclure
    const propertiesToExclude = ['fid', 'COMMUNE_MAYANE', 'NOM_COM_M', 'INSEE_COM', 'INSEE_DEP', 'INSEE_REG'];

    // Affectez la valeur de la propriété 'NOM_COM_M' au titre h3
    titreComm.textContent = commune.properties.NOM_COM_M;

    // Parcourir toutes les propriétés de la commune
    for (const property in commune.properties) {
        // Vérifiez si la propriété en cours doit être exclue
        if (!propertiesToExclude.includes(property)) {
            // Créer un élément HTML pour afficher la propriété
            const propertySpan = document.createElement('span');
            propertySpan.textContent = `${property}: `;
            propertySpan.classList.add('property-name'); // Ajoutez la classe CSS pour styliser la propriété

            // Créer un élément HTML pour afficher la valeur
            const valueSpan = document.createElement('span');
            valueSpan.textContent = `${commune.properties[property]}`;

            // Créer un élément <p> pour contenir la propriété et la valeur
            const propertyDiv = document.createElement('p');
            propertyDiv.classList.add('info-column'); // Ajoutez la classe info-column pour les colonnes
            propertyDiv.appendChild(propertySpan);
            propertyDiv.appendChild(valueSpan);

            // Ajouter l'élément HTML au panneau latéral droit
            communeInfoDiv.appendChild(propertyDiv);
        }
    }

}

async function showCommunesList(regionCode, departmentINSEE, departmentName) {
    // Supprimer la couche de communes actuelle
    if (geoJSONLayerCommune) {
        map.removeLayer(geoJSONLayerCommune);
    }

    const mayaneCommunes = await getMayaneCommunes(departmentINSEE);

    const houseDivElt = document.getElementById("panneau-lateral-droit");
    houseDivElt.classList.add('show');

    const contenaireDiv = document.getElementById('contenaire');
    contenaireDiv.innerHTML = '';

    const titre = document.createElement('h3');
    titre.textContent = `Liste des communes`;

    contenaireDiv.appendChild(titre);

    const subtitle = document.createElement('h3');
    subtitle.textContent = `${departmentName}`;

    contenaireDiv.appendChild(subtitle);

    const communeList = document.createElement('ul');
    communeList.className = 'list-group';

    // Charger les communes depuis le fichier avec JSONStream
    const filteredCommunes = await loadCommunes(regionCode);

    // Filtrer les communes par département
    const communesByDepartment = filteredCommunes.filter((commune) => {
        return commune.properties.INSEE_DEP === departmentINSEE;
    });

    // Ajouter la couche de communes sur la carte avec Leaflet
    geoJSONLayerCommune = L.geoJSON(communesByDepartment, {
        style: styleCommunes,
        onEachFeature: onEachFeatureCommunes
    }).addTo(map);

    geoJSONLayerDepartement.setZIndex(2); // Définit l'indice Z de la couche de départements à 2
    geoJSONLayerCommune.setZIndex(3); // Définit l'indice Z de la couche de communes à 3
    // Appeler la fonction getCurrentZoom pour mettre à jour le style des communes en fonction du niveau de zoom
    getCurrentZoom();

    const communeCount = communesByDepartment.length;

    if (communeCount > 10) {
        const communeDropdown = document.createElement('select');
        communeDropdown.className = 'form-select';

        const defaultOption = document.createElement('option');
        defaultOption.selected = true;
        defaultOption.disabled = true;
        defaultOption.textContent = `Sélectionner une commune (${communeCount} communes)`;
        communeDropdown.appendChild(defaultOption);

        communesByDepartment.forEach((commune) => {
            const communeOption = document.createElement('option');
            communeOption.value = commune.properties.INSEE_COM;
            communeOption.textContent = commune.properties.NOM_COM_M;
            communeDropdown.appendChild(communeOption);
        });

        communeDropdown.addEventListener('change', (event) => {
            const selectedINSEE_COM = event.target.value;
            const selectedCommune = communesByDepartment.find((commune) => {
                return commune.properties.INSEE_COM === selectedINSEE_COM;
            });
            map.fitBounds(L.geoJSON(selectedCommune).getBounds());
            displayCommuneInfo(selectedCommune)
        });

        communeList.appendChild(communeDropdown);
    } else {
        communesByDepartment.forEach((commune) => {
            const communeListItem = document.createElement('li');
            communeListItem.textContent = commune.properties.NOM_COM_M;
            communeListItem.className = 'list-group-item';

            communeListItem.addEventListener('click', () => {
                map.fitBounds(L.geoJSON(commune).getBounds());
                displayCommuneInfo(commune);
            });

            communeList.appendChild(communeListItem);
        });
    }

    contenaireDiv.appendChild(communeList);
}


export { getMayaneCommunes, showCommunesList, geoJSONLayerCommune };