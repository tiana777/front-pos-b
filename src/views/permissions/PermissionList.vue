<template>
  <div class="container">
    <header>
      <h2>Permissions</h2>
      <router-link to="/permissions/create" class="create-btn">
        <FontAwesomeIcon :icon="faPlus" />
        <span>Créer une permission</span>
      </router-link>
    </header>

    <div v-if="permissions.length" class="permissions-grid">
      <div v-for="permission in permissions" :key="permission.id" class="permission-card">
        <div class="permission-details">
          <span class="permission-name">{{ permission.name }}</span>
        </div>
        <div class="permission-actions">
          <button @click="deletePermission(permission.id)" class="delete-btn action-btn">
            <FontAwesomeIcon :icon="faTrash" />
          </button>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <i class="fas fa-list-ul"></i>
      <p>Aucune permission n'a été trouvée. Créez-en une pour commencer.</p>
    </div>
  </div>
</template>

<script>
import permissionService from '@/services/permissionService';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faPlus, faTrash, faListUl } from '@fortawesome/free-solid-svg-icons';

export default {
  components: {
    FontAwesomeIcon
  },
  data() {
    return {
      permissions: [],
      faPlus,
      faTrash,
      faListUl
    };
  },
  async created() {
    await this.fetchPermissions();
  },
  methods: {
    async fetchPermissions() {
      try {
        const response = await permissionService.getAll();
        this.permissions = response.data;
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
      }
    },
    async deletePermission(id) {
      if (confirm("Êtes-vous sûr de vouloir supprimer cette permission ?")) {
        try {
          await permissionService.delete(id);
          this.fetchPermissions();
        } catch (error) {
          console.error("Failed to delete permission:", error);
        }
      }
    }
  }
};
</script>
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f8f9fa;
  color: #4a4a4a;
  line-height: 1.5;
  min-height: 100vh;
  padding: 1.5rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: #ffffff;
  padding: 0.5rem;
  border-radius: 8px;
  box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.02);
}

h2 {
  color: #363636;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #485fc7;
  color: #ffffff;
  padding: 0.75rem 1.5rem;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.create-btn:hover {
  background-color: #3a51bb;
  transform: translateY(-1px);
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.permission-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.02);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  border: 1px solid #dbdbdb;
}

.permission-card:hover {
  box-shadow: 0 1.5em 2.5em -0.125em rgba(10, 10, 10, 0.12), 0 0 0 1px rgba(10, 10, 10, 0.04);
  transform: translateY(-3px);
}

.permission-details {
  flex-grow: 1;
  margin-bottom: 1.25rem;
}

.permission-name {
  font-weight: 600;
  font-size: 1.125rem;
  color: #363636;
  margin-bottom: 0.5rem;
  display: block;
}

.permission-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #dbdbdb;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.delete-btn {
  background-color: rgba(241, 70, 104, 0.1);
  color: #f14668;
}

.delete-btn:hover {
  background-color: #f14668;
  color: #ffffff;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 2rem;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.02);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-state i {
  font-size: 3.5rem;
  color: #dbdbdb;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #7a7a7a;
  font-size: 1.125rem;
  max-width: 500px;
  line-height: 1.5;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .permissions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  h2 {
    font-size: 1.5rem;
  }
}

@media (max-width: 600px) {
  .permissions-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .create-btn {
    width: 100%;
    justify-content: center;
  }

  body {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0;
  }

  .permission-card {
    padding: 1.25rem;
  }

  .empty-state {
    padding: 2rem 1rem;
  }

  .empty-state i {
    font-size: 3rem;
  }

  .empty-state p {
    font-size: 1rem;
  }
}
</style>
