require('dotenv').config({ path: '/var/www/potnvehiclefinder.co.uk/html/.env' });
const {performUpdateInventory} = require('./inventryUpdate.js')
const mongoose = require('mongoose');


mongoose.connect(process.env.DB_URI)
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
