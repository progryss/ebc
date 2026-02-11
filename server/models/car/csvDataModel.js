const mongoose = require('mongoose');

// Define schema for csv products with indexing
const csvDataSchema = new mongoose.Schema({
    make: {
        type: String,
        index: true // Adding index
    },
    model: {
        type: String,
        index: true // Adding index
    },
    engineType: {
        type: String,
        index: true // Adding index
    },
    year: {
        type: String,
        index: true // Adding index
    },
    bhp: {
        type: String
    },
    frontBrakeCaliperMake: {
        type: String
    },
    rearBrakeCaliperMake: {
        type: String
    },
    fitmentPosition: {
        type: String,
        index: true
    },
    discDiameter: {
        type: String
    },
    sku: {
        type: String,
        index: true // Adding index
    },
    included: {
        type: Array
    },
});

// Creating a text index
csvDataSchema.index({
    make: 'text',
    model: 'text',
    sku: 'text',
    year: 'text',
    fitmentPosition: 'text'
});

const CsvData = mongoose.model('Csv Option', csvDataSchema);

module.exports = { CsvData };