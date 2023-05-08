// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
// import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD-gtMWqhNU_kwz6vlpR3O6ehbLKQvfO8g",
    authDomain: "carte-interactive-mayane.firebaseapp.com",
    projectId: "carte-interactive-mayane",
    storageBucket: "carte-interactive-mayane.appspot.com",
    messagingSenderId: "320718794003",
    appId: "1:320718794003:web:a2fa6b593cd42ea8863ee6",
    measurementId: "G-5KG762700X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// let isConnected = false;
// // connexion à firebase par identification
// export const connexionToFirebase = () => {
//     return new Promise((resolve, reject) => {
//         const auth = getAuth(app);

//         // Vérifier si l'utilisateur est déjà connecté en regardant le localStorage
//         const user = JSON.parse(localStorage.getItem('user'));
//         if (user && user.accessToken) {
//             // Utilisateur déjà connecté, on résout la promesse avec true
//             resolve(true);
//             const boutonAdmin = document.querySelector('#bouton-admin');
//             boutonAdmin.classList.toggle('not-connected');
//             return; // Ajoutez return pour sortir de la fonction si l'utilisateur est déjà connecté
//         }

//         // Récupérer une référence à l'élément de formulaire de connexion
//         const loginForm = document.querySelector('#login-form');

//         // Ajoutez un écouteur d'événement pour le formulaire de connexion
//         loginForm.addEventListener('submit', (e) => {
//             e.preventDefault();

//             // Récupérez les informations de connexion à partir du formulaire
//             const email = loginForm['email'].value;
//             const password = loginForm['password'].value;

//             // Connectez-vous à Firebase avec les informations de connexion
//             signInWithEmailAndPassword(auth, email, password)
//                 .then((userCredential) => {
//                     // Connexion réussie, fermez le modal
//                     const modal = document.querySelector('#modal');
//                     modal.classList.toggle('show-modal');
//                     const user = userCredential.user;

//                     // Enregistrer l'état de connexion dans le localStorage
//                     localStorage.setItem('user', JSON.stringify({
//                         accessToken: user.accessToken,
//                         email: user.email
//                     }));

//                     resolve(true);
//                     const boutonAdmin = document.querySelector('#bouton-admin');
//                     boutonAdmin.classList.toggle('not-connected');
//                 })
//                 .catch((error) => {
//                     // Erreur lors de la connexion, affichez un message d'erreur
//                     const errorMessage = error.message;
//                     console.log(errorMessage);
//                     resolve(false);
//                 });
//         });

//         // Vérifier la valeur de isConnected à l'intérieur de la fonction
//         if (isConnected) {
//             const boutonAdmin = document.querySelector('#bouton-admin');
//             boutonAdmin.classList.toggle('not-connected');
//         }
//     });
// };

export default {
    app,
    analytics,
    db,
};