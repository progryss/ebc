const mongoose = require('mongoose');

const sortTagSchema = new mongoose.Schema({
    sortTag:{
        type:'String'
    }
})

const SortTags = mongoose.model('Sort Tag',sortTagSchema);

module.exports = { SortTags };