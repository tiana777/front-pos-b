// src/plugins/fontawesome.js
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Import des icônes que tu souhaites utiliser
import { faPlus, faTrash, faPencil } from '@fortawesome/free-solid-svg-icons'

// Ajoute les icônes dans la bibliothèque
library.add(faPlus, faTrash, faPencil)

export { FontAwesomeIcon }
