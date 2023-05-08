import L from 'leaflet';
import { collection, getDocs, query, where, getFirestore } from 'firebase/firestore';
import { map, geoJSONLayerRegion } from './initMap';
import { showDepartmentsList, geoJSONLayerDepartement } from './departements.js';
import { geoJSONLayerCommune } from './communes';

function styleRegions(feature) {
    return {
        fillColor: 'green',
        weight: 2,
        opacity: 0.8,
        color: 'white',
        dashArray: '',
        fillOpacity: 0.2
    };
}

function onEachFeatureRegion(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeatureRegion
    });
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 3,
        color: '#fff',
        opacity: 1,
        dashArray: '',
        fillOpacity: 0.1,
        fillColor: '#FEB24C',
    });
    // if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge && !window.geoJSONLayerCommune) {
    //     layer.bringToFront();
    // }
    // if (!window.geoJSONLayerCommune) {
    //     layer.bringToFront();
    // }
}

function resetHighlight(e) {
    e.target.setStyle({
        fillColor: 'green',
        weight: 2,
        opacity: 0.7,
        color: 'white',
        dashArray: '',
        fillOpacity: 0.2
    });
}

function zoomToFeatureRegion(e) {
    map.fitBounds(e.target.getBounds());

    let panneauComm = document.getElementById('panneau-communes');
    panneauComm.classList.remove('down');

    const regionName = e.target.feature.properties.NOM_REG_M;
    const inseeReg = e.target.feature.properties.INSEE_REG

    showDepartmentsList(inseeReg, regionName);
}

const showRegionsList = async() => {
    // Attendre que la couche geoJSONLayerRegion soit prête
    await new Promise(resolve => {
        const checkLayerReady = setInterval(() => {
            if (geoJSONLayerRegion) {
                clearInterval(checkLayerReady);
                resolve();
            }
        }, 50);
    });
    // Récupérer une référence à la collection "regions"
    const regionsRef = collection(getFirestore(), 'regions');

    try {
        // Récupérer les régions qui ont Region_Mayane === "TRUE"
        const querySnapshot = await getDocs(query(regionsRef, where('Region_Mayane', '==', 'TRUE')));

        // Créer un tableau pour stocker les régions qui ont Region_Mayane === "TRUE"
        const mayaneRegions = [];

        // Parcourir les résultats de la requête et ajouter les régions dans un groupe de calques
        querySnapshot.forEach((doc) => {
            const region = doc.data();
            region.id = doc.id;
            mayaneRegions.push(region);

        });

        // Ajouter la liste à la div contenaire
        const contenaireDiv = document.getElementById('contenaire');
        contenaireDiv.innerHTML = '';

        const titre = document.createElement('h3');
        titre.textContent = "Liste des régions";

        contenaireDiv.appendChild(titre);

        const regionList = document.createElement('ul');
        regionList.className = 'list-group';

        mayaneRegions.forEach((region) => {
            const regionListItem = document.createElement('li');
            regionListItem.textContent = region.NOM_REG_M;
            regionListItem.className = 'list-group-item';

            geoJSONLayerRegion.eachLayer((layer) => {
                if (layer.feature.properties.NOM_REG_M === region.NOM_REG_M) {
                    regionListItem.addEventListener('click', () => {
                        showDepartmentsList(region.INSEE_REG, layer.feature.properties.NOM_REG_M);
                        map.fitBounds(layer.getBounds());
                    });
                }
            });

            regionList.appendChild(regionListItem);
        });

        contenaireDiv.appendChild(regionList);


        return mayaneRegions;
    } catch (error) {
        console.error('Erreur lors de la récupération des régions Mayane', error);
    }
};

export { styleRegions, onEachFeatureRegion, showRegionsList };