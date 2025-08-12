require('dotenv').config();

const express = require('express')
const app = express();
const db = require('./db');


const bodyParser = require('body-parser'); 
app.use(bodyParser.json()); // req.body
const PORT = process.env.PORT || 3000;

// Import the router files
const userRoutes = require('./voting_app/routes/userRoutes');
const candidateRoutes = require('./voting_app/routes/candidateRoutes');

// Use the routers
app.use('/user', userRoutes);
app.use('/candidate', candidateRoutes);


app.listen(PORT, ()=>{
    console.log('Listening on port 3000');
})