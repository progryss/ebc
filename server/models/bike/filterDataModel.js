const mongoose = require('mongoose');

// Bike Filter data schema
const BikefilterDataSchema = new mongoose.Schema({
    name: {
        type: String
    },
    options: {
        type: Array
    }
});

const BikefilterData = mongoose.model('Bike Filter Category', BikefilterDataSchema);

module.exports = { BikefilterData };