// ── Elements ─────────────────────────────────────────
// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

// Init
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// UI
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const successMsg = document.getElementById('successMsg');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const googleBtn = document.getElementById('googleBtn');

// 🔐 LOGIN
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  emailError.classList.remove('show');
  passwordError.classList.remove('show');

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email) {
    emailError.textContent = "Enter email";
    emailError.classList.add('show');
    return;
  }

  if (!password) {
    passwordError.textContent = "Enter password";
    passwordError.classList.add('show');
    return;
  }

  try {
    const userCred = await auth.signInWithEmailAndPassword(email, password);

    // Save user
    await db.collection("users").doc(userCred.user.uid).set({
      email: email,
      lastLogin: new Date()
    }, { merge: true });

    successMsg.classList.add('show');

  } catch (err) {
    emailError.textContent = err.message;
    emailError.classList.add('show');
  }
});

// 🆕 SIGNUP (auto if user not found)
async function signUp(email, password) {
  return await auth.createUserWithEmailAndPassword(email, password);
}

// 🔵 GOOGLE LOGIN
googleBtn.addEventListener('click', async () => {
  const provider = new firebase.auth.GoogleAuthProvider();

  try {
    await auth.signInWithPopup(provider);
    successMsg.classList.add('show');
  } catch (err) {
    emailError.textContent = err.message;
    emailError.classList.add('show');
  }
});

// 💾 Store command example
auth.onAuthStateChanged(async (user) => {
  if (!user) return;

  await db.collection("commands").add({
    uid: user.uid,
    command: "voice example",
    timestamp: new Date()
  });
});