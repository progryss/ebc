const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authenticate = require('../middlewares/authenticate');
const { invEventController } = require('../services/inventoryEvent');
const { flushRedisData } = require('../config/redis');

const bikeControlers = require('../controllers/bike');
const carControlers = require('../controllers/car');
const inventoryController = require('../controllers/inventoryDataController');
const productController = require('../controllers/productController');
const userController = require('../controllers/userController');

// Ensure upload directories exist
const ensureDirectoryExistence = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Set up multer storage for images
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'images');
        ensureDirectoryExistence(uploadDir); // Ensure the directory exists
        cb(null, uploadDir); // Set destination to 'uploads/images'
    },
    filename: (req, file, cb) => {
        const newFileName = `${Date.now()}_${file.originalname}`;
        cb(null, newFileName); // Set the filename with timestamp and original name
    },
});

// Set up multer storage for CSV files
const csvStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'csv');
        ensureDirectoryExistence(uploadDir); // Ensure the directory exists
        cb(null, uploadDir); // Set destination to 'uploads/csv'
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Keep the original file name for CSV
    },
});

// Filter for image files
const imageFileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/; // Allowed image file types
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
        return cb(null, true); // Accept image file
    } else {
        cb(new Error('Only image files are allowed'), false); // Reject non-image file
    }
};

// Filter for CSV files
const csvFileFilter = (req, file, cb) => {
    const filetypes = /csv/; // Allowed CSV file types
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype) {
        return cb(null, true); // Accept CSV file
    } else {
        cb(new Error('Only CSV files are allowed'), false); // Reject non-CSV file
    }
};

// Set up multer with image configurations
const uploadImage = multer({
    storage: imageStorage,
    fileFilter: imageFileFilter,
});

// Set up multer with CSV configurations
const uploadCsv = multer({
    storage: csvStorage,
    fileFilter: csvFileFilter,
});

// user
router.post('/user-register', userController.userRegister);
router.post('/user-login', userController.userLogin);
router.get('/validate-user', authenticate, userController.validateUser);
router.post('/logout', authenticate, userController.logoutUser);
router.put('/change-password', authenticate, userController.updatePassword);
router.get('/get-users', authenticate, userController.getUsers);
router.put('/update-user', authenticate, userController.updateUser);
router.post('/delete-user', authenticate, userController.deleteUser);

// car csv
router.get('/csv-data', carControlers.getCsvData);
router.post('/upload-csv', uploadCsv.single('csvFile'), carControlers.uploadCsvData);
router.post('/delete-csv', carControlers.deleteCsvData);
router.delete('/delete-rows', carControlers.deleteMultipleRows);
router.put('/update-row', carControlers.updateRow);
router.post('/add-row', carControlers.addRow);
router.delete('/remove-duplicateCsv', carControlers.removeAllDuplicates);
router.get('/upload/progress', carControlers.progress);

// bike csv
router.get('/bike-csv-data', bikeControlers.getCsvData);
router.post('/upload-bike-csv', uploadCsv.single('csvFile'), bikeControlers.uploadCsvData);
router.post('/delete-bike-csv', bikeControlers.deleteCsvData);
router.delete('/delete-bike-rows', bikeControlers.deleteMultipleRows);
router.put('/update-bike-row', bikeControlers.updateRow);
router.post('/add-bike-row', bikeControlers.addRow);
router.delete('/remove-bike-duplicateCsv', bikeControlers.removeAllDuplicates);
router.get('/bike-upload/progress', bikeControlers.progress);

// Car Filter Tags
router.post('/add-category', carControlers.addCategory);
router.put('/update-category', uploadImage.single('labelImage'), carControlers.updateCategory);
router.put('/update-subcategory', uploadImage.single('labelImage'), carControlers.updateSubCategory);
router.put('/update-subcategory-order', carControlers.arrangeOrderSubCat);
router.delete('/delete-subCategory', carControlers.deleteSubCategory);
router.get('/get-category', carControlers.getCategories); // for both dashboard & store

// Bike Filter Tags
router.post('/add-bike-category', bikeControlers.addCategory);
router.put('/update-bike-category', uploadImage.single('labelImage'), bikeControlers.updateCategory);
router.put('/update-bike-subcategory', uploadImage.single('labelImage'), bikeControlers.updateSubCategory);
router.put('/update-bike-subcategory-order', bikeControlers.arrangeOrderSubCat);
router.delete('/delete-bike-subCategory', bikeControlers.deleteSubCategory);
router.get('/get-bike-category', bikeControlers.getCategories); // for both dashboard & store

// Car Sorting Tags
router.put('/update-sorting-tags', carControlers.updateSortingTags);
router.get('/sorting-tags', carControlers.getSortingTags) // for both dashboard & store

// Bike Sorting Tags
router.put('/update-bike-sorting-tags', bikeControlers.updateSortingTags);
router.get('/bike-sorting-tags', bikeControlers.getSortingTags) // for both dashboard & store

// car filter widget
router.get('/csv-data-makes', carControlers.getCsvDataMakes);
router.get('/csv-data-models', carControlers.getCsvDataModels);
router.get('/csv-data-years', carControlers.getCsvDataYears);
router.get('/csv-data-engineTypes', carControlers.getCsvDataEngineTypes);
router.get('/csv-data-skus', carControlers.getCsvDataSkus);
router.post('/get-products-by-skus', carControlers.getProductsBySkus);

// bike filter widget
router.get('/bike-csv-data-makes', bikeControlers.getCsvDataMakes);
router.get('/bike-csv-data-models', bikeControlers.getCsvDataModels);
router.get('/bike-csv-data-years', bikeControlers.getCsvDataYears);
router.get('/bike-csv-data-engineTypes', bikeControlers.getCsvDataEngineTypes);
router.get('/bike-csv-data-skus', bikeControlers.getCsvDataSkus);
router.post('/get-bike-products-by-skus', bikeControlers.getProductsBySkus);

// store products
router.post('/sync-products', productController.syncProductFromShopify);
router.post('/delete-products', productController.deleteProductFromDb);
router.post('/product-update-notify', productController.productWebhook);

// Store Product Inventory management
router.get('/fresh-inventory', inventoryController.updateInventory);
router.get('/get-inventory-history',inventoryController.getInventoryHistory);
router.get('/inventory-events', invEventController);

// Radis cache
router.delete('/flush-all', flushRedisData);

module.exports = router;