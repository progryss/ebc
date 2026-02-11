const { CsvData } = require('../../models/car/csvDataModel');
const { Product } = require('../../models/productModel');
const { redisClient } = require('../../config/redis');
const async = require('async');

const getCsvDataMakes = async (req, res) => {
    try {
        // Use a clear key name for the cache
        const cacheKey = 'uniqueMakes';

        // 1. Check if data is cached in Redis
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('Returning unique makes from Redis cache');
            return res.status(200).send(JSON.parse(cachedData));
        }

        // 2. If not found in cache, fetch from MongoDB
        console.log('Cache miss. Querying MongoDB...');
        const uniqueMakes = await CsvData.aggregate([
            { $group: { _id: "$make" } },
            { $project: { _id: 0, make: "$_id" } }
        ]);

        // 3. Store the result in Redis for next time
        await redisClient.set(cacheKey, JSON.stringify(uniqueMakes), {
            EX: 43200
        });

        // 4. Send the fresh data
        return res.status(200).send(uniqueMakes);

    } catch (error) {
        console.error('Error fetching unique makes:', error);
        return res.status(500).json({ error: 'Failed to fetch unique makes' });
    }
};

const getCsvDataYears = async (req, res) => {
    try {

        const selectedMake = req.query.make;

        // Check if the selected make are provided
        if (!selectedMake) {
            return res.status(400).json({ error: 'Selected make are required' });
        }

        // Perform aggregation to get unique years for the selected model
        const years = await CsvData.aggregate([
            { $match: { make: selectedMake } },
            { $group: { _id: "$year" } }, // Group documents by "startYear" field
            { $project: { _id: 0, year: "$_id" } } // Project the "startYear" field without _id
        ]);

        res.status(200).send(years)
    } catch (error) {
        console.error('Error fetching unique start and end years:', error);
        res.status(500).json({ error: 'Failed to fetch unique start and end years' });
    }
}

const getCsvDataModels = async (req, res) => {
    try {
        // Extract the selected make and year value from the query parameters
        const selectedMake = req.query.make;
        const selectedYear = req.query.year;

        // Check if the selected make is provided
        if (!selectedMake || !selectedYear) {
            return res.status(400).json({ error: 'Selected make and year is required' });
        }

        // Perform aggregation to get unique models for the selected make and year
        const uniqueModels = await CsvData.aggregate([
            { $match: { make: selectedMake, year: selectedYear } }, // Filter documents by selected make
            { $group: { _id: "$model" } }, // Group documents by "model" field
            { $project: { _id: 0, model: "$_id" } } // Project the "model" field without _id
        ]);

        res.status(200).send(uniqueModels.map(item => item.model))
    } catch (error) {
        console.error('Error fetching unique models:', error);
        res.status(500).json({ error: 'Failed to fetch unique models' });
    }
}

const getCsvDataEngineTypes = async (req, res) => {
    try {
        const selectedMake = req.query.make;
        const selectedYear = req.query.year;
        const selectedModel = req.query.model;

        // Check if the engine is provided
        if (!selectedMake || !selectedModel || !selectedYear) {
            return res.status(400).json({ error: 'Selected make , year and model is required' });
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

module.exports = {
    getCsvDataMakes,
    getCsvDataYears,
    getCsvDataModels,
    getCsvDataEngineTypes,
    getCsvDataSkus,
    getProductsBySkus
}