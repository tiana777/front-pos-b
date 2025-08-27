<template>
  <div class="cash-register-sessions">
    <h1>Cash Register Sessions</h1>

    <div class="filter-bar">
      <label>Filter by Status:</label>
      <select v-model="filterStatus" @change="fetchSessions">
        <option value="all">All</option>
        <option value="open">Open</option>
        <option value="closed">Closed</option>
      </select>
      <button @click="showNewSessionForm = true" v-if="hasPermission('cash_register_sessions.create')">
        Open New Session
      </button>
      <span v-else class="permission-denied">
        You don't have permission to create sessions
      </span>
    </div>

    <div v-if="loading">Loading sessions...</div>
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>

    <table v-if="sessions.length > 0" class="sessions-table">
      <thead>
        <tr>
          <th class="has-text-black">ID</th>
          <th class="has-text-black">User</th>
          <th class="has-text-black">Status</th>
          <th class="has-text-black">Opened At</th>
          <th class="has-text-black">Closed At</th>
          <th class="has-text-black">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="session in sessions" :key="session.id">
          <td class="has-text-black">{{ session.id }}</td>
          <td class="has-text-black">{{ session.user.name }}</td>
          <td class="has-text-black">{{ session.is_closed ? 'Closed' : 'Open' }}</td>
          <td class="has-text-black">{{ formatDate(session.opened_at) }}</td>
          <td class="has-text-black">{{ session.closed_at ? formatDate(session.closed_at) : '-' }}</td>
          <td class="has-text-black">
            <button @click="viewSession(session)">View</button>
            <button v-if="!session.is_closed" @click="closeSession(session)">Close</button>
            <button v-else @click="reopenSession(session)">Reopen</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showNewSessionForm" class="modal">
      <div class="modal-content">
        <h2>Open New Session</h2>
        <form @submit.prevent="openNewSession">
          <div>
            <label for="cash_register_id">Cash Register ID:</label>
            <input type="number" v-model.number="newSessionData.cash_register_id" required />
          </div>
          <div>
            <label for="user_id">User ID:</label>
            <input type="number" v-model.number="newSessionData.user_id" required />
          </div>
          <div>
            <label for="starting_amount">Starting Amount:</label>
            <input type="number" step="0.01" v-model.number="newSessionData.starting_amount" required min="0" />
          </div>
          <div>
            <label for="expected_cash_amount">Expected Cash Amount:</label>
            <input type="number" step="0.01" v-model.number="newSessionData.expected_cash_amount" required min="0" />
          </div>
          <div>
            <label for="note">Note:</label>
            <textarea v-model="newSessionData.note" rows="3" cols="30"></textarea>
          </div>
          <button type="submit">Open Session</button>
          <button type="button" @click="showNewSessionForm = false">Cancel</button>
        </form>
        <div v-if="formErrorMessage" class="error">{{ formErrorMessage }}</div>
      </div>
    </div>

    <div v-if="selectedSession" class="modal">
      <div class="modal-content">
        <h2>Session Details - ID: {{ selectedSession.id }}</h2>
        <p>User: {{ selectedSession.user.name }}</p>
        <p>Status: {{ selectedSession.is_closed ? 'Closed' : 'Open' }}</p>
        <p>Opened At: {{ formatDate(selectedSession.opened_at) }}</p>
        <p>Closed At: {{ selectedSession.closed_at ? formatDate(selectedSession.closed_at) : '-' }}</p>

        <h3>Transactions</h3>
        <ul>
          <li v-for="transaction in selectedSession.transactions" :key="transaction.id">
            {{ transaction.description }} - {{ transaction.amount }}
          </li>
        </ul>

        <h3>Discrepancies</h3>
        <ul>
          <li v-for="discrepancy in selectedSession.discrepancies" :key="discrepancy.id">
            {{ discrepancy.description }} - {{ discrepancy.amount }}
          </li>
        </ul>

        <h3>Add Discrepancy</h3>
        <form @submit.prevent="addDiscrepancy">
          <div>
            <label for="description">Description:</label>
            <input type="text" v-model="discrepancyFormData.description" required />
          </div>
          <div>
            <label for="amount">Amount:</label>
            <input type="number" step="0.01" v-model.number="discrepancyFormData.amount" required />
          </div>
          <button type="submit">Add Discrepancy</button>
        </form>
        <div v-if="discrepancyErrorMessage" class="error">{{ discrepancyErrorMessage }}</div>

        <h3>Summary</h3>
        <p>Total Transactions: {{ summary.total_transactions }}</p>
        <p>Total Discrepancies: {{ summary.total_discrepancies }}</p>

        <button @click="closeSession(selectedSession)" v-if="!selectedSession.is_closed">Close Session</button>
        <button @click="reopenSession(selectedSession)" v-else>Reopen Session</button>
        <button @click="closeDetails">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'CashRegisterSessions',
  data() {
    return {
      sessions: [],
      filterStatus: 'all',
      selectedSession: null,
      showNewSessionForm: false,
      newSessionData: {
        cash_register_id: null,
        user_id: null,
        starting_amount: 0,
        expected_cash_amount: 0,
        note: '',
      },
      discrepancyFormData: {
        description: '',
        amount: 0,
      },
      summary: {
        total_transactions: 0,
        total_discrepancies: 0,
      },
      loading: false,
      errorMessage: '',
      formErrorMessage: '',
      discrepancyErrorMessage: '',
    }
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleString()
    },
    async fetchSessions() {
      this.loading = true
      this.errorMessage = ''
      try {
        let url = '/api/cash-register-sessions'
        if (this.filterStatus !== 'all') {
          url += `?status=${this.filterStatus}`
        }
        const response = await axios.get(url)
        this.sessions = response.data
      } catch (error) {
        this.errorMessage = 'Failed to load sessions.'
      } finally {
        this.loading = false
      }
    },
    viewSession(session) {
      this.selectedSession = session
      this.fetchSummary(session.id)
      this.discrepancyFormData = { description: '', amount: 0 }
    },
    closeDetails() {
      this.selectedSession = null
      this.summary = { total_transactions: 0, total_discrepancies: 0 }
    },
    async openNewSession() {
      this.formErrorMessage = ''
      try {
        console.log('Opening new session with data:', this.newSessionData)

        const response = await axios.post('http://127.0.0.1:8000/api/cash-register-sessions',
          {
            cash_register_id: this.newSessionData.cash_register_id,
            user_id: this.newSessionData.user_id,
            starting_amount: this.newSessionData.starting_amount,
            expected_cash_amount: 0,
            note: this.newSessionData.note,
            start_ticket_number: this.newSessionData.start_ticket_number // si utilisé côté Laravel
          },
          {
            headers: {
              Authorization: `Bearer ${this.token}`
            }
          }
        )

        this.sessions.push(response.data)
        this.showNewSessionForm = false
        this.newSessionData = {
          cash_register_id: null,
          user_id: null,
          starting_amount: 0,
          expected_cash_amount: 0,
          note: '',
          start_ticket_number: ''
        }

      } catch (error) {
        console.error('Failed to open session:', error)
        this.formErrorMessage = error.response?.data?.message || 'Failed to open session.'
      }
    }
    ,

    async closeSession(session) {
      try {
        const payload = {
          is_closed: true,
          actual_cash_amount: session.actual_cash_amount || 0,
          closed_at: new Date().toISOString(),
        }
        const response = await axios.put(`/api/cash-register-sessions/${session.id}`, payload)
        const index = this.sessions.findIndex(s => s.id === session.id)
        if (index !== -1) {
          this.sessions.splice(index, 1, response.data)
        }
        if (this.selectedSession && this.selectedSession.id === session.id) {
          this.selectedSession = response.data
          this.fetchSummary(session.id)
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to close session.')
      }
    },
    async reopenSession(session) {
      try {
        const response = await axios.post(`/api/cash-register-sessions/${session.id}/reopen`)
        const index = this.sessions.findIndex(s => s.id === session.id)
        if (index !== -1) {
          this.sessions.splice(index, 1, response.data)
        }
        if (this.selectedSession && this.selectedSession.id === session.id) {
          this.selectedSession = response.data
          this.fetchSummary(session.id)
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to reopen session.')
      }
    },
    async addDiscrepancy() {
      this.discrepancyErrorMessage = ''
      try {
        const response = await axios.post(`/api/cash-register-sessions/${this.selectedSession.id}/discrepancies`, this.discrepancyFormData)
        this.selectedSession.discrepancies.push(response.data)
        this.discrepancyFormData = { description: '', amount: 0 }
        this.fetchSummary(this.selectedSession.id)
      } catch (error) {
        this.discrepancyErrorMessage = error.response?.data?.message || 'Failed to add discrepancy.'
      }
    },
    async fetchSummary(sessionId) {
      try {
        const response = await axios.get(`/api/cash-register-sessions/${sessionId}/summary`)
        this.summary = response.data
      } catch (error) {
        // ignore summary fetch errors
      }
    },
  },
  mounted() {
    this.fetchSessions()
  },
}
</script>

<style scoped>
.cash-register-sessions {
  padding: 1rem;
}

.filter-bar {
  margin-bottom: 1rem;
}

.sessions-table {
  width: 100%;
  border-collapse: collapse;
}

.sessions-table th,
.sessions-table td {
  border: 1px solid #ccc;
  padding: 0.5rem;
  text-align: left;
}

.error {
  color: red;
  margin-top: 0.5rem;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  padding: 1rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 4px;
}

.modal-content h2 {
  margin-top: 0;
}

.modal-content form div {
  margin-bottom: 0.5rem;
}

.modal-content form label {
  display: block;
  margin-bottom: 0.25rem;
}

.modal-content form input {
  width: 100%;
  padding: 0.25rem;
  box-sizing: border-box;
}
</style>
