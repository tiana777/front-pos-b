<template>
  <section class="hero is-fullheight custom-background">
    <div class="hero-body">
      <div class="container">
        <div class="box login-box">
          <div class="is-flex is-align-items-center is-justify-content-space-between">
            <button class="button is-light" @click="goBack">
              <font-awesome-icon icon="arrow-left" class="me-2" />
              Retour
            </button>
            <h1 class="title has-text-centered mb-0">Modifier l'Utilisateur</h1>
            <div style="width: 100px;"></div> <!-- Spacer for centering -->
          </div>

          <div v-if="loading" class="has-text-centered">
            <div class="button is-loading is-large is-text">Chargement...</div>
          </div>

          <div v-else>
            <div class="field">
              <label class="label">Nom d'utilisateur</label>
              <div class="control">
                <input class="input" type="text" v-model="user.name" placeholder="Entrez le nom" required
                  :class="{ 'is-danger': errors.name }" />
                <p v-if="errors.name" class="help is-danger">{{ errors.name }}</p>
              </div>
            </div>

            <div class="field">
              <label class="label">Email</label>
              <div class="control">
                <input class="input" type="email" v-model="user.email" placeholder="Entrez l'email" required
                  :class="{ 'is-danger': errors.email }" />
                <p v-if="errors.email" class="help is-danger">{{ errors.email }}</p>
              </div>
            </div>

            <div class="field">
              <label class="label">Mot de passe</label>
              <div class="control">
                <input class="input" type="password" v-model="user.password"
                  placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)"
                  :class="{ 'is-danger': errors.password }" />
                <p v-if="errors.password" class="help is-danger">{{ errors.password }}</p>
              </div>
            </div>

            <div class="field">
              <label class="label">Confirmer le mot de passe</label>
              <div class="control">
                <input class="input" type="password" v-model="user.password_confirmation"
                  placeholder="Confirmez le mot de passe" :class="{ 'is-danger': errors.password_confirmation }" />
                <p v-if="errors.password_confirmation" class="help is-danger">{{ errors.password_confirmation }}</p>
              </div>
            </div>

            <div class="field">
              <label class="label">Rôle</label>
              <div class="control">
                <div class="select is-fullwidth" :class="{ 'is-danger': errors.role }">
                  <select v-model="user.role">
                    <option value="">Sélectionner un rôle</option>
                    <option v-for="role in roles" :key="role.id" :value="role.name">
                      {{ role.name }}
                    </option>
                  </select>
                </div>
                <p v-if="errors.role" class="help is-danger">{{ errors.role }}</p>
              </div>
            </div>

            <div class="field">
              <label class="label">Point de vente</label>
              <div class="control">
                <div class="select is-fullwidth" :class="{ 'is-danger': errors.point_of_sale_id }">
                  <select v-model="user.point_of_sale_id">
                    <option value="">Sélectionner un point de vente</option>
                    <option v-for="pos in pointsOfSale" :key="pos.id" :value="pos.id">
                      {{ pos.name }}
                    </option>
                  </select>
                </div>
                <p v-if="errors.point_of_sale_id" class="help is-danger">{{ errors.point_of_sale_id }}</p>
              </div>
            </div>

            <div class="field mt-4">
              <button class="button is-dark is-fullwidth" @click="updateUser" :disabled="loading || !isFormValid"
                :class="{ 'is-loading': loading }">
                Mettre à jour
              </button>
            </div>

            <div class="field">
              <button class="button is-light is-fullwidth" @click="resetForm" :disabled="loading">
                Réinitialiser
              </button>
            </div>

            <div v-if="error" class="notification is-danger mt-3">
              <button class="delete" @click="error = ''"></button>
              {{ error }}
            </div>

            <div v-if="success" class="notification is-success mt-3">
              <button class="delete" @click="success = ''"></button>
              {{ success }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import userService from '@/services/userService'
import roleService from '@/services/roleService'
import pointOfSaleService from '@/services/pointOfSaleService'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const user = ref({
  id: null,
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: '',
  point_of_sale_id: null
})

const roles = ref([])
const pointsOfSale = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const originalUser = ref({})

const errors = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: '',
  point_of_sale_id: ''
})

const loadUser = async () => {
  loading.value = true
  error.value = ''

  try {
    const userId = route.params.id
    const [userResponse, rolesResponse, userRolesResponse] = await Promise.all([
      userService.getUser(userId),
      roleService.getAll(),
      userService.getRoles(userId)
    ])

    user.value = { ...userResponse.data, password: '', password_confirmation: '' }
    originalUser.value = { ...userResponse.data }
    roles.value = rolesResponse.data

    // Set the current role based on user's existing roles
    if (userRolesResponse.data && userRolesResponse.data.length > 0) {
      user.value.role = userRolesResponse.data[0].name
    }

    // Load points of sale
    const posResponse = await pointOfSaleService.getAll()
    pointsOfSale.value = posResponse.data || posResponse

  } catch (err) {
    error.value = 'Erreur lors du chargement des données.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const validateForm = () => {
  errors.value = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: '',
    point_of_sale_id: ''
  }

  let isValid = true

  if (!user.value.name.trim()) {
    errors.value.name = 'Le nom est requis'
    isValid = false
  }

  if (!user.value.email.trim()) {
    errors.value.email = 'L\'email est requis'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.value.email)) {
    errors.value.email = 'L\'email n\'est pas valide'
    isValid = false
  }

  if (user.value.password && user.value.password.length < 6) {
    errors.value.password = 'Le mot de passe doit contenir au moins 6 caractères'
    isValid = false
  }

  if (user.value.password !== user.value.password_confirmation) {
    errors.value.password_confirmation = 'Les mots de passe ne correspondent pas'
    isValid = false
  }

  if (!user.value.role) {
    errors.value.role = 'Le rôle est requis'
    isValid = false
  }

  return isValid
}

const isFormValid = computed(() => {
  return user.value.name.trim() &&
    user.value.email.trim() &&
    user.value.role &&
    (user.value.password === user.value.password_confirmation)
})

const updateUser = async () => {
  if (!validateForm()) return

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    // Update user basic info
    const updateData = {
      id: user.value.id,
      name: user.value.name,
      email: user.value.email,
      point_of_sale_id: user.value.point_of_sale_id
    }

    // Only include password if provided
    if (user.value.password) {
      updateData.password = user.value.password
      updateData.password_confirmation = user.value.password_confirmation
    }

    await userService.update(updateData)

    // Assign role if provided
    if (user.value.role) {
      await userService.assignRole(user.value.id, user.value.role)
    }

    success.value = 'Utilisateur mis à jour avec succès!'

    // Redirect after 2 seconds
    setTimeout(() => {
      router.push('/users')
    }, 2000)

  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de la mise à jour de l\'utilisateur.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  user.value = { ...originalUser.value, password: '', password_confirmation: '' }
  errors.value = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: '',
    point_of_sale_id: ''
  }
  error.value = ''
  success.value = ''
}

const goBack = () => {
  router.push('/users')
}

onMounted(loadUser)
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

.notification {
  border-radius: 8px;
}

.select select {
  border-radius: 8px;
}
</style>
