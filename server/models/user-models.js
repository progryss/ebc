const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenKey = process.env.SECRET_KEY;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: Boolean
    },
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ]
});

// Define schema for Shopify products
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
        required: true
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
            type: String
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
        inventory_quantity: {
            type: String
        },
        inventory_policy: {
            type: String
        }
    }]
});


// Define schema for csv products
const csvDataSchema = new mongoose.Schema({
    make: {
        type: String
    },
    model: {
        type: String
    },
    engineType: {
        type: String
    },
    year: {
        type: String
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
        type: String
    },
    discDiameter: {
        type: String
    },
    sku: {
        type: String
    },
    included: {
        type: Array
    },

});

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
        return "error in token generation function";
    }
};

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Shopify Product', productSchema);
const CsvData = mongoose.model('Csv Option', csvDataSchema);

module.exports = { User, Product, CsvData };