import { geoJSONLayerRegion, getMayaneRegions } from './initMap';
import { collection, getDocs, getFirestore, updateDoc, doc, getDoc, query, where } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import firebase from './firebase.js';
import { showRegionsList } from './regions.js';
import { getMayaneDepartments, geoJSONLayerDepartement } from './departements.js';
import regionsData from './data/regionsData.geojson';

let isConnected = false;
// connexion à firebase par identification
const connexionToFirebase = () => {
    return new Promise((resolve, reject) => {
        const auth = getAuth(firebase.app);

        // Utiliser onAuthStateChanged pour suivre les changements d'état d'authentification
        auth.onAuthStateChanged((user) => {
            // console.log(user);
            if (user) {
                // L'utilisateur est connecté
                isConnected = true;
            } else {
                // L'utilisateur est déconnecté
                isConnected = false;
            }
        });

        // Vérifier si l'utilisateur est déjà connecté en regardant le localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.accessToken) {
            // Utilisateur déjà connecté, on résout la promesse avec true
            isConnected = true;
            const boutonAdmin = document.querySelector('#bouton-admin');
            boutonAdmin.classList.toggle('not-connected');
            resolve(true);
            return;
        }

        // Récupérer une référence à l'élément de formulaire de connexion
        const loginForm = document.querySelector('#login-form');

        // Ajoutez un écouteur d'événement pour le formulaire de connexion
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Récupérez les informations de connexion à partir du formulaire
            const email = loginForm['email'].value;
            const password = loginForm['password'].value;

            // Connectez-vous à Firebase avec les informations de connexion
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Connexion réussie, fermez le modal
                    const modal = document.querySelector('#modal');
                    modal.classList.toggle('show-modal');
                    const user = userCredential.user;

                    // Enregistrer l'état de connexion dans le localStorage
                    localStorage.setItem('user', JSON.stringify({
                        accessToken: user.accessToken,
                        email: user.email
                    }));

                    // Mettre à jour la valeur de isConnected
                    isConnected = true;

                    const boutonAdmin = document.querySelector('#bouton-admin');
                    boutonAdmin.classList.toggle('not-connected');

                    resolve(true);
                })
                .catch((error) => {
                    // Erreur lors de la connexion, affichez un message d'erreur
                    const errorMessage = error.message;
                    console.log(errorMessage);
                    resolve(false);
                });
        });

        // Vérifier la valeur de isConnected à l'intérieur de la fonction
        if (isConnected) {
            const boutonAdmin = document.querySelector('#bouton-admin');
            boutonAdmin.classList.toggle('not-connected');
        }
    });
};

connexionToFirebase();

// Fonction pour créer un élément p avec un label et un input associé
const createInputElement = (label, value, onChangeCallback) => {
    const p = document.createElement('p');
    p.textContent = `${label}:`;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.addEventListener('change', onChangeCallback);
    p.appendChild(input);
    return p;
};

// Fonction pour afficher les informations de la région sélectionnée dans la div contenaire
const showRegionInfo = async(selectedRegionId, regionsRef, contenaireDiv) => {
    // Récupérer la région sélectionnée
    const selectedRegionSnapshot = await getDoc(doc(regionsRef, selectedRegionId));
    const selectedRegion = selectedRegionSnapshot.data();
    selectedRegion.id = selectedRegionSnapshot.id;

    // Supprimer les anciennes informations de la région sélectionnée
    const regionInfoDiv = contenaireDiv.querySelector('.region-info');
    if (regionInfoDiv) {
        contenaireDiv.removeChild(regionInfoDiv);
    }

    // Afficher les informations de la région sélectionnée dans la div contenaire
    const newRegionInfoDiv = document.createElement('div');
    newRegionInfoDiv.className = 'region-info';

    for (const key in selectedRegion) {
        if (Object.hasOwnProperty.call(selectedRegion, key)) {
            const p = createInputElement(key, selectedRegion[key], () => {
                selectedRegion[key] = p.querySelector('input').value;
            });
            newRegionInfoDiv.appendChild(p);
        }
    }

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Enregistrer';
    submitButton.addEventListener('click', async() => {
        // Enregistrer les modifications dans la base de données Firebase
        try {
            await updateDoc(doc(regionsRef, selectedRegionId), selectedRegion);
            messageParagraph.textContent = 'Les modifications ont été enregistrées avec succès.';

            // Récupérer les régions qui ont Region_Mayane === "TRUE" dans Firebase
            const mayaneRegions = await getMayaneRegions();

            const mayaneRegionsData = mayaneRegions.map(region => {
                return regionsData.features.find(feature => feature.properties.INSEE_REG === region.INSEE_REG);
            });

            // Enlever toutes les couches de la couche GeoJSON existante
            geoJSONLayerRegion.clearLayers();

            // Ajouter les nouvelles données GeoJSON à la couche
            geoJSONLayerRegion.addData(mayaneRegionsData);


        } catch (error) {
            console.error('Erreur lors de l\'enregistrement des modifications', error);
            messageParagraph.textContent = 'Une erreur s\'est produite lors de l\'enregistrement des modifications.';
        }

        // Mettre à jour la liste des régions
        await showRegionsList();
    });

    newRegionInfoDiv.appendChild(submitButton);


    const messageParagraph = document.createElement('p');
    newRegionInfoDiv.appendChild(messageParagraph);

    contenaireDiv.appendChild(newRegionInfoDiv);
};

