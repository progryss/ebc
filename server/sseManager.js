// sseManager.js to manage SSE connections globally

const clients = {};

// Function to add a client
function addClient(clientId, response) {
    clients[clientId] = response;
}

// Function to remove a client
function removeClient(clientId) {
    delete clients[clientId];
}

// Function to send a message to all clients
function sendToAll(message) {
    Object.values(clients).forEach(client => client.write(`data: ${JSON.stringify(message)}\n\n`));
}

module.exports = { addClient, removeClient, sendToAll };
