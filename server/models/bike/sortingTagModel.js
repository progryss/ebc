const mongoose = require('mongoose');

const bikeSortTagSchema = new mongoose.Schema({
    sortTag:{
        type:'String'
    }
})

const BikeSortTags = mongoose.model('Bike Sort Tag',bikeSortTagSchema);

module.exports = { BikeSortTags };