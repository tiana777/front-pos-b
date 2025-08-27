<template>
  <div class="user-create user-management-page">
    <div class="container is-fluid">
      <div class="columns is-centered">
        <div class="column is-12">
          <div class="card">
            <header class="card-header">
              <p class="card-header-title">
                <i class="fas fa-user-plus me-2"></i>
                Créer un Nouvel Utilisateur
              </p>
            </header>
            <div class="card-content">
              <form @submit.prevent="createUser">
                <div class="field">
                  <label class="label">Email *</label>
                  <div class="control">
                    <input v-model="user.email" class="input is-large" :class="{ 'is-danger': errors.email }"
                      type="email" placeholder="exemple@domaine.com" required />
                  </div>
                  <p v-if="errors.email" class="help is-danger">{{ errors.email }}</p>
                </div>

                <div class="field">
                  <label class="label">Nom complet *</label>
                  <div class="control">
                    <input v-model="user.name" class="input is-large" :class="{ 'is-danger': errors.name }" type="text"
                      placeholder="Jean Dupont" required />
                  </div>
                  <p v-if="errors.name" class="help is-danger">{{ errors.name }}</p>
                </div>

                <div class="field">
                  <label class="label">Mot de passe *</label>
                  <div class="control">
                    <input v-model="user.password" class="input is-large" :class="{ 'is-danger': errors.password }"
                      type="password" placeholder="Minimum 8 caractères" required />
                  </div>
                  <p v-if="errors.password" class="help is-danger">{{ errors.password }}</p>
                  <p class="help">Le mot de passe doit contenir au moins 8 caractères.</p>
                </div>

                <div class="field">
                  <label class="label">Confirmer le mot de passe *</label>
                  <div class="control">
                    <input v-model="user.password_confirmation" class="input is-large"
                      :class="{ 'is-danger': errors.password_confirmation }" type="password"
                      placeholder="Retapez votre mot de passe" required />
                  </div>
                  <p v-if="errors.password_confirmation" class="help is-danger">{{ errors.password_confirmation }}</p>
                  <p class="help">Veuillez retaper votre mot de passe pour confirmer qu'il est correct.</p>
                </div>

                <div class="field">
                  <label class="label">Point de vente *</label>
                  <div class="control">
                    <div class="select is-large is-fullwidth" :class="{ 'is-danger': errors.point_of_sale_id }">
                      <select v-model="user.point_of_sale_id" required :disabled="loadingPointsOfSale">
                        <option value="">Sélectionner un point de vente</option>
                        <option v-for="pos in pointsOfSale" :key="pos.id" :value="pos.id">
                          {{ pos.name }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <p v-if="errors.point_of_sale_id" class="help is-danger">{{ errors.point_of_sale_id }}</p>
                  <p v-if="loadingPointsOfSale" class="help">Chargement des points de vente...</p>
                </div>

                <div class="field is-grouped is-grouped-right">
                  <div class="control">
                    <router-link to="/users" class="button is-light is-large">
                      <i class="fas fa-arrow-left me-1"></i> Annuler
                    </router-link>
                  </div>
                  <div class="control">
                    <button type="submit" class="button is-primary is-large" :disabled="isCreating || !isFormValid">
                      <span v-if="isCreating">
                        <span class="icon">
                          <i class="fas fa-spinner fa-pulse"></i>
                        </span>
                        <span>Création...</span>
                      </span>
                      <span v-else>
                        <i class="fas fa-user-plus me-1"></i> Créer
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import userService from '@/services/userService'
import pointOfSaleService from '@/services/pointOfSaleService'

export default {
  name: 'UserCreate',
  data() {
    return {
      user: {
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        point_of_sale_id: null
      },
      errors: {},
      isCreating: false,
      pointsOfSale: [],
      loadingPointsOfSale: false
    }
  },
  computed: {
    isFormValid() {
      return this.user.email.trim() &&
        this.user.password.length >= 8 &&
        this.user.password === this.user.password_confirmation &&
        this.user.point_of_sale_id !== null
    }
  },
  async mounted() {
    await this.fetchPointsOfSale()
  },
  methods: {
    async fetchPointsOfSale() {
      this.loadingPointsOfSale = true
      try {
        const response = await pointOfSaleService.getAll()
        this.pointsOfSale = response.data || response
      } catch (error) {
        console.error('Erreur lors du chargement des points de vente:', error)
        this.errors.point_of_sale_id = 'Impossible de charger les points de vente'
      } finally {
        this.loadingPointsOfSale = false
      }
    },
    async createUser() {
      this.errors = {}

      // Validation name
      if (!this.user.name || this.user.name.trim().length === 0) {
        this.errors.name = 'Le nom est requis'
        return
      }

      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(this.user.email)) {
        this.errors.email = 'Veuillez entrer une adresse email valide'
        return
      }

      // Validation mot de passe
      if (this.user.password.length < 8) {
        this.errors.password = 'Le mot de passe doit contenir au moins 8 caractères'
        return
      }

      // Validation confirmation
      if (this.user.password !== this.user.password_confirmation) {
        this.errors.password_confirmation = 'Les mots de passe ne correspondent pas'
        return
      }

      try {
        this.isCreating = true
        await userService.create(this.user)
        this.$router.push('/users')
      } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error)
        if (error.response?.data?.errors) {
          this.errors = error.response.data.errors
        } else {
          this.errors.general = 'Erreur lors de la création de l\'utilisateur. Veuillez réessayer.'
        }
      } finally {
        this.isCreating = false
      }
    }
  }
}
</script>

<style scoped>
.user-create {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.user-management-page {
  min-height: 100vh;
  padding: 2rem 0;
}

.card {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-header-title {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
}

.card-content {
  padding: 2.5rem;
}

.field {
  margin-bottom: 1.5rem;
}

.label {
  color: #2d3748;
  font-weight: 600;
  font-size: 1.1rem;
}

.input {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input.is-danger {
  border-color: #f56565;
}

.help.is-danger {
  color: #f56565;
}

.button {
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.button.is-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.button.is-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.button.is-light {
  border: 1px solid #e2e8f0;
}

.button.is-light:hover {
  background: #f7fafc;
  transform: translateY(-1px);
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media screen and (max-width: 768px) {
  .card-content {
    padding: 1.5rem;
  }

  .user-create {
    padding: 1rem 0;
  }
}
</style>
