// ── Elements ─────────────────────────────────────────
// 🔥 Firebase Config - REPLACE WITH YOUR ACTUAL CREDENTIALS
const firebaseConfig = {
  apiKey: "AIzaSyDVPfajXYZ_your_firebase_key_here",
  authDomain: "aapka-ai.firebaseapp.com",
  projectId: "aapka-ai",
  storageBucket: "aapka-ai.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};

// Init Firebase (with error handling for fallback)
let firebase_ready = false;
try {
  firebase.initializeApp(firebaseConfig);
  firebase_ready = true;
} catch (err) {
  console.warn('Firebase not available, using fallback auth');
}

const auth = firebase_ready ? firebase.auth() : null;
const db = firebase_ready ? firebase.firestore() : null;

// UI Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const successMsg = document.getElementById('successMsg');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const googleBtn = document.getElementById('googleBtn');
const loginBtn = document.querySelector('.login-btn');
const togglePasswordBtn = document.getElementById('togglePassword');

// ── Password Toggle ────────────────────────────────────────────
togglePasswordBtn?.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  togglePasswordBtn.textContent = type === 'password' ? '👁' : '👁‍🗨';
});

// ── Email/Mobile Validation ────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidMobile(mobile) {
  return /^\d{10,12}$/.test(mobile.replace(/\D/g, ''));
}

// ── 🔐 LOGIN ───────────────────────────────────────────────────
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  emailError.classList.remove('show');
  passwordError.classList.remove('show');

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email) {
    emailError.textContent = "Enter email or mobile";
    emailError.classList.add('show');
    return;
  }

  if (!password) {
    passwordError.textContent = "Enter password";
    passwordError.classList.add('show');
    return;
  }

  if (!isValidEmail(email) && !isValidMobile(email)) {
    emailError.textContent = "Invalid email or mobile number";
    emailError.classList.add('show');
    return;
  }

  if (password.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters";
    passwordError.classList.add('show');
    return;
  }

  loginBtn.classList.add('loading');
  loginBtn.disabled = true;
  loginBtn.textContent = '🔄 Signing in...';

  try {
    if (firebase_ready && auth) {
      // Try Firebase first
      try {
        const userCred = await auth.signInWithEmailAndPassword(email, password);

        // Save user data to Firestore
        if (db) {
          await db.collection("users").doc(userCred.user.uid).set({
            email: email,
            lastLogin: new Date(),
            loginMethod: 'email'
          }, { merge: true });
        }

        successMsg.classList.add('show');
        setTimeout(() => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) chrome.tabs.closeWindow(tabs[0].windowId);
          });
        }, 1500);
      } catch (firebaseErr) {
        throw firebaseErr;
      }
    } else {
      // Fallback: Use custom backend
      throw new Error('Firebase not configured. Please set up your Firebase credentials in config.');
    }
  } catch (err) {
    emailError.textContent = err.message || 'Login failed. Try again.';
    emailError.classList.add('show');
    console.error('Login error:', err);
  } finally {
    loginBtn.classList.remove('loading');
    loginBtn.disabled = false;
    loginBtn.textContent = '🚀 SIGN IN WITH VOICE';
  }
});

// ── 🆕 SIGNUP ──────────────────────────────────────────────────
async function signUp(email, password) {
  if (!firebase_ready || !auth) {
    throw new Error('Firebase not available');
  }
  return await auth.createUserWithEmailAndPassword(email, password);
}

// ── 🔵 GOOGLE LOGIN ────────────────────────────────────────────
googleBtn.addEventListener('click', async () => {
  if (!firebase_ready || !auth) {
    alert('Google login not available. Please check Firebase configuration.');
    return;
  }

  const provider = new firebase.auth.GoogleAuthProvider();
  googleBtn.disabled = true;
  googleBtn.textContent = '🔄 Signing in...';

  try {
    const result = await auth.signInWithPopup(provider);
    
    if (db) {
      await db.collection("users").doc(result.user.uid).set({
        email: result.user.email,
        name: result.user.displayName,
        photoURL: result.user.photoURL,
        lastLogin: new Date(),
        loginMethod: 'google'
      }, { merge: true });
    }

    successMsg.textContent = '✅ Google login successful!';
    successMsg.classList.add('show');
    
    setTimeout(() => window.close(), 1500);
  } catch (err) {
    emailError.textContent = err.message;
    emailError.classList.add('show');
  } finally {
    googleBtn.disabled = false;
    googleBtn.textContent = '🔵 Google';
  }
});

// ── GitHub Login (Future) ──────────────────────────────────────
const githubBtn = document.getElementById('githubBtn');
if (githubBtn) {
  githubBtn.addEventListener('click', () => {
    alert('GitHub login coming soon! Set up OAuth in Firebase.');
  });
}

// ── 💾 Store Commands ──────────────────────────────────────────
if (firebase_ready && auth) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) return;

    // Log successful login
    if (db) {
      await db.collection("auth_logs").add({
        uid: user.uid,
        email: user.email,
        event: 'login',
        timestamp: new Date(),
        userAgent: navigator.userAgent
      }).catch(err => {
        console.log('Could not log auth event');
      });
    }
  });
}

// ── Auto-fill Demo (for testing) ───────────────────────────────
// Uncomment to enable demo mode
/*
emailInput.value = 'demo@example.com';
passwordInput.value = 'demo123456';
*/
