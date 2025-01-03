const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenKey = process.env.SECRET_KEY;
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: Boolean
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

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

// Define schema for csv products with indexing
const csvDataSchema = new mongoose.Schema({
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
    bhp: {
        type: String
    },
    frontBrakeCaliperMake: {
        type: String
    },
    rearBrakeCaliperMake: {
        type: String
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
    },
    included: {
        type: Array
    },
});

// Creating a text index
csvDataSchema.index({
    make: 'text',
    model: 'text',
    sku: 'text',
    year: 'text',
    fitmentPosition: 'text'
});

// Filter data schema
const filterDataSchema = new mongoose.Schema({
    name: {
        type: String
    },
    options: {
        type: Array
    }
});

const inventoryDataSchema = new mongoose.Schema({
    sku:{
        type:String
    },
    inventory_item_id:{
        type:String
    },
    available:{
        type:Number
    },
    locationId:{
        type:Number
    }
})

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});

userSchema.methods.generateToken = async function () {
    try {
        let userToken = jwt.sign({ _id: this._id }, tokenKey, { expiresIn: "24h" });
        this.tokens = this.tokens.concat({ token: userToken });
        await this.save();
        return userToken;
    } catch (error) {
        console.error("error in token generation function:", error);
        return error;
    }
};

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Shopify Product', productSchema);
const CsvData = mongoose.model('Csv Option', csvDataSchema);
const filterData = mongoose.model('Filter Category', filterDataSchema);
const inventoryData = mongoose.model('Inventory Queries', inventoryDataSchema)

module.exports = { User, Product, CsvData, filterData, inventoryData };
