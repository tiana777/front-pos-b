import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({ users: [] }),
  actions: {
    async fetchUsers() {
      const response = await axios.get('http://localhost:8000/api/users');
      this.users = response.data;
    }
  }
});
