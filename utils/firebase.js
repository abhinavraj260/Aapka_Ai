import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDeLAF3vikM9pJxNd0tQoYlUFnKzuLpAXU",
  authDomain: "ai-assistant-3fb35.firebaseapp.com",
  projectId: "ai-assistant-3fb35",
  storageBucket: "ai-assistant-3fb35.firebasestorage.app",
  messagingSenderId: "966342779720",
  appId: "1:966342779720:web:f014bdbbadfbe2b084897d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };