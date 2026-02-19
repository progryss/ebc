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
    subModel:{
        type: String,
        index: true // Adding index
    },
    engine:{
        type: String,
    },
    engineType: {
        type: String,
    },
    fuelType:{
        type: String,
    },
    vehicleQualifier:{
        type: String,
    },
    years: {
        type: Array,
    },
    bhp:{
        type: String,
    },
    valves:{
        type: String,
    },
    fitmentPosition: {
        type: String,
        index: true // Adding index
    },
    specialComments:{
        type: String
    },
    frontBrakeCaliperMake:{
        type:String
    },
    rearBrakeCaliperMake:{
        type:String
    },
    frontDiscDiameter: {
        type: String
    },
    rearDiscDiameter: {
        type: String
    },
    kitComponents:{
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
    subModel: 'text',
    fitmentPosition: 'text',
    sku: 'text'
});

const BikeCsvData = mongoose.model('Bike Csv Option', bikeCsvDataSchema);

module.exports = { BikeCsvData };