// Fonction pour récupérer les départements d'une région spécifique
const getDepartmentsByRegion = async(regionInsee) => {
    const db = getFirestore();
    const departmentsRef = collection(db, "departements");
    const departmentQuery = query(
        departmentsRef,
        where("INSEE_REG", "==", regionInsee),
    );
    const querySnapshot = await getDocs(departmentQuery);

    const departments = [];
    querySnapshot.forEach((doc) => {
        const department = doc.data();
        department.id = doc.id;
        departments.push(department);
    });

    return departments;
};

// Fonction pour afficher les informations du département sélectionné dans la div contenaire
const showDepartmentInfo = async(selectedDepartmentId, departmentsRef, contenaireDiv) => {
    // Récupérer le département sélectionné
    const selectedDepartmentSnapshot = await getDoc(doc(departmentsRef, selectedDepartmentId));
    const selectedDepartment = selectedDepartmentSnapshot.data();
    selectedDepartment.id = selectedDepartmentSnapshot.id;

    // Supprimer les anciennes informations du département sélectionné
    const departmentInfoDiv = contenaireDiv.querySelector(".department-info");
    if (departmentInfoDiv) {
        contenaireDiv.removeChild(departmentInfoDiv);
    }

    // Afficher les informations du département sélectionné dans la div contenaire
    const newDepartmentInfoDiv = document.createElement("div");
    newDepartmentInfoDiv.className = "department-info";

    for (const key in selectedDepartment) {
        if (Object.hasOwnProperty.call(selectedDepartment, key)) {
            const p = createInputElement(key, selectedDepartment[key], () => {
                selectedDepartment[key] = p.querySelector("input").value;
            });
            newDepartmentInfoDiv.appendChild(p);
        }
    }

    const submitButton = document.createElement("button");
    submitButton.textContent = "Enregistrer";
    submitButton.addEventListener("click", async() => {
        // Enregistrer les modifications dans la base de données Firebase
        try {
            await updateDoc(doc(departmentsRef, selectedDepartmentId), selectedDepartment);
            messageParagraph.textContent = "Les modifications ont été enregistrées avec succès.";

            // Récupérer l'élément de la liste déroulante des régions
            const regionSelectElement = document.querySelector(".form-select");

            // Récupérer l'ID de la région sélectionnée
            const selectedRegionId = regionSelectElement.value;

            // Créer une nouvelle référence à la collection "regions"
            const newRegionsRef = collection(getFirestore(), "regions");

            // Récupérer l'objet région correspondant à l'ID sélectionné
            const regionDoc = await getDoc(doc(newRegionsRef, selectedRegionId));
            const regionData = regionDoc.data();

            // Récupérer l'INSEE_REG de l'objet région
            const selectedRegionInsee = regionData.INSEE_REG;

            // Mettre à jour l'affichage des départements sur la carte
            await getMayaneDepartments(selectedRegionInsee, true);

        } catch (error) {
            console.error("Erreur lors de l'enregistrement des modifications", error);
            messageParagraph.textContent = "Une erreur s'est produite lors de l'enregistrement des modifications.";
        }
    });

    newDepartmentInfoDiv.appendChild(submitButton);

    const messageParagraph = document.createElement("p");
    newDepartmentInfoDiv.appendChild(messageParagraph);

    contenaireDiv.appendChild(newDepartmentInfoDiv);
};

