const express = require('express');
const router = express.Router();
const db = require('../utilities/db');

// Returns all users info
router.get('/', function(req, res) {
  db.query('SELECT * FROM employee', [], function(error, results, fields){
    if(error){
      res.send(error);
    }
    res.send(results);
  });
});

// Return info for specified user
router.get('/:id', function(req, res) {
  res.send('Get specified user');
});

// Add a new user to the database
router.post('/', function(req, res){
  db.query('INSERT INTO employee(fname, lname, email, phone, departmentID, usertypeID, password, activityID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)' , ["Rana", "Vemireddy", "rxv4834@rit.edu", "201-788-9497", 1, 1, "Passw0rd", 1], function(error, results, fields){
    if(error){
      res.send(error);
    }
    res.send(results);
  });
});

module.exports = router;
