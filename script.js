const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const qrResult = document.getElementById('qr-result');
const accessMessage = document.getElementById('access-message');
const assignStatus = document.getElementById('assignStatus');
const nomInput = document.getElementById('nom');
const prenomInput = document.getElementById('prenom');
const canvasContext = canvas.getContext('2d');
let currentCamera = 'environment'; // Définit l'utilisation par défaut de la caméra arrière
let stream;
let assignedUsers = {}; // Objet pour stocker l'association QR code <-> Nom & Prénom

// Fonction pour démarrer la caméra
async function startCamera(camera = 'environment') {
    const constraints = {
        video: {
            facingMode: camera // "user" pour caméra frontale, "environment" pour caméra arrière
        }
    };

    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.setAttribute('playsinline', true); // Nécessaire pour certains navigateurs mobiles
        video.play();
        requestAnimationFrame(tick);
    } catch (err) {
        console.error("Erreur lors de l'accès à la caméra : ", err);
        alert("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
}

// Fonction de capture et d'analyse des images vidéo
function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
            handleScannedCode(code.data);
        } else {
            qrResult.innerText = "Aucun QR code détecté.";
            accessMessage.innerText = "";
        }
    }
    requestAnimationFrame(tick); // Continuation du scan en boucle
}

// Fonction pour gérer le code scanné
function handleScannedCode(code) {
    qrResult.innerText = `QR Code détecté : ${code}`;
    
    let scanCount = localStorage.getItem(code) || 0;
    scanCount = parseInt(scanCount) + 1;
    localStorage.setItem(code, scanCount);

    // Vérification des autorisations d'accès
    if (scanCount <= 4) {
        accessMessage.innerText = "Entrée autorisée";
    } else {
        accessMessage.innerText = "Entrée refusée";
    }

    // Afficher le nom associé au code, s'il est dans la base
    if (assignedUsers[code]) {
        assignStatus.innerText = `Ce QR code est associé à : ${assignedUsers[code]}`;
    }
}

// Fonction pour associer un QR code à un nom et prénom
function assignQRCode() {
    const nom = nomInput.value;
    const prenom = prenomInput.value;

    if (!nom || !prenom) {
        alert('Veuillez entrer un nom et un prénom.');
        return;
    }

    // Attente du scan d'un QR code à associer
    const waitForQRCode = () => {
        const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
            assignedUsers[code.data] = `${nom} ${prenom}`;
            assignStatus.innerText = `QR Code associé à ${nom} ${prenom}`;
            return;
        }
        requestAnimationFrame(waitForQRCode);
    };

    requestAnimationFrame(waitForQRCode);
}

// Fonction pour basculer entre la caméra avant et arrière
function switchCamera() {
    currentCamera = currentCamera === 'user' ? 'environment' : 'user';
    stopCamera();  // Arrêter l'ancien flux vidéo avant de démarrer le nouveau
    startCamera(currentCamera);
}

// Fonction pour arrêter la caméra
function stopCamera() {
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());  // Arrêter chaque piste du flux
    }
}

// Fonction pour réinitialiser les données locales
function resetData() {
    localStorage.clear();
    assignedUsers = {};
    qrResult.innerText = '';
    accessMessage.innerText = '';
    assignStatus.innerText = '';
    alert('Toutes les données ont été réinitialisées.');
}

// Ajout des événements aux boutons
document.getElementById('startAssign').addEventListener('click', assignQRCode);
document.getElementById('startScan').addEventListener('click', () => startCamera(currentCamera));
document.getElementById('switchCamera').addEventListener('click', switchCamera);
document.getElementById('resetData').addEventListener('click', resetData);

// Démarrer la caméra dès que la page est chargée
window.addEventListener('load', () => {
    startCamera(currentCamera);
});
