<template>
  <div style="position: relative;">
    <Profile />
  </div>
  <div class="px-4 pt-20">
    <div class="rounded-lg bg-white p-4 shadow">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-black">Rôle</h2>
        <router-link
          to="/roles/create"
          class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <font-awesome-icon icon="plus" />
          <span>Nouveau</span>
        </router-link>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-0 bg-white text-left text-sm">
          <thead>
            <tr>
              <th class="border-b px-3 py-2 text-black">ID</th>
              <th class="border-b px-3 py-2 text-black">Name</th>
              <th class="border-b px-3 py-2 text-black">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in roles" :key="role.id" class="hover:bg-slate-50">
              <td class="px-3 py-2 text-black">{{ role.id }}</td>
              <td class="px-3 py-2 text-black">{{ role.name }}</td>
              <td class="px-3 py-2 text-black">
                <div class="flex items-center gap-2">
                  <router-link
                    :to="`/roles/${role.id}/edit`"
                    class="inline-flex items-center justify-center rounded-md bg-yellow-500 px-2.5 py-1.5 text-white hover:bg-yellow-600"
                    title="Éditer"
                  >
                    <font-awesome-icon icon="pencil" />
                  </router-link>
                  <button
                    @click="deleteRole(role.id)"
                    class="inline-flex items-center justify-center rounded-md bg-red-600 px-2.5 py-1.5 text-white hover:bg-red-700"
                    title="Supprimer"
                  >
                    <font-awesome-icon icon="trash" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import roleService from '@/services/roleService'
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
