const express = require('express');
const connectDb = require('./utils/db');
const cors = require('cors');
const app = express();
const helmet = require('helmet');
const path = require('path');
const router = require('./router/auth-routes');
const cookieParser = require('cookie-parser');
require('dotenv').config();

app.use(express.json());
app.use(cookieParser());

app.use(helmet());

// Extend the server timeout
app.use((req, res, next) => {
    req.setTimeout(1000000); // 16.66 minute
    res.setTimeout(1000000);
    next();
});

app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use("/api/", router);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDb().then(() => {
    const port = 5000;
    app.listen(port, () => {
        console.log(`server started at port: ${port}.`)
    })
}).catch((err) => console.log(err, "ERROR in Connection"))
