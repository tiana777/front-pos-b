<template>
  <nav class="main-navigation">
    <div class="nav-container">
      <router-link to="/pos" class="nav-link pos-link">
        <font-awesome-icon icon="shopping-cart" />
        <span>POS</span>
      </router-link>

      <router-link to="/roles" class="nav-link">
        <font-awesome-icon icon="users" />
        <span>Roles</span>
      </router-link>
      <router-link to="/users" class="nav-link">
        <font-awesome-icon icon="user" />
        <span>Users</span>
      </router-link>

      <router-link to="/" class="nav-link">
        <font-awesome-icon icon="home" />
        <span>Home</span>
      </router-link>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Navigation'
}
</script>

<style scoped>
.main-navigation {
  background-color: #2c3e50;
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-container {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link:hover {
  background-color: #34495e;
}

.pos-link {
  background-color: #e74c3c;
  font-weight: bold;
}

.pos-link:hover {
  background-color: #c0392b;
}

.nav-link span {
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 0.5rem;
  }

  .nav-link {
    width: 100%;
    justify-content: center;
  }
}
</style>
