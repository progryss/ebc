const bcrypt = require("bcryptjs");
const { User } = require('../models/userModel');


const userRegister = async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(409).send("User already exists");
        }
        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            role: req.body.role
        });
        await newUser.save();
        return res.status(200).send("User registered")
    }
    catch (error) {
        console.error("Error:", error);
        return res.status(500).send("Internal server error");
    }
}

const userLogin = async (req, res) => {
    try {
        const userValid = await User.findOne({ email: req.body.email });
        if (userValid) {
            const detailsMatch = await bcrypt.compare(req.body.password, userValid.password)
            if (!detailsMatch) {
                return res.status(401).send("Invalid credentials");
            } else {

                const token = await userValid.generateToken();
                res.cookie("userCookie", token, {
                    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    httpOnly: true,
                    sameSite: "Lax",
                    secure: true
                });
                return res.status(200).send({ userValid })
            }

        } else {
            return res.status(404).send("User not found");
        }
    } catch (error) {
        return res.status(500).send(error)
    }
}

const validateUser = async (req, res) => {
    try {
        let user = await User.findOne({ _id: req.userId });
        res.status(200).send(user);
    } catch (error) {
        res.status(401).send("user not found");
    }
}

const logoutUser = async (req, res) => {
    try {
        res.clearCookie('userCookie');
        res.status(200).send({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(401).send({ message: 'error in Logged out' });
    }
}

const updatePassword = async (req, res) => {
    const { newPassword } = req.body;
    try {
        const user = req.validUser;
        user.password = newPassword;
        await user.save();
        res.status(200).send('Password updated successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('error in updating password');
    }
};

const updateUser = async (req, res) => {
    const { _id, name, email, newPassword } = req.body;
    const data = {}
    data._id = _id
    if (name) data.name = name
    if (email) data.email = email

    try {
        if (newPassword) {
            data.password = await bcrypt.hash(newPassword, 12);
        }
        const updateUser = await User.findByIdAndUpdate(
            data._id,
            { $set: data },
            { new: true, runValidators: true }
        )
        if (!updateUser) {
            return res.status(404).send('user not found');
        }
        res.status(200).send('User updated successfully');
    } catch (error) {
        res.status(500).send('error in updating user', error)
    }
}

const getUsers = async (req, res) => {
    try {
        const response = await User.find();
        if (!response) {
            return res.status(401).send('no user found')
        }
        res.status(200).send(response)
    } catch (error) {
        console.log('errer in getting user', error)
        res.status(500).send(error)
    }
}

const deleteUser = async (req, res) => {
    const email = req.body.email
    try {
        const user = await User.findOneAndDelete({ email: email });
        if (!user) {
            return res.status(404).send('user not found')
        }
        res.status(200).send('User deleted successfully')
    } catch (error) {
        console.log('error in deleting user')
        res.status(500).send('error deleting user', error)
    }
}


module.exports = {
    userRegister,
    userLogin,
    validateUser,
    logoutUser,
    updatePassword,
    updateUser,
    getUsers,
    deleteUser
}