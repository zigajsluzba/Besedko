/**
 * Besedko+ configuration
 *
 * Firebase Realtime Database setup (brezplačno):
 * 1. Pojdi na https://console.firebase.google.com/
 * 2. Ustvari projekt (npr. "besedko")
 * 3. V levi meni: Build → Realtime Database → Create Database
 * 4. Izberi lokacijo (Europe-west1), začni v "test mode"
 * 5. Kopiraj URL baze (oblika: https://besedko-xxxxx-default-rtdb.europe-west1.firebasedatabase.app)
 * 6. Prilepi URL spodaj in commitaj spremembo na GitHub
 */
export const config = {
  firebaseUrl: "https://besedko-c9763-default-rtdb.europe-west1.firebasedatabase.app",

  // Firebase app config
  firebaseApp: {
    apiKey:            "AIzaSyBQ194Pjv-uoI8aEt4saITpKwzf_Tm5_Mc",
    authDomain:        "besedko-c9763.firebaseapp.com",
    databaseURL:       "https://besedko-c9763-default-rtdb.europe-west1.firebasedatabase.app",
    projectId:         "besedko-c9763",
    storageBucket:     "besedko-c9763.firebasestorage.app",
    messagingSenderId: "362804660533",
    appId:             "1:362804660533:web:c7fc7569c1c1c5b633247c",
  },
};
