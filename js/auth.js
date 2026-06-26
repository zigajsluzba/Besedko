import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let _auth = null;

function getFirebaseAuth(appConfig) {
  if (_auth) return _auth;
  const app = getApps().length > 0 ? getApp() : initializeApp(appConfig);
  _auth = getAuth(app);
  return _auth;
}

export function initAuth(appConfig) {
  return getFirebaseAuth(appConfig);
}

export function onAuthChange(appConfig, callback) {
  try {
    const auth = getFirebaseAuth(appConfig);
    return onAuthStateChanged(auth, callback);
  } catch (e) {
    console.error("[Auth] onAuthChange failed:", e);
    callback(null);
    return () => {};
  }
}

export async function signInWithGoogle(appConfig) {
  const auth = getFirebaseAuth(appConfig);
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signInWithEmail(appConfig, email, password) {
  const auth = getFirebaseAuth(appConfig);
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function registerWithEmail(appConfig, email, password, displayName) {
  const auth = getFirebaseAuth(appConfig);
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

export async function logout(appConfig) {
  const auth = getFirebaseAuth(appConfig);
  await signOut(auth);
}

export function getCurrentUser(appConfig) {
  try {
    return getFirebaseAuth(appConfig).currentUser;
  } catch (e) {
    return null;
  }
}

export function friendlyAuthError(code) {
  const map = {
    "auth/invalid-credential":      "Napačen e-naslov ali geslo.",
    "auth/user-not-found":          "Račun s tem e-naslovom ne obstaja.",
    "auth/wrong-password":          "Napačno geslo.",
    "auth/email-already-in-use":    "E-naslov je že v uporabi.",
    "auth/weak-password":           "Geslo mora imeti vsaj 6 znakov.",
    "auth/invalid-email":           "Neveljavna oblika e-naslova.",
    "auth/too-many-requests":       "Preveč poskusov. Počakaj malo.",
    "auth/network-request-failed":  "Napaka v omrežju.",
    "auth/popup-blocked":           "Brskalnik je blokiral okno. Dovoli pojavna okna.",
    "auth/unauthorized-domain":     "Domena ni pooblaščena v Firebase konzoli.",
    "auth/popup-closed-by-user":    null,
    "auth/cancelled-popup-request": null,
  };
  if (code in map) return map[code];
  return "Napaka pri prijavi. Poskusi znova.";
}
