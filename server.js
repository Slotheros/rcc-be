const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const usersRoute = require('./app/routes/users');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use('/users', usersRoute);

app.get('*', (req, res) => res.send('This is the RCC backend'));

app.listen(3000, () => console.log('Running on port 3000'));
