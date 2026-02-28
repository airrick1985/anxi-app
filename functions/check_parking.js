const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You must have Google Application Default Credentials or specify the service account key
// For this script, we assume the environment is already set up or we can just use the required config
const serviceAccount = require('./serviceAccountKey.json'); // Adjust path if needed

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkParking() {
    const parkingsRef = db.collection('salesParkings');
    // I will just query for projectId = "anxi-app", adjust if needed
    const snapshot = await parkingsRef.where('spotId', 'in', ['B3-103a', 'B6-15']).get();

    if (snapshot.empty) {
        console.log('No matching documents.');
        return;
    }

    snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
    });
}

checkParking().catch(console.error);
