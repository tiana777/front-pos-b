<template>
  <section class="hero is-fullheight custom-background">
    <div class="hero-body">
      <div class="container">
        <div class="box login-box">
          <h1 class="title has-text-centered">Connexion</h1>

          <div class="field">
            <label class="label">Nom d'utilisateur</label>
            <div class="control">
              <input ref="emailInput" class="input" type="email" v-model="email" placeholder="Entrez votre identifiant"
                @focus="showKeyboard('email')" />
            </div>
          </div>

          <div class="field">
            <label class="label">Mot de passe</label>
            <div class="control">
              <input ref="passwordInput" class="input" type="password" v-model="password" placeholder="Mot de passe"
                @focus="showKeyboard('password')" />
            </div>
          </div>

          <div class="field mt-4">
            <button class="button is-dark is-fullwidth" @click="login">Se connecter</button>
          </div>

          <p v-if="error" class="has-text-danger mt-3 has-text-centered">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Clavier virtuel -->
    <Keyboard v-if="keyboardVisible" @key-pressed="handleKeyPress" />
  </section>
</template>

<script setup>
defineOptions({ name: 'LoginPage' })
import { ref } from 'vue'
import Keyboard from '../components/tools/Keyboard.vue'
import axios from 'axios'
import { onMounted } from 'vue'

const email = ref('')
const password = ref('')
const error = ref('')
const keyboardVisible = ref(false)
const activeField = ref(null)
const user = ref(null)

const login = async () => {
  error.value = '';

  if (!email.value || !password.value) {
    error.value = "Veuillez entrer votre identifiant et mot de passe.";
    return;
  }

  try {
    const response = await axios.post('http://127.0.0.1:8000/api/login', {
      email: email.value,
      password: password.value
    });

    if (response.data.token && response.data.user) {
      // Durée de vie des cookies : 60 minutes (en millisecondes)
      const expirationTime = 60 * 60 * 1000; // 60 minutes
      const expirationDate = new Date().getTime() + expirationTime;

      // Stockage des informations avec expiration
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('token_expiration', expirationDate.toString());
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('user_expiration', expirationDate.toString());

      // Mise à jour du state
      user.value = response.data.user;

      // Redirection
      const redirectPath = localStorage.getItem('last_visited_url') || '/cash-printer';
      window.location.href = redirectPath;
    } else {
      error.value = "Réponse du serveur invalide";
    }
  } catch (err) {
    if (err.response?.status === 401) {
      error.value = "Identifiants incorrects";
    } else {
      error.value = "Erreur de connexion au serveur";
    }
  }
};

// Fonction pour récupérer l'utilisateur au chargement de l'app
const initUser = () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
  }
};

// Appeler initUser au démarrage de l'application
initUser();

function showKeyboard(field) {
  activeField.value = field
  keyboardVisible.value = true
}

function handleKeyPress(key) {
  if (key === 'BACKSPACE') {
    if (activeField.value === 'email') email.value = email.value.slice(0, -1)
    if (activeField.value === 'password') password.value = password.value.slice(0, -1)
  } else {
    if (activeField.value === 'email') email.value += key
    if (activeField.value === 'password') password.value += key
  }
}

onMounted(() => {
  const token = localStorage.getItem('token')
  const tokenExpiration = localStorage.getItem('token_expiration')

  // Vérifier si le token a expiré
  if (token && tokenExpiration) {
    const currentTime = new Date().getTime()
    if (currentTime > parseInt(tokenExpiration)) {
      // Token expiré, nettoyer le localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('token_expiration')
      localStorage.removeItem('user')
      localStorage.removeItem('user_expiration')
      return
    }

    // Tente de récupérer l'URL précédente ou redirige vers /direct par défaut
    const lastVisited = localStorage.getItem('last_visited_url') || '/direct'
    window.location.href = lastVisited
  }
})
</script>

<style scoped>
.custom-background {
  background: linear-gradient(135deg, #ff7e5f, #feb47b);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-box {
  max-width: 400px;
  margin: auto;
  padding: 2rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.title {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.label {
  color: #34495e;
  font-weight: 500;
}

.input {
  border-radius: 8px;
  border: 1px solid #ddd;
  padding: 12px 15px;
  transition: all 0.3s;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.input:focus {
  border-color: #4361ee;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
}

.button.is-dark {
  background: linear-gradient(to right, #2c3e50, #4a6582);
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.button.is-dark:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.has-text-danger {
  font-weight: 500;
  background: rgba(239, 71, 111, 0.1);
  padding: 10px;
  border-radius: 8px;
}
</style>
