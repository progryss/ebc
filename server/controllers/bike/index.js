const bikeFilterController = require('./bikeFilterController');
const bikeCsvDataController = require('./csvDataController');
const bikeFilterTagController = require('./filterDataController');
const bikeSortingTagController = require('./sortingTagsController');

module.exports = {
  ...bikeFilterController,
  ...bikeCsvDataController,
  ...bikeFilterTagController,
  ...bikeSortingTagController,
};