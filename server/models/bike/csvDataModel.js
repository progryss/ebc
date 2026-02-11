const mongoose = require('mongoose');

// Define schema for Bike csv data with indexing
const bikeCsvDataSchema = new mongoose.Schema({
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
    }
});

// Creating a text index
bikeCsvDataSchema.index({
    make: 'text',
    model: 'text',
    sku: 'text',
    year: 'text',
    fitmentPosition: 'text'
});

const BikeCsvData = mongoose.model('Bike Csv Option', bikeCsvDataSchema);

module.exports = { BikeCsvData };