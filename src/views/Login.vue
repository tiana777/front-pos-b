<template>
<div class="text-gray-900 flex justify-center">
    <div class="max-w-screen-xl m-0 sm:m-10 bg-white shadow sm:rounded-lg flex justify-center flex-1">
        <div class="lg:w-1/2 xl:w-5/12 p-6 sm:p-12 bg-red-500 rounded-l-lg">
            <div>
                <img src="../assets/new-logo.png"
                    class="w-32 mx-auto" />
            </div>
            <div class="mt-12 flex flex-col items-center">
                <h1 class="text-2xl xl:text-3xl text-gray-100 font-extrabold">
                    Connexion
                </h1>
                <div class="w-full flex-1 mt-8">
                    <div class="mx-auto max-w-xs">
                        <input
                            ref="emailInput"
                            v-model="email" placeholder="Entrez votre identifiant"
                            class="w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white"
                            type="email"
                             @focus="showKeyboard('email')" />
                        <input
                            ref="passwordInput"
                            type="password" v-model="password"
                            class="w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white mt-5"
                            placeholder="Mot de passe"
                            @focus="showKeyboard('password')" />
                        <button
                            class="mt-5 tracking-wide font-semibold bg-gray-500 text-gray-100 w-full py-4 rounded-lg hover:bg-gray-700 transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none"
                            @click="login">
                            <span class="ml-3">
                                Se connecter
                            </span>
                        </button>

                        <p v-if="error" class="has-text-danger mt-3 has-text-centered">{{ error }}</p>
                        <p class="mt-6 text-xs text-gray-600 text-center">
                            I agree to abide by templatana's
                            <a href="#" class="border-b border-gray-500 border-dotted">
                                Terms of Service
                            </a>
                            and its
                            <a href="#" class="border-b border-gray-500 border-dotted">
                                Privacy Policy
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
        <div class="flex-1 text-center hidden lg:flex">
            <div class="m-12 xl:m-16 w-full bg-[url('../assets/logoigp.jpg')] bg-cover bg-center bg-no-repeat">
            </div>
        </div>
    </div>
</div>
<Keyboard v-if="keyboardVisible" @key-pressed="handleKeyPress" />


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
      const userRoles = response.data.user.roles || []
      const isAdmin = userRoles.includes('admin')
      const redirectPath = isAdmin ? '/direct' : (localStorage.getItem('last_visited_url') || '/cash-printer')
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
.round {
  border-top-left-radius: 1rem;
  border-bottom-left-radius: 1rem;
}
</style>
