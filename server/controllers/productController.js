require('dotenv').config();
const axios = require('axios');
const { Product } = require('../models/productModel');

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

module.exports = {
    syncProductFromShopify,
    deleteProductFromDb,
    productWebhook
};