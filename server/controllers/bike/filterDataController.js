const { BikefilterData } = require('../../models/bike/filterDataModel');

const addCategory = async (req, res) => {
    try {
        const existingCategory = await BikefilterData.findOne({ name: req.body.name }); 
        if (existingCategory) {
            return res.status(409).send('category already exists.')
        }
        const newCategory = new BikefilterData({
            name: req.body.name
        })
        await newCategory.save()
        res.status(200).send('category saved successfully')
    } catch (error) {
        res.status(500).send('error in creating category', error)
    }
}

const updateCategory = async (req, res) => {
    try {

        // Check if image is uploaded
        const imagePath = req.file ? `/uploads/images/${req.file.filename}` : null;
        const option = {
            subCategory: req.body.subCategory,
            labelBg: req.body.labelBg,
            labelText: req.body.labelText,
            labelImage: imagePath
        }
        // findOneAndUpdate takes a filter object, update object, and options
        const existingCategory = await BikefilterData.findOneAndUpdate(
            { name: req.body.category },
            { $addToSet: { options: option } },
            { new: true, runValidators: true }
        );

        if (!existingCategory) {
            return res.status(404).send('Category not found.');
        }
        res.status(200).send('Category updated successfully');
    } catch (error) {
        // Use JSON to send error details
        res.status(500).json({
            message: 'Error in updating category',
            error: error.message
        });
    }
};

const updateSubCategory = async (req, res) => {
    try {
        // console.log(req)
        const imagePath = req.file ? `/uploads/images/${req.file.filename}` : null;
        const query = { "options.subCategory": req.body.oldSubCategory };
        let update = {
            $set: {
                "options.$.subCategory": req.body.subCategory,
                "options.$.labelBg": req.body.labelBg,
                "options.$.labelText": req.body.labelText
            }
        };

        if (imagePath) {
            update.$set["options.$.labelImage"] = imagePath;
        } else if (req.body.labelImage === 'removeImage') {
            update.$set["options.$.labelImage"] = null;
        }
        const data = await BikefilterData.findOneAndUpdate(query, update, { new: true });
        res.status(200).send(data);

    } catch (error) {
        res.status(500).json({
            message: 'Error in updating category',
            error: error.message
        });
    }
};

const arrangeOrderSubCat = async (req, res) => {
    try {
        const category = await BikefilterData.findOneAndUpdate(
            { name: req.body.name },
            { $set: { options: req.body.options } }
        )
        res.status(200).send('subCategory re-arranged')
    } catch (error) {
        res.status(500).send('error in arranging subCategory')
    }
}

const getCategories = async (req, res) => {
    try {
        const categories = await BikefilterData.find();
        if (!categories) {
            res.status(404).send('no category found')
        }
        res.status(200).send(categories)
    } catch (error) {
        res.status(500).send('error in getting filter categories')
    }
}

const deleteSubCategory = async (req, res) => {
    try {
        const { category, subCategory } = req.body;

        // Use findOneAndUpdate with $pull to remove the option
        const updatedCategory = await BikefilterData.findOneAndUpdate(
            { name: category },
            { $pull: { options: { subCategory: subCategory } } },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).send('Category not found or option not found.');
        }

        res.status(200).send('Option deleted successfully from the category.');
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting option from category',
            error: error.message
        });
    }
};

module.exports = {
    addCategory,
    updateCategory,
    getCategories,
    deleteSubCategory,
    arrangeOrderSubCat,
    updateSubCategory
}