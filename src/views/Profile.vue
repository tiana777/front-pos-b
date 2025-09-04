<template>

  <nav class="fixed inset-x-0 top-0 z-50 flex justify-end bg-gray-100 px-4 py-2 shadow">
    <div class="relative group">
      <a class="inline-flex cursor-default items-center gap-2 px-2 py-1 font-semibold text-gray-800">
        <i class="fas fa-user-circle"></i>
        {{ user.name }}
      </a>
      <div class="absolute right-0 mt-2 hidden w-48 rounded border bg-white shadow group-hover:block">
        <a class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          <i class="fas fa-user mr-2"></i> Profil
        </a>
        <a class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          <i class="fas fa-cog mr-2"></i> Paramètres
        </a>
        <div class="my-1 border-t"></div>
        <a class="block px-4 py-2 text-sm text-red-600 hover:bg-red-50" @click="logout">
          <i class="fas fa-sign-out-alt mr-2"></i> Déconnexion
        </a>
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
  localStorage.removeItem('user');

  window.location.href = '/';
}

onMounted(fetchUserProfile)
</script>

<style scoped>
</style>
