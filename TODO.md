# TODO: Implement Cash Transaction Update on Payment

## Completed Tasks
- [x] Modified SaleController@store to create CashTransaction record after successful sale creation
- [x] Added import for CashTransaction model in SaleController
- [x] Created cashTransactionStore.js Pinia store for managing cash transactions state
- [x] Updated CashTransactions.vue to use the new store instead of local state
- [x] Updated DirectSale.vue to import and use the cashTransactionStore
- [x] Added call to fetchTransactions after successful payment in DirectSale.vue
- [x] Added CashTransactionController import in routes/api.php
- [x] Added resource route for /cash-transactions in routes/api.php

## Remaining Tasks
- [ ] Test the payment flow in DirectSale.vue to ensure cash transaction is created
- [ ] Verify that CashTransactions.vue table updates after payment
- [ ] Check backend logs for any errors in cash transaction creation
- [ ] Ensure session_id is correctly passed and available for cash transactions
- [x] Removed updateSessionTicket call to avoid permission issues
