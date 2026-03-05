const mongoose = require('mongoose');

// Define schema for Shopify products with indexing
const productSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    handle: {
        type: String,
        required: true,
        index: true // Adding index
    },
    image_src: {
        type: String
    },
    images: {
        type: Array
    },
    tags: {
        type: [String],
    },
    variants: [{
        id: {
            type: String
        },
        sku: {
            type: String,
            index: true // Adding index on SKU
        },
        price: {
            type: String
        },
        compare_at_price: {
            type: String
        },
        image_id: {
            type: String
        },
        inventory_item_id: {
            type: String
        },
        inventory_quantity: {
            type: String
        },
        inventory_policy: {
            type: String
        }
    }]
});

const Product = mongoose.model('Shopify Product', productSchema);

module.exports = { Product };