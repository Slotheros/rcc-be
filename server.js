const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const registrationRoute = require('./app/routes/registration');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//Routes
app.use('/registration', registrationRoute);

app.get('*', (req, res) => res.send('This is the RCC backend'));

app.listen(3000, () => console.log('Running on port 3000'));
