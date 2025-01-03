require('dotenv').config();
const bcrypt = require("bcryptjs");
const { User, Product, CsvData, filterData, inventoryData } = require('../models/user-models')
const axios = require('axios');
const async = require('async');
const { sendToAll } = require('../sseManager');

// for csv file upload
const fs = require('fs');
const csv = require('fast-csv');

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

const syncProductFromShopify = async (req, res) => {
    try {
        const apiKey = process.env.STORE_API_KEY;
        const password = process.env.STORE_API_PASSWORD;
        const apiUrl = process.env.STORE_API_URL;

        if (!apiKey || !password || !apiUrl) {
            return res.status(400).json({ error: 'API configuration is missing' });
        }

        let url = `${apiUrl}/products.json?limit=250`;  // First request to fetch up to 250 products

        // Keep making requests until there is no 'next' URL
        while (url) {
            // Fetch data from Shopify
            const response = await axios.get(url, {
                auth: {
                    username: apiKey,
                    password: password
                }
            });

            // Sync each product and store it in the database as soon as they are fetched
            await Promise.all(response.data.products.map(async (productData) => {
                const productFields = {
                    productId: productData.id,  // Use Shopify product ID
                    title: productData?.title ?? 'Unknown Title',
                    handle: productData?.handle ?? 'Unknown Handle',
                    image_src: productData?.image?.src ?? '',
                    images: productData?.images ?? [],
                    tags: productData?.tags ?? [],
                    variants: productData?.variants?.map((variant) => ({
                        id: variant.id,
                        sku: variant.sku,
                        price: variant.price,
                        compare_at_price: variant.compare_at_price,
                        image_id: variant.image_id,
                        inventory_item_id: variant.inventory_item_id,
                        inventory_quantity: variant.inventory_quantity ?? 0,
                        inventory_policy: variant.inventory_policy ?? 'deny',
                    })) ?? []
                };

                // Insert or update the product in MongoDB
                await Product.findOneAndUpdate(
                    { productId: productData.id },  // Check if product exists by Shopify ID
                    productFields,                  // Update fields if different
                    { upsert: true, new: true }     // Insert if not found, return updated document
                );
            }));

            // Check the Link header for the 'next' page URL for pagination
            const linkHeader = response.headers['link']; // Get the Link header

            // If the Link header contains a 'next' URL, set it to the 'url' variable
            if (linkHeader && linkHeader.includes('rel="next"')) {
                const nextPageUrl = linkHeader.split(',').find(part => part.includes('rel="next"')).split(';')[0].trim().slice(1, -1);
                url = nextPageUrl; // Set the URL to the next page's URL
            } else {
                url = null;  // No more pages, so we stop the loop
            }
        }

        res.status(200).send('All products synced successfully.');
    } catch (error) {
        console.error('Error syncing data:', error);
        res.status(500).json({ error: 'Failed to sync products' });
    }
};

const deleteProductFromDb = async (req, res) => {
    try {
        await Product.deleteMany({});
        res.status(200).send('All products deleted successfully.')
    } catch (error) {
        console.log('Error deleting products:', error);
        res.status(500).send('Failed to delete products')
    }
};

async function insertBatch(batch, batchNumber) {
    console.log(`Inserting batch ${batchNumber} with ${batch.length} records.`);
    await CsvData.insertMany(batch);
    console.log(`Batch ${batchNumber} inserted successfully.`);
}
const BATCH_SIZE = 50000;
let batchNumber = 0;
let totalRecords = 0;

