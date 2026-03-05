const { BikeCsvData } = require('../../models/bike/csvDataModel');
const { Product } = require('../../models/productModel');
const { redisClient } = require('../../config/redis');
const async = require('async');

const getCsvDataMakes = async (req, res) => {
    try {
        // Use a clear key name for the cache
        const cacheKey = 'bikeUniqueMakes';

        // 1. Check if data is cached in Redis
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('Returning unique makes from Redis cache');
            return res.status(200).send(JSON.parse(cachedData));
        }

        // 2. If not found in cache, fetch from MongoDB
        console.log('Cache miss. Querying MongoDB...');
        const bikeUniqueMakes = await BikeCsvData.aggregate([
            { $group: { _id: "$make" } },
            { $project: { _id: 0, make: "$_id" } }
        ]);

        // 3. Store the result in Redis for next time
        await redisClient.set(cacheKey, JSON.stringify(bikeUniqueMakes), {
            EX: 43200
        });

        // 4. Send the fresh data
        return res.status(200).send(bikeUniqueMakes);

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
        const years = await BikeCsvData.aggregate([
            { $match: { make: selectedMake } },
            { $group: { _id: "$years" } }, // Group documents by "startYear" field
            { $project: { _id: 0, years: "$_id" } } // Project the "startYear" field without _id
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
        const uniqueModels = await BikeCsvData.aggregate([
            { $match: { make: selectedMake, years: selectedYear } }, // Filter documents by selected make
            { $group: { _id: "$model" } }, // Group documents by "model" field
            { $project: { _id: 0, model: "$_id" } } // Project the "model" field without _id
        ]);

        res.status(200).send(uniqueModels.map(item => item.model))
    } catch (error) {
        console.error('Error fetching unique models:', error);
        res.status(500).json({ error: 'Failed to fetch unique models' });
    }
}

const getCsvDataSubModels = async (req, res) => {
  try {
    // Extract the selected make and year value from the query parameters
    const selectedMake = req.query.make;
    const selectedYear = req.query.year;
    const selectedModel = req.query.model;

    // Check if the selected make is provided
    if (!selectedMake || !selectedYear || !selectedModel) {
      return res
        .status(400)
        .json({ error: "Selected make, year and model is required" });
    }

    // Perform aggregation to get unique models for the selected make and year
    const uniqueSubModels = await BikeCsvData.aggregate([
      { $match: { make: selectedMake, years: selectedYear, model: selectedModel } }, // Filter documents by selected make
      { $group: { _id: "$subModel" } }, // Group documents by "model" field
      { $project: { _id: 0, subModel: "$_id" } }, // Project the "model" field without _id
    ]);
    res.status(200).send(uniqueSubModels.map((item) => item.subModel != "" ? item.subModel : 'all'));
  } catch (error) {
    console.error("Error fetching unique sub models:", error);
    res.status(500).json({ error: "Failed to fetch unique sub models" });
  }
};

const getCsvDataSkus = async (req, res) => {
    try {
        const selectedMake = req.query.make;
        const selectedYear = req.query.year;
        const selectedModel = req.query.model;
        let selectedSubModel = req.query.sub_model;

        // Check all values are provided
        if (!selectedMake || !selectedModel || !selectedYear || !selectedSubModel) {
            return res.status(400).json({ error: 'Selected make , year, model and sub_model are required' });
        }

        selectedSubModel = selectedSubModel == 'all' ? '' : selectedSubModel;

        // Perform aggregation to get unique SKUs for the selected dropdown values
        const uniqueSKUs = await BikeCsvData.aggregate([
            { $match: { make: selectedMake, years: selectedYear, model: selectedModel, subModel: selectedSubModel } },
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
        const {  make, year, model, skus } = req.body;

        let subModel = req.body.subModel == 'all' ? '' : req.body.subModel;

        let csvQuery = { 'sku': { $in: skus } };
        if (make) csvQuery.make = make;
        if (year) csvQuery.years = year;
        if (model) csvQuery.model = model;
        csvQuery.subModel = subModel;

        let productQuery = { 'variants.sku': { $in: skus } };

        // Fetching data concurrently using async.parallel
        async.parallel({
            csvDataResults: async () => await BikeCsvData.find(csvQuery),
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
    getCsvDataSubModels,
    getCsvDataSkus,
    getProductsBySkus
}