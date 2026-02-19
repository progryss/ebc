const mongoose = require('mongoose');

// Filter data schema
const filterDataSchema = new mongoose.Schema({
    name: {
        type: String
    },
    options: {
        type: Array
    }
});

const filterData = mongoose.model('Filter Category', filterDataSchema);

module.exports = { filterData };