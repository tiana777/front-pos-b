<template>
  <div>
    <h1>Administration des Rôles et Permissions</h1>
    <nav>
      <router-link to="/roles">Rôles</router-link> |
      <router-link to="/permissions">Permissions</router-link> |
      <router-link to="/users">Utilisateurs</router-link>
    </nav>
    <router-view></router-view>
  </div>
</template>
