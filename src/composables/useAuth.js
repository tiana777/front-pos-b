import { ref, computed } from 'vue'
import userService from '@/services/userService'

export function useAuth() {
  const user = ref(null)
  const roles = ref([])
  const permissions = ref([])

  const isAuthenticated = computed(() => {
    const token = localStorage.getItem('token')
    return !!token
  })

  const currentUser = computed(() => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  })

  const hasRole = (roleName) => {
    return roles.value.includes(roleName)
  }

  const hasPermission = (permissionName) => {
    return permissions.value.includes(permissionName)
  }

  const isAdmin = computed(() => {
    return hasRole('admin')
  })

  const loadUserData = async () => {
    try {
      const userData = currentUser.value
      if (userData && userData.id) {
        user.value = userData

        // Load user roles
        const rolesResponse = await userService.getRoles(userData.id)
        roles.value = rolesResponse.data.map((role) => role.name)

        // Load user permissions
        const permissionsResponse = await userService.getPermissions(userData.id)
        permissions.value = permissionsResponse.data.map((permission) => permission.name)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  return {
    user,
    roles,
    permissions,
    isAuthenticated,
    currentUser,
    hasRole,
    hasPermission,
    isAdmin,
    loadUserData,
  }
}
