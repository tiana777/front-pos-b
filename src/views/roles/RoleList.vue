<template>
  <div style="position: relative;">
    <Pos />
    <Profile />
  </div>
  <div class="container mt-4 role-management-page" style=" padding-top: 80px;">
    <div class="box has-background-white">
      <div class="columns">
        <div class="column">
          <h2 class="title has-text-black">Rôle</h2>
        </div>
        <div class="column is-narrow">
          <router-link to="/roles/create" class="button is-primary">
            <span class="icon">
              <font-awesome-icon icon="plus" />
            </span>
            <span>Nouveau</span>
          </router-link>
        </div>
      </div>

      <table class="table is-fullwidth is-hoverable has-background-white">
        <thead>
          <tr>
            <th class="has-text-black">ID</th>
            <th class="has-text-black">Name</th>
            <th class="has-text-black">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in roles" :key="role.id">
            <td class="has-text-black">{{ role.id }}</td>
            <td class="has-text-black">{{ role.name }}</td>
            <td class="has-text-black">
              <div class="buttons are-small">
                <router-link :to="`/roles/${role.id}/edit`" class="button is-warning">
                  <span class="icon">
                    <font-awesome-icon icon="pencil" />
                  </span>
                </router-link>
                <button @click="deleteRole(role.id)" class="button is-danger">
                  <span class="icon">
                    <font-awesome-icon icon="trash" />
                  </span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import roleService from '@/services/roleService'
import Profile from '../Profile.vue'
import Pos from '../Pos.vue'
const router = useRouter()
const roles = ref([])

const fetchRoles = async () => {
  const response = await roleService.getAll()
  roles.value = response.data
}

const viewRole = (id) => {
  router.push(`/roles/${id}`)
}

const deleteRole = async (id) => {
  if (confirm('Supprimer ce rôle ?')) {
    await roleService.delete(id)
    fetchRoles()
  }
}

onMounted(fetchRoles)
</script>
