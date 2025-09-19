<template>
  <div style="position: relative;">*
    <Profile />
  </div>
  <div class="user-list">
    <!-- Include POS Component -->

    <div class="container">
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <font-awesome-icon icon="users" class="title-icon" />
            <span>Gestion des Utilisateurs</span>
          </h1>
          <p class="page-subtitle">Gérez les utilisateurs et leurs rôles dans le système</p>
        </div>
        <router-link to="/users/create" class="btn btn-primary">
          <font-awesome-icon icon="plus" />
          <span>Nouvel Utilisateur</span>
        </router-link>
      </div>

      <div class="content-card">
        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <div class="loading-text">
              <h3>Chargement des utilisateurs...</h3>
              <p>Veuillez patienter pendant le chargement des données</p>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="users.length === 0" class="empty-container">
          <div class="empty-state">
            <div class="empty-icon">
              <font-awesome-icon icon="users" />
            </div>
            <h3>Aucun utilisateur trouvé</h3>
            <p>Commencez par créer votre premier utilisateur pour gérer l'accès au système</p>
            <router-link to="/users/create" class="btn btn-primary">
              <font-awesome-icon icon="plus" />
              <span>Créer un utilisateur</span>
            </router-link>
          </div>
        </div>

        <!-- Users Table -->
        <div v-else class="table-section">
          <div class="table-header">
            <h3>Liste des utilisateurs</h3>
            <div class="table-stats">
              <span class="stat-item">
                <strong>{{ users.length }}</strong> utilisateur{{ users.length > 1 ? 's' : '' }}
              </span>
            </div>
          </div>

          <div class="table-wrapper">
            <table class="users-table">
              <thead>
                <tr>
                  <th class="col-user">Point de vente</th>
                  <th class="col-user">Utilisateur</th>
                  <th class="col-email">Email</th>
                  <th class="col-roles">Rôles</th>
                  <th class="col-date">Date de création</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id" class="user-row">
                  <td class="user-cell">
                    <div class="user-info">

                      <div class="user-details">
                        <div class="user-name">{{ user.point_of_sale_name || 'Non défini' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="user-cell">
                    <div class="user-info">
                      <div class="user-avatar" :style="{ backgroundColor: getAvatarColor(user.name) }">
                        {{ user.name?.charAt(0)?.toUpperCase() || '?' }}
                      </div>
                      <div class="user-details">
                        <div class="user-name">{{ user.name || 'Non défini' }}</div>
                        <div class="user-id">ID: {{ user.id }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="email-cell">
                    <div class="email-wrapper">
                      <font-awesome-icon icon="envelope" class="email-icon" />
                      <span>{{ user.email }}</span>
                    </div>
                  </td>
                  <td class="roles-cell">
                    <div class="roles-wrapper">
                      <span v-for="role in user.roles" :key="role" class="role-badge">
                        {{ role }}
                      </span>
                      <span v-if="!user.roles || user.roles.length === 0" class="no-roles">
                        Aucun rôle
                      </span>
                    </div>
                  </td>
                  <td class="date-cell">
                    <div class="date-wrapper">
                      <font-awesome-icon icon="calendar" class="date-icon" />
                      <span>{{ formatDate(user.created_at) }}</span>
                    </div>
                  </td>
                  <td class="actions-cell">
                    <div class="action-group">
                      <router-link :to="`/users/${user.id}/edit`" class="btn btn-icon btn-edit"
                        title="Modifier l'utilisateur">
                        <font-awesome-icon icon="pencil" />
                      </router-link>
                      <button @click="deleteUser(user.id)" class="btn btn-icon btn-delete"
                        title="Supprimer l'utilisateur">
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
    </div>
  </div>

</template>

<script>
import userService from '@/services/userService'
import Profile from '../Profile.vue'

export default {
  name: 'UserList',
  components: {
    Profile
  },
  data() {
    return {
      users: [],
      loading: true
    }
  },
  async mounted() {
    await this.loadUsers()
  },
  methods: {
    async loadUsers() {
      try {
        this.loading = true
        const response = await userService.getAll()
        let users = response.data

        // Load roles for each user
        const usersWithRoles = await Promise.all(
          users.map(async (user) => {
            try {
              const rolesResponse = await userService.getRoles(user.id)
              const roles = rolesResponse.data || []
              return {
                ...user,
                roles: roles.map(role => role.name || role)
              }
            } catch (error) {
              console.error(`Erreur lors du chargement des rôles pour l'utilisateur ${user.id}:`, error)
              return {
                ...user,
                roles: []
              }
            }
          })
        )

        this.users = usersWithRoles
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error)
        this.users = []
      } finally {
        this.loading = false
      }
    },
    async deleteUser(userId) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
        try {
          await userService.delete(userId)
          await this.loadUsers()
        } catch (error) {
          console.error('Erreur lors de la suppression:', error)
          alert('Erreur lors de la suppression de l\'utilisateur')
        }
      }
    },
    formatDate(date) {
      if (!date) return 'Non défini'
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },
    getAvatarColor(name) {
      if (!name) return '#6b7280'

      const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
      ]

      const index = name.charCodeAt(0) % colors.length
      return colors[index]
    }
  }
}
</script>

