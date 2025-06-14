<template>
    <section class="hero is-fullheight custom-background">
        <div class="hero-body">
            <div class="container">
                <div class="box login-box">
                    <h1 class="title has-text-centered">Connexion</h1>

                    <div class="field">
                        <label class="label">Nom d'utilisateur</label>
                        <div class="control">
                            <input ref="emailInput" class="input" type="email" v-model="email"
                                placeholder="Entrez votre identifiant" @focus="showKeyboard('email')" />
                        </div>
                    </div>

                    <div class="field">
                        <label class="label">Mot de passe</label>
                        <div class="control">
                            <input ref="passwordInput" class="input" type="password" v-model="password"
                                placeholder="Mot de passe" @focus="showKeyboard('password')" />
                        </div>
                    </div>

                    <div class="field mt-4">
                        <button class="button is-dark is-fullwidth" @click="login">Se connecter</button>
                    </div>

                    <p v-if="error" class="has-text-danger mt-3 has-text-centered">{{ error }}</p>
                </div>
            </div>
        </div>

        <!-- clavier virtuel -->
        <Keyboard v-if="keyboardVisible" @key-pressed="handleKeyPress" />
    </section>
</template>

<script setup>
import { ref } from 'vue'
import Keyboard from '../components/tools/Keyboard.vue'
import axios from 'axios'
import { onMounted } from 'vue'
const email = ref('')
const password = ref('')
const error = ref('')
const keyboardVisible = ref(false)
const activeField = ref(null)
const user = ref(null); // Réactive user state

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
            // Stockage des informations
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

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

    if (token) {
        // Tente de récupérer l'URL précédente ou redirige vers /dashboard par défaut
        const lastVisited = localStorage.getItem('last_visited_url') || '/direct'
        window.location.href = lastVisited
    }
})

</script>

<style scoped>
.custom-background {
    background-color: #ff0606;
    min-height: 100vh;
}

.login-box {
    max-width: 400px;
    margin: auto;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
}
</style>