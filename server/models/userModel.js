const mongoose = require('mongoose');
const tokenKey = process.env.SECRET_KEY;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
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

// Method to clean up expired tokens
userSchema.methods.cleanupExpiredTokens = async function () {
    // Filter out expired tokens
    this.tokens = this.tokens.filter(tokenObj => {
        try {
            jwt.verify(tokenObj.token, tokenKey);
            return true; // keep the token if it's still valid
        } catch (error) {
            return false; // remove the token if it's expired
        }
    });

    // Optionally save the user document if you want the method to save changes automatically
    await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = { User };