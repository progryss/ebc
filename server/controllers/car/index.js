const carFilterController = require('./carFilterController');
const carCsvDataController = require('./csvDataController');
const carFilterTagController = require('./filterDataController');
const carSortingTagController = require('./sortingTagsController');

module.exports = {
  ...carFilterController,
  ...carCsvDataController,
  ...carFilterTagController,
  ...carSortingTagController,
};