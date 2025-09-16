# TODO: Fix ticketNumber sending from AmountModal to CashPrinter and retrieve from session in Direct.vue

## Completed Tasks

- [x] Analyzed AmountModal.vue and CashPrinter.vue to identify the issue
- [x] Fixed destructuring in sendFondDeCaisse function to match emitted data from AmountModal
- [x] Updated axios.post payload to use ticketNumber instead of startTicketNumber
- [x] Updated localStorage.setItem for 'currentTicketNumber' to use ticketNumber
- [x] Corrected the API URL back to 127.0.0.1
- [x] Replace random ticket number generation with retrieval from cash register session's start_ticket_number
- [x] Update handlePaymentConfirmation function to use the session's ticket number
- [x] Fixed duplicate variable declaration issue
- [x] Verified ticketNumber is correctly emitted as ticketNumber.value from AmountModal.vue
- [x] Fixed ticketNumber type to be integer (changed from empty string to null)

## Next Steps

- [ ] Test the complete flow: AmountModal → CashPrinter → Direct.vue ticket retrieval → Sales creation
