# TODO - Vue de Gestion des Imprimantes

## ✅ Terminé

- [x] Créer src/services/printerService.js avec méthodes CRUD
- [x] Créer src/views/PrinterEditModal.vue pour édition
- [x] Créer src/views/PrinterCreateModal.vue pour ajout
- [x] Créer src/views/Printer.vue vue principale de gestion
- [x] Ajouter route /printers dans src/router/index.js

## 🔄 Étapes de Suivi

- [ ] Tester la vue en lançant l'application
- [ ] Vérifier que les endpoints API existent côté backend
- [ ] Ajustements si nécessaire basés sur les tests

## 📋 Fonctionnalités Implémentées

- Liste des imprimantes avec filtres (type de connexion, statut)
- Recherche par nom
- Ajout d'imprimante
- Édition d'imprimante
- Suppression d'imprimante
- Gestion des champs : nom, caisse, type connexion, chemins réseau/USB, timeout, défaut, actif

## 🔗 Routes

- `/printers` - Gestion des imprimantes