<style scoped>
.user-list {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 5rem 2rem 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Header Styles */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-icon {
  color: #3b82f6;
  font-size: 1.5rem;
}

.page-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

/* Card Styles */
.content-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

/* Loading State */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

.loading-text h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.loading-text p {
  color: #64748b;
  margin: 0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* Empty State */
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.empty-state {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background-color: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 2rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #64748b;
  margin: 0 0 2rem 0;
}

/* Table Section */
.table-section {
  padding: 0;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
}

.table-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.table-stats {
  font-size: 0.875rem;
  color: #64748b;
}

.stat-item strong {
  color: #1e293b;
}

/* Table Styles */
.table-wrapper {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background-color: #f8fafc;
  font-weight: 600;
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: 0.875rem;
  color: #374151;
  border-bottom: 1px solid #e2e8f0;
}

.users-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  color: #374151;
}

.user-row:hover {
  background-color: #f8fafc;
}

/* Column Styles */
.col-user {
  width: 25%;
}

.col-email {
  width: 25%;
}

.col-roles {
  width: 20%;
}

.col-date {
  width: 15%;
}

.col-actions {
  width: 15%;
  text-align: right;
}

/* User Cell */
.user-cell {
  vertical-align: middle;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  color: white;
  flex-shrink: 0;
}

.user-details {
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.125rem;
}

.user-id {
  font-size: 0.75rem;
  color: #64748b;
}

/* Email Cell */
.email-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #374151;
}

.email-icon {
  color: #64748b;
  font-size: 0.875rem;
}

/* Roles Cell */
.roles-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.role-badge {
  background-color: #e0e7ff;
  color: #3730a3;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.no-roles {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.875rem;
}

/* Date Cell */
.date-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #374151;
}

.date-icon {
  color: #64748b;
  font-size: 0.875rem;
}

/* Actions Cell */
.actions-cell {
  text-align: right;
}

.action-group {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  border: 1px solid;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem;
  width: 36px;
  height: 36px;
}

.btn-primary {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
  border-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.btn-edit {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.btn-edit:hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}

.btn-delete {
  background-color: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.btn-delete:hover {
  background-color: #fecaca;
  border-color: #f87171;
}

/* Responsive Design */
@media (max-width: 1024px) {

  .col-user,
  .col-email {
    width: 30%;
  }

  .col-roles {
    width: 25%;
  }

  .col-date,
  .col-actions {
    width: auto;
  }
}

@media (max-width: 768px) {
  .user-list {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 1rem;
  }

  .users-table {
    font-size: 0.875rem;
  }

  .users-table th,
  .users-table td {
    padding: 0.75rem;
  }

  .col-user,
  .col-email,
  .col-roles,
  .col-date,
  .col-actions {
    width: auto;
  }

  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .table-wrapper {
    margin: 0 -1rem;
  }

  .users-table {
    font-size: 0.8125rem;
  }

  .action-group {
    flex-direction: column;
  }

  .btn-icon {
    width: 32px;
    height: 32px;
  }
}
</style>
