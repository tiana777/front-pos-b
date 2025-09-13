<template>
<nav class=" fixed top-0 bg-white border-gray-200 w-full left-0 z-50 shadow-md">
  <div class="max-w-screen-xl flex flex-wrap  justify-between mx-auto p-3">
    <img src="../assets/new-logo.png" class="h-8" />
  <div class="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
      <button type="button" class="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300" id="user-menu-button" aria-expanded="false" data-dropdown-toggle="user-dropdown" data-dropdown-placement="bottom">
        <span class="sr-only">Open user menu</span>
        <img class="w-8 h-8 rounded-full" src="../assets/avatar.png" alt="user photo">
      </button>
      <!-- Dropdown menu -->
      <div class="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow-sm" id="user-dropdown">
        <div class="px-4 py-3">
          <span class="block text-sm text-gray-90">{{ user.name }}</span>
          <span class="block text-sm  text-gray-500 truncate">{{ user.email }}</span>
        </div>
        <ul class="py-2" aria-labelledby="user-menu-button">
          <li>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ">Dashboard</a>
          </li>
          <li>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
          </li>
          <li>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Earnings</a>
          </li>
          <li>
            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" @click="logout">Deconnexion</a>
          </li>
        </ul>
      </div>
      <button data-collapse-toggle="navbar-user" type="button" class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200" aria-controls="navbar-user" aria-expanded="false">
        <span class="sr-only">Open main menu</span>
        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h15M1 7h15M1 13h15"/>
        </svg>
    </button>
  </div>
  <div class="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="navbar-user">
  </div>
  </div>
</nav>

</template>

<script setup>
defineOptions({ name: 'UserProfile' })
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
