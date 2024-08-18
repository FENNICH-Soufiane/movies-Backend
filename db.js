require('dotenv').config();

const mongoose = require('mongoose');

mongoose
    .connect(process.env.mongoDB)
    .then(() => {
        console.log('db is connected!')
    })
    .catch((ex) => {
        console.log('db connection failed: ', ex)
    })