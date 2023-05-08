import L from 'leaflet';
import { collection, getDocs, query, where, getFirestore } from 'firebase/firestore';
import { map, geoJSONLayerRegion } from './initMap';
import { returnRegionsShow } from './utilitaire';
import { showCommunesList, geoJSONLayerCommune } from './communes';
import departementsData from './data/departementsData.geojson';

function styleDepartements(feature) {
    return {
        fillColor: 'yellow',
        weight: 2,
        opacity: 0.8,
        color: 'white',
        dashArray: '',
        fillOpacity: 0.2
    };
}

function onEachFeatureDepartements(feature, layer) {
    layer.on({
        mouseover: highlightFeatureDepartement,
        mouseout: resetHighlightDepartement,
        click: zoomToFeatureDepartement
    });
}

function highlightFeatureDepartement(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 3,
        color: '#fff',
        opacity: 1,
        dashArray: '',
        fillOpacity: 0.5,
        fillColor: 'yellow',
    });

    geoJSONLayerRegion.setStyle({
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

function resetHighlightDepartement(e) {
    e.target.setStyle({
        fillColor: 'yellow',
        weight: 2,
        opacity: 0.7,
        color: 'white',
        dashArray: '',
        fillOpacity: 0.2
    });
}

function zoomToFeatureDepartement(e) {
    const layer = e.target;
    map.fitBounds(layer.getBounds());

    const departmentINSEE = layer.feature.properties.INSEE_DEP;
    const departmentName = layer.feature.properties.NOM_DEP_M;
    const regionINSEE = layer.feature.properties.INSEE_REG;

    showCommunesList(regionINSEE, departmentINSEE, departmentName);
}

let geoJSONLayerDepartement = L.geoJSON();

async function getMayaneDepartments(regionINSEE, forceUpdate = false) {
    // Supprimer la couche de départements existante de la carte
    if (forceUpdate) {
        map.removeLayer(geoJSONLayerDepartement);
    }
    // Récupérer une référence à la collection "departements"
    const departementsRef = collection(getFirestore(), 'departements');

    // Récupérer les départements qui ont Departement_Mayane === "TRUE" et qui appartiennent à la région spécifiée
    const querySnapshot = await getDocs(query(departementsRef, where('Departement_Mayane', '==', 'TRUE'), where('INSEE_REG', '==', regionINSEE)));

    // Créer un tableau pour stocker les départements qui ont Departement_Mayane === "TRUE"
    const mayaneDepartments = [];

    // Parcourir les résultats de la requête et ajouter les départements dans un groupe de calques
    querySnapshot.forEach((doc) => {
        const department = doc.data();
        department.id = doc.id;
        mayaneDepartments.push(department);
    });

    // Créer la couche des départements
    const mayaneDepartmentsData = mayaneDepartments.map(department => {
        return departementsData.features.find(feature => feature.properties.INSEE_DEP === department.INSEE_DEP);
    });

    geoJSONLayerDepartement = L.geoJSON(mayaneDepartmentsData, {
        style: styleDepartements,
        onEachFeature: onEachFeatureDepartements
    });

    map.addLayer(geoJSONLayerDepartement);
    geoJSONLayerRegion.setZIndex(1);
    geoJSONLayerDepartement.setZIndex(2); // Définit l'indice Z de la couche de départements à 2
    geoJSONLayerCommune.setZIndex(3); // Définit l'indice Z de la couche de communes à 3

    return geoJSONLayerDepartement;
}

async function showDepartmentsList(regionINSEE, regionName) {
    // Supprimer la couche de département actuelle
    if (geoJSONLayerDepartement) {
        map.removeLayer(geoJSONLayerDepartement);
    }

    const mayaneDepartments = await getMayaneDepartments(regionINSEE);

    const houseDivElt = document.getElementById("panneau-lateral-droit");
    houseDivElt.classList.add('show');

    const contenaireDiv = document.getElementById('contenaire');
    contenaireDiv.innerHTML = '';

    const titre = document.createElement('h3');
    titre.textContent = `Liste des départements - ${regionName}`;

    contenaireDiv.appendChild(titre);

    const departmentList = document.createElement('ul');
    departmentList.className = 'list-group';

    geoJSONLayerDepartement.eachLayer((layer) => {
        const department = layer.feature.properties;

        const departmentListItem = document.createElement('li');
        departmentListItem.textContent = department.NOM_DEP_M;
        departmentListItem.className = 'list-group-item';

        departmentListItem.addEventListener('click', async() => {
            map.fitBounds(layer.getBounds());
            await showCommunesList(regionINSEE, department.INSEE_DEP, department.NOM_DEP_M);
        });

        departmentList.appendChild(departmentListItem, regionName);
    });

    const button = document.getElementById('back-arrow');
    returnRegionsShow(button, geoJSONLayerRegion, geoJSONLayerDepartement);
    contenaireDiv.appendChild(departmentList);
}

export { showDepartmentsList, geoJSONLayerDepartement, getMayaneDepartments }