// function to save csv product to db in batch
async function processCsvFile(filePath) {
    let batch = []; // Array to hold the batch
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath);
        const csvStream = csv.parse({ headers: true })
            .transform(data => {
                let capitalizedMake = data.Make.trim().toLowerCase().replace(/\b\w/g, function (char) {
                    return char.toUpperCase();
                });
                const transformed = {
                    make: data.Make.trim().toLowerCase(),
                    model: data.SubModel ? `${data.Model.trim()} ${data.SubModel.trim()}`.toLowerCase() : data.Model.trim().toLowerCase(),
                    engineType: `${data.Engine.trim()} ${data.EngineType.trim()} ${data.FuelType.trim()}`.toLowerCase(),
                    year: data.YearNo.trim(),
                    bhp: data['BHP'] ? data['BHP'].trim() : '',
                    frontBrakeCaliperMake: data.FrontBrakeCaliperMake ? data.FrontBrakeCaliperMake.trim() : '',
                    rearBrakeCaliperMake: data.RearBrakeCaliperMake ? data.RearBrakeCaliperMake.trim() : '',
                    fitmentPosition: data.FitmentPosition ? data.FitmentPosition.trim() : '',
                    discDiameter: data.DiscDiameter ? data.DiscDiameter.trim() : '',
                    included: data.KitComponents ? data.KitComponents.split(',').map(item => item.trim()) : [],
                    sku: data.PartCode.trim(),
                };
                return transformed;
            })

            .on('error', error => {
                console.error('Error reading CSV:', error);
                reject()
            })
            .on('data', async (row) => {
                batch.push(row);

                if (batch.length >= BATCH_SIZE) {
                    csvStream.pause(); // Pause the stream to manage flow control
                    batchNumber++;
                    // Asynchronously insert the batch
                    insertBatch(batch, batchNumber).then(() => {
                        batch = []; // Clear the batch after successful insertion
                        csvStream.resume(); // Resume the stream
                    }).catch(error => {
                        console.error(`Error inserting batch ${batchNumber}:`, error);
                        csvStream.resume(); // Optionally continue processing after a failed insert
                    });
                }
                resolve()
            })
            .on('end', () => {
                // Handle the last batch
                if (batch.length > 0) {
                    batchNumber++;
                    insertBatch(batch, batchNumber).then(() => {
                        console.log(`Final batch ${batchNumber} inserted.`);
                    }).catch(error => {
                        console.error(`Error inserting final batch ${batchNumber}:`, error);
                    });
                }
                console.log('CSV file has been processed successfully.');
            });

        stream.pipe(csvStream);
    })
}

async function countCsvRows(filePath) {
    return new Promise((resolve, reject) => {
        let rowCount = 0;
        fs.createReadStream(filePath)
            .pipe(csv.parse({ headers: true }))  // Parse CSV with headers
            .on('data', (row) => {
                rowCount++;
            })
            .on('end', () => {
                console.log(`Total batches: ${rowCount / BATCH_SIZE}`);
                resolve(rowCount);
            })
            .on('error', reject);  // Handle any errors
    });
}

const uploadCsvData = async (req, res) => {
    batchNumber = 0;
    totalRecords = 0;
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    totalRecords = await countCsvRows(req.file.path);
    try {
        // Assume a function processCsvFile that processes your CSV file
        await processCsvFile(req.file.path);
        res.status(200).send('csv uploaded successfully.');
    } catch (error) {
        console.log('Error uploading csv:', error);
        res.status(500).send('Error uploading csv');
    }
};

const progress = async (req, res) => {

    if (totalRecords > 0) {
        res.json({
            status: 'processing',
            progress: batchNumber,
            totalBatches: totalRecords / BATCH_SIZE,
            totalRecords: totalRecords
        });
    } else {
        res.json({
            status: 'complete',
            progress: totalRecords
        });
    }
}

const deleteCsvData = async (req, res) => {
    try {
        await CsvData.deleteMany({});
        res.status(200).send('Csv data deleted successfully.')
    } catch (error) {
        console.error('Error deleting csv data:', error);
        res.status(500).send('Failed to delete csv data')
    }
};

