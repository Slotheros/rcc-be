const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const usersRoute = require('./app/routes/users');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Fixes the CORS issue. Don't ask me how it works.
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

// Routes
app.use('/users', usersRoute);

app.get('*', (req, res) => res.send('This is the RCC backend'));

app.listen(3000, () => console.log('Running on port 3000'));
