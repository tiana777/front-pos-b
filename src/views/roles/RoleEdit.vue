<template>
  <div class="container is-fluid mt-5 role-management-page">
    <div class="columns is-centered">
      <div class="column is-10-desktop is-12-mobile">
        <div class="card">
          <header class="card-header has-background-primary-light">
            <div class="card-header-title is-flex is-align-items-center">
              <span class="icon has-text-primary mr-3">
                <font-awesome-icon icon="user-cog" size="lg" />
              </span>
              <span>Modifier le Rôle</span>
            </div>
          </header>

          <div class="card-content">
            <!-- Loading State -->
            <div v-if="loading" class="has-text-centered py-6">
              <div class="button is-loading is-large is-primary is-outlined"></div>
              <p class="mt-3 has-text-black">Chargement du rôle...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="notification is-danger">
              <button class="delete" @click="error = null"></button>
              <span class="icon">
                <font-awesome-icon icon="exclamation-triangle" />
              </span>
              {{ error }}
            </div>

            <!-- Content -->
            <div v-else-if="role" class="content">
              <!-- Role Name Form -->
              <div class="box">
                <h3 class="title is-4 has-text-primary">
                  <span class="icon">
                    <font-awesome-icon icon="tag" />
                  </span>
                  Informations du rôle
                </h3>

                <div class="field">
                  <label class="label">Nom du rôle</label>
                  <div class="control has-icons-left">
                    <input v-model="role.name" type="text" class="input" :class="{ 'is-danger': role.name === 'admin' }"
                      :disabled="role.name === 'admin'" placeholder="Entrez le nom du rôle">
                    <span class="icon is-small is-left">
                      <font-awesome-icon icon="tag" />
                    </span>
                  </div>
                  <p v-if="role.name === 'admin'" class="help is-warning">
                    <span class="icon is-small">
                      <font-awesome-icon icon="lock" />
                    </span>
                    Le nom du rôle admin ne peut pas être modifié
                  </p>
                </div>

                <div class="field is-grouped">
                  <div class="control">
                    <button @click="updateRole" class="button is-primary" :class="{ 'is-loading': isSaving }"
                      :disabled="isSaving || role.name === 'admin'">
                      <span class="icon">
                        <font-awesome-icon icon="save" />
                      </span>
                      <span>{{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Current Permissions -->
              <div class="box">
                <h3 class="title is-4 has-text-info">
                  <span class="icon">
                    <font-awesome-icon icon="shield-alt" />
                  </span>
                  Permissions actuelles
                </h3>

                <div v-if="role.permissions && role.permissions.length > 0" class="tags are-medium">
                  <span v-for="permission in role.permissions" :key="permission.id"
                    class="tag is-info is-light is-rounded">
                    <span class="icon is-small">
                      <font-awesome-icon icon="check-circle" />
                    </span>
                    <span>{{ permission.name }}</span>
                    <button @click="revokePermission(permission.id)" class="delete is-small ml-2"
                      :disabled="isRevoking"></button>
                  </span>
                </div>

                <div v-else class="notification is-light">
                  <span class="icon">
                    <font-awesome-icon icon="info-circle" />
                  </span>
                  Aucune permission associée à ce rôle
                </div>
              </div>

              <!-- Add Permission -->
              <div class="box">
                <h3 class="title is-4 has-text-success">
                  <span class="icon">
                    <font-awesome-icon icon="plus-circle" />
                  </span>
                  Ajouter une permission
                </h3>

                <div class="field has-addons">
                  <div class="control is-expanded">
                    <div class="select is-fullwidth">
                      <select v-model="selectedPermission" :disabled="isAssigning">
                        <option value="" disabled>Sélectionnez une permission</option>
                        <option v-for="permission in availablePermissions" :key="permission.id"
                          :value="permission.name">
                          {{ permission.name }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="control">
                    <button @click="assignPermission" class="button is-success" :class="{ 'is-loading': isAssigning }"
                      :disabled="!selectedPermission || isAssigning">
                      <span class="icon">
                        <font-awesome-icon icon="plus" />
                      </span>
                      <span>Ajouter</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="field is-grouped is-grouped-right">
                <div class="control">
                  <router-link to="/roles" class="button is-light">
                    <span class="icon">
                      <font-awesome-icon icon="arrow-left" />
                    </span>
                    <span>Retour</span>
                  </router-link>
                </div>
                <div class="control">
                  <button @click="deleteRole" class="button is-danger" :class="{ 'is-loading': isDeleting }"
                    :disabled="isDeleting || role.name === 'admin'">
                    <span class="icon">
                      <font-awesome-icon icon="trash" />
                    </span>
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import roleService from '@/services/roleService'
import permissionService from '@/services/permissionService'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

export default {
  name: 'RoleEdit',
  components: {
    FontAwesomeIcon
  },
  setup() {
    const router = useRouter()
    const route = useRoute()

    const role = ref(null)
    const availablePermissions = ref([])
    const selectedPermission = ref('')
    const loading = ref(true)
    const error = ref(null)
    const isSaving = ref(false)
    const isAssigning = ref(false)
    const isRevoking = ref(false)
    const isDeleting = ref(false)

    const fetchRole = async () => {
      try {
        loading.value = true
        const response = await roleService.getById(route.params.id)
        role.value = response.data
      } catch (err) {
        console.error('Erreur lors de la récupération du rôle:', err)
        error.value = 'Impossible de charger le rôle. Veuillez réessayer.'
      } finally {
        loading.value = false
      }
    }

    const fetchAvailablePermissions = async () => {
      try {
        const response = await permissionService.getAll()
        // Filter out permissions already assigned to this role
        if (role.value && role.value.permissions) {
          availablePermissions.value = response.data.filter(permission => {
            return !role.value.permissions.some(p => p.id === permission.id)
          })
        } else {
          availablePermissions.value = response.data
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des permissions:', err)
      }
    }

    const updateRole = async () => {
      if (role.value.name === 'admin') {
        error.value = "Le rôle admin ne peut pas être modifié"
        return
      }

      try {
        isSaving.value = true
        await roleService.update(role.value.id, { name: role.value.name })
        // Show success message (you can use a toast library here)
        console.log('Rôle mis à jour avec succès')
      } catch (err) {
        console.error('Erreur lors de la mise à jour du rôle:', err)
        error.value = err.response?.data?.error || 'Erreur lors de la mise à jour'
      } finally {
        isSaving.value = false
      }
    }

    const assignPermission = async () => {
      if (!selectedPermission.value) return

      try {
        isAssigning.value = true
        await roleService.assignPermission(role.value.id, selectedPermission.value)

        // Refresh data
        await fetchRole()
        await fetchAvailablePermissions()

        selectedPermission.value = ''
        console.log('Permission ajoutée avec succès')
      } catch (err) {
        console.error('Erreur lors de l\'ajout de la permission:', err)
        error.value = err.response?.data?.error || 'Erreur lors de l\'ajout'
      } finally {
        isAssigning.value = false
      }
    }

    const revokePermission = async (permissionId) => {
      try {
        isRevoking.value = true
        await roleService.revokePermission(role.value.id, permissionId)

        // Refresh data
        await fetchRole()
        await fetchAvailablePermissions()

        console.log('Permission retirée avec succès')
      } catch (err) {
        console.error('Erreur lors du retrait de la permission:', err)
        error.value = err.response?.data?.error || 'Erreur lors du retrait'
      } finally {
        isRevoking.value = false
      }
    }

    const deleteRole = async () => {
      if (role.value.name === 'admin') {
        error.value = "Le rôle admin ne peut pas être supprimé"
        return
      }

      if (!confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${role.value.name}"?`)) {
        return
      }

      try {
        isDeleting.value = true
        await roleService.delete(role.value.id)
        console.log('Rôle supprimé avec succès')
        router.push('/roles')
      } catch (err) {
        console.error('Erreur lors de la suppression du rôle:', err)
        if (err.response?.status === 403) {
          error.value = "Ce rôle est encore attribué à des utilisateurs et ne peut être supprimé"
        } else {
          error.value = err.response?.data?.error || 'Erreur lors de la suppression'
        }
      } finally {
        isDeleting.value = false
      }
    }

    onMounted(async () => {
      await fetchRole()
      await fetchAvailablePermissions()
    })

    return {
      role,
      availablePermissions,
      selectedPermission,
      loading,
      error,
      isSaving,
      isAssigning,
      isRevoking,
      isDeleting,
      fetchRole,
      fetchAvailablePermissions,
      updateRole,
      assignPermission,
      revokePermission,
      deleteRole
    }
  }
}
</script>

<style scoped>
/* Additional responsive styles */
@media screen and (max-width: 768px) {
  .container {
    padding: 0.5rem;
  }

  .card-content {
    padding: 5rem;
  }

  .box {
    padding: 1.5rem;
  }

  .field.has-addons {
    flex-direction: column;
  }

  .field.has-addons .control {
    width: 100%;
  }

  .field.is-grouped {
    flex-direction: column;
    gap: 0.5rem;
  }

  .field.is-grouped .control {
    width: 100%;
  }
}

@media screen and (max-width: 480px) {
  .tags {
    justify-content: center;
  }

  .tag {
    font-size: 0.8rem;
  }
}
</style>