// Fonction pour afficher les départements en sous-menu des régions respectives
const showDepartmentsListAdmin = async(regionInsee) => {
    const departments = await getDepartmentsByRegion(regionInsee);

    // Créer un sous-menu pour les départements
    const select = document.createElement("select");
    select.className = "form-select form-select-sm mb-3";

    // Ajouter une option par défaut en haut du menu déroulant
    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Sélectionnez un département";
    defaultOption.value = "";
    defaultOption.selected = true;
    defaultOption.disabled = true;
    select.appendChild(defaultOption);

    departments.forEach((department) => {
        const option = document.createElement("option");
        option.textContent = department.NOM_DEP_M;
        option.value = department.id;
        select.appendChild(option);
    });

    // Ajouter un écouteur d'événement "change" à la balise select
    select.addEventListener("change", async(event) => {
        // Récupérer l'ID du département sélectionné
        const selectedDepartmentId = event.target.value;

        // Récupérer une référence à la collection "departements"
        const db = getFirestore();
        const departmentsRef = collection(db, "departements");

        // Afficher les informations du département sélectionné dans la div contenaire
        const contenaireDiv = document.getElementById("contenaire");
        await showDepartmentInfo(selectedDepartmentId, departmentsRef, contenaireDiv);
    });

    return select;
};

function clearDepartmentInfo() {
    // Si une div contenant les informations sur le département existe, supprimez-la.
    const departmentInfoDiv = document.querySelector(".department-info");
    if (departmentInfoDiv) {
        departmentInfoDiv.remove();
    }
}

// on affiche les régions pour le panneau admin
export const showRegionsListAdmin = async() => {
    // Attendre que la couche geoJSONLayerRegion soit prête
    await new Promise((resolve) => {
        const checkLayerReady = setInterval(() => {
            if (geoJSONLayerRegion) {
                clearInterval(checkLayerReady);
                resolve();
            }
        }, 50);
    });

    // Récupérer une référence à la collection "regions"
    const regionsRef = collection(getFirestore(), "regions");

    try {
        // Récupérer toutes les régions
        const querySnapshot = await getDocs(regionsRef);

        // Créer un tableau pour stocker toutes les régions
        const regions = [];

        // Parcourir les résultats de la requête et ajouter les régions dans le tableau
        querySnapshot.forEach((doc) => {
            const region = doc.data();
            region.id = doc.id;
            regions.push(region);
        });

        // Trier le tableau des régions en utilisant la propriété "order"
        regions.sort((a, b) => a.order - b.order);

        // Ajouter la liste à la div contenaire
        const select = document.createElement("select");
        select.className = "form-select";

        // Ajouter une option par défaut en haut du menu déroulant
        const defaultOption = document.createElement("option");
        defaultOption.textContent = "Sélectionnez une région";
        defaultOption.value = "";
        defaultOption.selected = true;
        defaultOption.disabled = true;
        select.appendChild(defaultOption);

        regions.forEach((region) => {
            const option = document.createElement("option");
            option.textContent = region.NOM_REG_M;
            option.value = region.id;
            select.appendChild(option);
        });

        // Ajouter la liste déroulante à la div contenaire
        const contenaireDiv = document.getElementById("contenaire");
        contenaireDiv.innerHTML = "";
        contenaireDiv.appendChild(select);


        // Ajouter un écouteur d'événement "change" à la balise select
        select.addEventListener("change", async(event) => {
            // Récupérer l'ID de la région sélectionnée
            const selectedRegionId = event.target.value;
            const selectedRegionInsee = regions.find(
                (region) => region.id === selectedRegionId
            ).INSEE_REG;
            await getMayaneDepartments(selectedRegionInsee, true);

            // Afficher les informations de la région sélectionnée dans la div contenaire
            await showRegionInfo(selectedRegionId, regionsRef, contenaireDiv);

            // Effacer les informations du département précédemment sélectionné
            clearDepartmentInfo();

            // Afficher la liste des départements en sous-menu des régions respectives
            const departmentSelect = await showDepartmentsListAdmin(
                selectedRegionInsee
            );
            if (contenaireDiv.querySelector(".department-select")) {
                contenaireDiv.removeChild(contenaireDiv.querySelector(".department-select"));
            }
            contenaireDiv.appendChild(departmentSelect);
            departmentSelect.classList.add("department-select");
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des régions", error);
        const contenaireDiv = document.getElementById("contenaire");
        contenaireDiv.innerHTML = "Une erreur s'est produite lors de la récupération des régions.";
    }
};

export { isConnected };