require('dotenv').config({ path: '/var/www/potnvehiclefinder.co.uk/html/.env' });
const {performUpdateInventory} = require('./inventryUpdate.js')
const mongoose = require('mongoose');

const a = process.env.DB_URI;
console.log('uri',a)

mongoose.connect(a)
  .then(() => {
    console.log('MongoDB connected');
    return performUpdateInventory();
  })
  .then(() => {
    console.log('Inventory update completed');
  })
  .catch(err => {
    console.error('Error during operation:', err);
  });
