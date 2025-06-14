<template>
    <nav class="navbar">
        <div class="navbar-end">
            <div class="navbar-item has-dropdown is-hoverable">
                <a class="navbar-link">
                    <span class="icon">
                        <i class="fas fa-user-circle"></i>
                    </span>
                    {{ user.name }}
                </a>

                <div class="navbar-dropdown is-right">
                    <a class="navbar-item">
                        <i class="fas fa-user"></i> Profil
                    </a>
                    <a class="navbar-item">
                        <i class="fas fa-cog"></i> Paramètres
                    </a>
                    <hr class="navbar-divider">
                    <a class="navbar-item has-text-danger" @click="logout">
                        <i class="fas fa-sign-out-alt"></i> Déconnexion
                    </a>
                </div>
            </div>
        </div>
    </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const user = ref({ name: '', email: '', point_of_sale_name: '' })

const fetchUserProfile = async () => {
    try {
        const token = localStorage.getItem('token')

        const response = await axios.get('http://127.0.0.1:8000/api/me', {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
        user.value = response.data.user
    } catch (error) {
        console.error('Erreur lors du chargement du profil:', error)
    }
}

const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
}

onMounted(fetchUserProfile)
</script>

<style scoped>
.navbar {
    display: flex;
    justify-content: flex-end;
    padding: 10px;
    background: #f5f5f5;
}

.navbar-link {
    font-size: 16px;
    font-weight: bold;
    padding: 10px;
}

.icon {
    margin-right: 5px;
}

.has-dropdown:hover .navbar-dropdown {
    display: block;
}

.navbar-item.has-text-danger {
    color: red;
}
</style>
