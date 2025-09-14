const express = require('express');
const bodyParser = require('body-parser');
const apiRouter = require("./routes");
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.text());

const { PORT } = require('./config/server.config');
const BaseError = require('./errors/base.error');
const errorHandler = require('./utils/errorHandler');
const dbConnector = require('./config/db.config');

app.use("/api",apiRouter);

app.get('/ping', (req,res)=>{
    return res.json({message: "Problem service is alive"});
});

app.use(errorHandler); 

app.listen(PORT, async ()=>{
    console.log(`Server started at PORT ${PORT}`);
    await dbConnector.connect();
    console.log("Successfully connected to db");
});