const getCsvData = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;  // Default and maximum rows per page
    const skip = (page - 1) * limit;
    const search = req.query.search;

    // Build the query object
    let query = {};
    if (search) {
        query = {
            $text: { $search: search } // Using text search for efficiency
        };
    }

    try {
        // Find documents based on the query
        const csvData = await CsvData.find(query)
            .skip(skip)
            .limit(limit);

        // Count only the documents that match the query
        const total = await CsvData.countDocuments(query);

        res.status(200).send({
            total,
            data: csvData,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching csv data:', error);
        res.status(500).json({ error: 'Failed to fetch csv data' });
    }
};

const getCsvDataMakes = async (req, res) => {
    try {
        const uniqueMakes = await CsvData.aggregate([
            { $group: { _id: "$make" } }, // Group documents by "make" field
            { $project: { _id: 0, make: "$_id" } } // Project the "make" field without _id
        ]);
        res.status(200).send(uniqueMakes)
    } catch (error) {
        console.error('Error fetching unique makes:', error);
        res.status(500).json({ error: 'Failed to fetch unique makes' });
    }
}

const getCsvDataModels = async (req, res) => {
    try {
        // Extract the selected make value from the query parameters
        const selectedMake = req.query.make;

        // Check if the selected make is provided
        if (!selectedMake) {
            return res.status(400).json({ error: 'Selected make is required' });
        }

        // Perform aggregation to get unique models for the selected make
        const uniqueModels = await CsvData.aggregate([
            { $match: { make: selectedMake } }, // Filter documents by selected make
            { $group: { _id: "$model" } }, // Group documents by "model" field
            { $project: { _id: 0, model: "$_id" } } // Project the "model" field without _id
        ]);

        res.status(200).send(uniqueModels.map(item => item.model))
    } catch (error) {
        console.error('Error fetching unique models:', error);
        res.status(500).json({ error: 'Failed to fetch unique models' });
    }
}

const getCsvDataYears = async (req, res) => {
    try {
        // Extract the selected model and make values from the query parameters
        const selectedModel = req.query.model;
        const selectedMake = req.query.make;

        // Check if the selected model and make are provided
        if (!selectedModel || !selectedMake) {
            return res.status(400).json({ error: 'Selected model and make are required' });
        }

        // Perform aggregation to get unique years for the selected model
        const years = await CsvData.aggregate([
            { $match: { model: selectedModel, make: selectedMake } },
            { $group: { _id: "$year" } }, // Group documents by "startYear" field
            { $project: { _id: 0, year: "$_id" } } // Project the "startYear" field without _id
        ]);

        res.status(200).send(years)
    } catch (error) {
        console.error('Error fetching unique start and end years:', error);
        res.status(500).json({ error: 'Failed to fetch unique start and end years' });
    }
}

const getCsvDataEngineTypes = async (req, res) => {
    try {
        const selectedModel = req.query.model;
        const selectedMake = req.query.make;
        const selectedYear = req.query.year;

        // Check if the engine is provided
        if (!selectedMake || !selectedModel || !selectedYear) {
            return res.status(400).json({ error: 'year is required' });
        }

        // Perform aggregation to get unique engine types for the selected year
        const uniqueEngineTypes = await CsvData.aggregate([
            { $match: { model: selectedModel, make: selectedMake, year: selectedYear } },
            { $group: { _id: "$engineType" } },
            { $project: { _id: 0, engineType: "$_id" } }
        ]);

        res.status(200).send(uniqueEngineTypes)
    } catch (error) {
        console.error('Error fetching unique engine types:', error);
        res.status(500).json({ error: 'Failed to fetch unique engine types' });
    }
}

const getCsvDataSkus = async (req, res) => {
    try {
        const selectedModel = req.query.model;
        const selectedMake = req.query.make;
        const selectedYear = req.query.year;
        const selectedEngineType = req.query.engine_type;

        // Check all values are provided
        if (!selectedMake || !selectedModel || !selectedYear || !selectedEngineType) {
            return res.status(400).json({ error: 'Engine type is required' });
        }

        // Perform aggregation to get unique SKUs for the selected dropdown values
        const uniqueSKUs = await CsvData.aggregate([
            { $match: { model: selectedModel, make: selectedMake, year: selectedYear, engineType: selectedEngineType } },
            { $group: { _id: "$sku" } },
            { $project: { _id: 0, sku: "$_id" } }
        ]);

        res.status(200).send(uniqueSKUs)
    } catch (error) {
        console.error('Error fetching unique SKUs:', error);
        res.status(500).send('Failed to fetch unique SKUs')
    }
}

const getProductsBySkus = async (req, res) => {
    try {
        const { skus, make, model, year, engineType } = req.body;

        let csvQuery = { 'sku': { $in: skus } };
        if (make) csvQuery.make = make;
        if (model) csvQuery.model = model;
        if (year) csvQuery.year = year;
        if (engineType) csvQuery.engineType = engineType;

        let productQuery = { 'variants.sku': { $in: skus } };

        // Fetching data concurrently using async.parallel
        async.parallel({
            csvDataResults: async () => await CsvData.find(csvQuery),
            products: async () => await Product.find(productQuery)
        }, (err, results) => {
            if (err) {
                console.error('Error fetching data:', err);
                return res.status(500).send({ message: "Failed to fetch products", error: err });
            }
            // Send combined results as response
            return res.status(200).send(results);
        });

    } catch (error) {
        console.error('Error fetching products by SKU:', error);
        res.status(500).send({ message: "Failed to fetch products due to an internal error", error });
    }
};



const deleteMultipleRows = async (req, res) => {
    try {
        const rowId = req.body.ids;
        if (!Array.isArray(rowId) || rowId.length === 0) {
            return res.status(400).send('Invalid or no IDs provided');
        }
        const result = await CsvData.deleteMany({
            _id: { $in: rowId }
        });
        if (result.deletedCount === 0) {
            return res.status(404).send('No row found to delete');
        }
        return res.status(200).send(`${result.deletedCount} csv data deleted successfully`);
    } catch (error) {
        console.error('Error deleting csv data:', error);
        res.status(500).send('Error deleting csv data');
    }
}

const updateRow = async (req, res) => {
    try {
        const data = req.body;
        const updatedRow = await CsvData.findByIdAndUpdate(
            data._id,
            {
                $set: {
                    make: data.make,
                    model: data.model,
                    engineType: data.engineType,
                    year: data.year,
                    bhp: data.bhp,
                    frontBrakeCaliperMake: data.frontBrakeCaliperMake,
                    rearBrakeCaliperMake: data.rearBrakeCaliperMake,
                    fitmentPosition: data.fitmentPosition,
                    discDiameter: data.discDiameter,
                    sku: data.sku,
                    included: data.included
                }
            },
            { new: true, runValidators: true }
        )
        if (!updatedRow) {
            return res.status(404).send('row not found');
        }

        res.status(200).send('row data updated successfully');
    } catch (error) {
        console.error('Error in row data:', error);
        res.status(500).send('Error updating row data');
    }
}

const addRow = async (req, res) => {
    const data = req.body;
    try {
        const newRow = new CsvData({
            make: data.make,
            model: data.model,
            engineType: data.engineType,
            year: data.year,
            bhp: data.bhp,
            frontBrakeCaliperMake: data.frontBrakeCaliperMake,
            rearBrakeCaliperMake: data.rearBrakeCaliperMake,
            fitmentPosition: data.fitmentPosition,
            discDiameter: data.discDiameter,
            sku: data.sku,
            included: data.included.split(',')
        });

        await newRow.save()
        return res.status(201).send('new row added')

    } catch (error) {
        console.log('error in adding new row data', error)
        return res.status(500).send('error in adding new row data')
    }
}

const productWebhook = (req, res) => {
    try {
        const productData = req.body;
        console.log("Product update received:");
        updateProductInDatabase(productData);

        res.status(200).send('Message received');
    } catch (error) {
        console.error('Error handling product webhook:', error);
        res.status(500).send('Failed to process webhook');
    }
};

async function updateProductInDatabase(productData) {
    try {
        // Assuming a MongoDB database with Mongoose
        await Product.findOneAndUpdate({ productId: productData.id }, {
            title: productData?.title ?? 'Unknown Title',
            handle: productData?.handle ?? 'Unknown Handle',
            image_src: productData?.image?.src ?? '',
            images: productData?.images ?? [],
            tags: productData?.tags ?? [],
            variants: productData?.variants?.map((variant) => ({
                id: variant.id,
                sku: variant.sku,
                price: variant.price,
                compare_at_price: variant.compare_at_price,
                image_id: variant.image_id,
                inventory_quantity: variant.inventory_quantity ?? 0,
                inventory_policy: variant.inventory_policy ?? 'deny'
            })) ?? []
        }, { upsert: true, new: true });
        console.log(`Product ${productData.title} updated successfully.`);
    } catch (error) {
        console.error('Database update failed for product:', error);
    }
}

const addCategory = async (req, res) => {
    try {
        const existingCategory = await filterData.findOne({ name: req.body.name });
        if (existingCategory) {
            return res.status(409).send('category already exists.')
        }
        const newCategory = new filterData({
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
        const existingCategory = await filterData.findOneAndUpdate(
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

const getCategories = async (req, res) => {
    try {
        const categories = await filterData.find();
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
        const updatedCategory = await filterData.findOneAndUpdate(
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

const removeAllDuplicates = async (req, res) => {
    try {
        // Step 1: Identify duplicates
        const duplicates = await CsvData.aggregate([
            {
                $group: {
                    _id: {
                        make: "$make",
                        model: "$model",
                        engineType: "$engineType",
                        year: "$year",
                        bhp: "$bhp",
                        frontBrakeCaliperMake: "$frontBrakeCaliperMake",
                        rearBrakeCaliperMake: "$rearBrakeCaliperMake",
                        fitmentPosition: "$fitmentPosition",
                        discDiameter: "$discDiameter",
                        sku: "$sku",
                        included: "$included"
                    },
                    docIds: { $addToSet: "$_id" },
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    count: { $gt: 1 } // filters groups having more than one document
                }
            }
        ]);

        // Step 2: Remove duplicates
        let countRemoved = 0;
        for (let duplicate of duplicates) {
            // Keep the first document and remove the rest
            const idsToRemove = duplicate.docIds.slice(1); // Skip the first element to keep
            await CsvData.deleteMany({ _id: { $in: idsToRemove } });
            countRemoved += idsToRemove.length;
        }

        res.status(200).send(`${countRemoved} Duplicates Entries Removed.`);
    } catch (error) {
        res.status(500).send("Error removing duplicates: " + error.message);
    }
};

const updateInventoryInDB = async (req, res) => {

    try {
        const tokenResponse = await axios.post(`${process.env.GRAVITE_API_URL}`, {
            api_credentials: {
                app_user: process.env.GRAVITE_API_USER,
                app_key: process.env.GRAVITE_API_KEY
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (tokenResponse.data.connection !== 'OK') {
            throw new Error("Error retrieving token: " + tokenResponse.data.error);
        }
        const apiToken = tokenResponse.data.token;
        console.log('-----------')
        console.log('Third Party Api Token - ', apiToken)

        // Get Location Id from Store
        const locationResponse = await axios.get(`${process.env.STORE_API_URL}/locations.json`, {
            headers: { 'X-Shopify-Access-Token': process.env.STORE_API_PASSWORD }
        });
        const locationId = locationResponse.data.locations[0].id;
        console.log('-----------')
        console.log('Store Location ID - ', locationId)

        // Fetch SKUs and inventory item of store product variants from db
        const products = await Product.find({
            $and: [
                { "variants.sku": { $ne: "" } },
                { "variants.sku": { $ne: null } }
            ]
        })

        const allSkuArr = products.flatMap(product => product.variants.map(variant => variant.sku ? ({
            sku: variant.sku,
            inventory_item_id: variant.inventory_item_id
        }) : ''));
        console.log('-----------')
        console.log('Total products - ', allSkuArr.length)

        let notificationResult = {
            startTime: getCurrentDateTime(),
            totalSku: allSkuArr.length,
            updatedSkuDb: 0,
            failedSkuDb: 0,
            endTime: '',
        }
        // Notify clients that the batch process has started
        sendToAll({ message: "Batch process started", result: notificationResult });

        let result = await processBatches(allSkuArr, apiToken, locationId, notificationResult);

        console.log('-----------------------------')
        console.log(result)
        console.log(result.failedSku.length)

        // Notify clients that all batches are completed
        notificationResult.endTime = getCurrentDateTime()
        sendToAll({ message: "All batches completed", result: notificationResult });

    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to update inventory");
    }

};

const updateInventoryInStore = async (req, res) => {

    try {
        // Fetch SKUs and inventory item of store product variants from db
        const freshInventoryList = await inventoryData.find()
        const batches = chunkArray(freshInventoryList, 200);

        let notificationResult = {
            startTimeStore: getCurrentDateTime(),
            updatedSku: 0,
            failedSku: 0,
            endTimeStore: ''
        }

        sendToAll({ message: "Shopify Batch process started", result: notificationResult });

        let count = 0;
        for (const batch of batches) {
            count++;
            const batchData = await Promise.allSettled(batch.map(element => element && updateShopifyProductStock(element)));
            results.push(batchData)
            notificationResult.updatedSku += batchData.length
            sendToAll({ message: `Shopify Batch processed ${count}`, result: notificationResult });
        }

        notificationResult.endTimeStore = getCurrentDateTime()
        sendToAll({ message: "All Shopify Batch processed", result: notificationResult });

    } catch (error) {
        console.log('error in updating shopify inventory', error)
    }
};

const updateInventory = async (req, res) => {
    try {
        updateInventoryInDB().then(result => {
            updateInventoryInStore()
        }).catch(err => {
            console.log(err)
        });
        res.status(202).send("process started")
    } catch (error) {
        res.status(500).send(error)
    }
}

async function processBatches(allSkus, apiToken, locationId, notificationResult) {

    let result = {
        batchCount: 0,
        failedSku: [],
        updatedSku: 0
    }

    const batches = chunkArray(allSkus, 200);

    for (const batch of batches) {
        result.batchCount++;

        console.log('-----------')
        console.log(`batch - ${result.batchCount}`)

        // Notify clients that a batch has started
        sendToAll({ message: `Batch processing ${result.batchCount}`, result: notificationResult });

        const skuList = batch.map(element => ({ code: element.sku }));

        console.log('-----------')
        console.log('Sku To Third Party App - ', skuList.length)

        const resultFromThirdParty = await sendBatchRequest(skuList, apiToken);
        if (resultFromThirdParty.connection !== 'OK') {
            throw new Error("Error fetching stock levels: " + resultFromThirdParty.data.error);
        }

        const updatedInventory = Object.entries(resultFromThirdParty.product_stock);

        // creating new objects to set the updated inventory in store
        let inventoryObject = batch.map((element) => {
            let c = updatedInventory.find(ele => ele[0] == element.sku)
            if (c) {
                let obj = {
                    sku: element.sku,
                    inventory_item_id: element.inventory_item_id,
                    available: parseInt(c[1].freestock),
                    locationId: locationId
                }
                return obj;
            } else {
                result.failedSku.push(element.sku)
            }
        }).filter(element => element != undefined)

        inventoryObject.forEach(async (element) => {

            await inventoryData.findOneAndUpdate(
                { inventory_item_id: element.inventory_item_id },
                element,
                { upsert: true, new: true }
            )

        })

        result.updatedSku += inventoryObject.length;
        console.log('-----------')
        console.log('Inventory Data Saved To DB - ', inventoryObject.length)

        console.log('-----------')
        console.log('Failed Sku - ', result.failedSku.length)
        notificationResult.updatedSkuDb += inventoryObject.length;
        notificationResult.failedSkuDb = result.failedSku.length;
        sendToAll({ message: `Batch processed ${result.batchCount}`, result: notificationResult });

    }

    return result;

}

function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

// function to fetch fresh inventory from thirdparty
async function sendBatchRequest(skuList, apiToken) {
    try {
        const response = await axios.post(`${process.env.GRAVITE_API_URL}`, {
            api_credentials: {
                app_user: process.env.GRAVITE_API_USER,
                app_key: process.env.GRAVITE_API_KEY,
                app_token: apiToken
            },
            product_codes: skuList
        });
        return response.data; // Assuming API returns JSON data
    } catch (error) {
        console.error('Failed to fetch stock levels:', error);
        throw error; // or handle the error as needed
    }
}

async function updateShopifyProductStock(element) {
    const url = `${process.env.STORE_API_URL}/inventory_levels/set.json`;
    const headers = {
        'X-Shopify-Access-Token': process.env.STORE_API_PASSWORD
    };
    const payload = {
        location_id: element.locationId,
        inventory_item_id: element.inventory_item_id,
        available: element.available
    };

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Initial delay before the request
    await delay(0);

    try {
        const response = await axios.post(url, payload, { headers });
        // Check the API call limit status and adjust the delay accordingly
        const apiCallLimit = response.headers['x-shopify-shop-api-call-limit'];
        const [usedCalls, maxCalls] = apiCallLimit.split('/').map(Number);
        if (maxCalls - usedCalls < 5) { // If close to limit, increase delay
            await delay(1000);
        }
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        if (error.response && error.response.status === 429) {
            // If hit with a rate limit error, increase delay significantly
            await delay(2000);
            return updateShopifyProductStock(element); // Retry the request
        }
        console.error('Error updating product stock:', error);
        throw error;
    }
}

const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
};

module.exports = {
    validateUser,
    userLogin,
    userRegister,
    logoutUser,
    updatePassword,
    getUsers,
    syncProductFromShopify,
    deleteProductFromDb,
    uploadCsvData,
    deleteCsvData,
    getCsvData,
    getCsvDataMakes,
    getCsvDataModels,
    getCsvDataYears,
    getCsvDataEngineTypes,
    getCsvDataSkus,
    getProductsBySkus,
    deleteMultipleRows,
    updateRow,
    addRow,
    progress,
    updateUser,
    deleteUser,
    productWebhook,
    addCategory,
    getCategories,
    updateCategory,
    deleteSubCategory,
    removeAllDuplicates,
    updateInventory
}; 