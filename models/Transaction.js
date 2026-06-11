let transactions = [];
let nextId = 1;

module.exports = { transactions, getNextId: () => nextId++ };