import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import 'bulma/css/bulma.min.css'
import { FontAwesomeIcon } from './plugins/fontawesome'

const app = createApp(App)

// Enregistre le composant font-awesome
app.component('font-awesome-icon', FontAwesomeIcon)

app.use(createPinia())
app.use(router)
app.mount('#app')
