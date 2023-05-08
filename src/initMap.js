import './style.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import regionsData from './data/regionsData.geojson';
import * as regions from './regions.js';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

let isMobile;

function isMobileDevice() {
    if (navigator.userAgent.match(/iPhone/i) ||
        navigator.userAgent.match(/webOS/i) ||
        navigator.userAgent.match(/Android/i) ||
        navigator.userAgent.match(/iPad/i) ||
        navigator.userAgent.match(/iPod/i) ||
        navigator.userAgent.match(/BlackBerry/i) ||
        navigator.userAgent.match(/Windows Phone/i)
    ) {
        isMobile = true;
    } else {
        isMobile = false;
    }
}

isMobileDevice();

const regionLayerGroup = L.layerGroup();

const baseMaps = {
    "Rues": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    "Satellite": L.tileLayer(
        'https://wxs.ign.fr/decouverte/geoportail/wmts?service=WMTS&request=GetTile&version=1.0.0&tilematrixset=PM&tilematrix={z}&tilecol={x}&tilerow={y}&layer=ORTHOIMAGERY.ORTHOPHOTOS&format=image/jpeg&style=normal', {
            tileSize: 256,
            attribution: "IGN-F/Géoportail"
        })
}

let map = null;
let geoJSONLayerRegion;

async function getMayaneRegions() {
    // Récupérer une référence à la collection "regions"
    const regionsRef = collection(getFirestore(), 'regions');

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

    return mayaneRegions;
}

async function initMap() {
    if (map !== undefined && map !== null) {
        map = map.remove()
    }

    if (!map) {
        map = L.map('map', {
            dragging: !L.Browser.mobile,
            tap: !L.Browser.mobile,
            layers: [baseMaps["Satellite"]]
        });

        L.control.layers(baseMaps).addTo(map);

        map.setView([46.60677026454608, 1.8754907884785017], isMobile ? 5 : 6);

        map.options.minZoom = isMobile ? 4 : 6;
        map.options.maxZoom = 18;
        map.options.zoomDelta = 0.5;
        map.options.zoomSnap = 0;

        // On ajoute la couche des régions sur la carte
        const mayaneRegions = await getMayaneRegions();
        const mayaneRegionsData = mayaneRegions.map(region => {
            return regionsData.features.find(feature => feature.properties.INSEE_REG === region.INSEE_REG);
        });
        geoJSONLayerRegion = L.geoJSON(mayaneRegionsData, {
            style: regions.styleRegions,
            onEachFeature: regions.onEachFeatureRegion
        });

        // Ajouter la couche des régions sur la carte
        map.addLayer(geoJSONLayerRegion);
        // Déplacer la couche des régions en arrière-plan lorsque la carte est initialisée
        // geoJSONLayerRegion.bringToBack();
        geoJSONLayerRegion.setZIndex(1);
    }

    return map;
}

export { initMap, getMayaneRegions, map, regionLayerGroup, geoJSONLayerRegion };