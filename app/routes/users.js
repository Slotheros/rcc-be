const express = require('express');
const router = express.Router();
const db = require('../utilities/db');
const validator = require('../utilities/validator');
var customErrorMsg = "";


// Returns all users info
router.get('/', function(req, res) {
  db.query('SELECT * FROM employee', [], function(error, results, fields){
    if(error){
      return res.status(404).send(error);
    }
    return res.send(results);
  });
});

// Return info for specified user
router.get('/:id', function(req, res) {
  return res.send('Get specified user');
});

// Add a new user to the database
router.post('/', function(req, res){
  var fname = req.body.fName; 
  var lname = req.body.lName; 
  var email = req.body.email; 
  var phone = req.body.phoneNum; 
  var department = req.body.department; 
  var password = req.body.password;

  
  //validate the request data
  var valid = validator.validateRegistrant(fname, lname, email, phone, department, password); 

  valid.then(success => {
    //validation passed
    //insert the registrant into the database
    db.query('INSERT INTO employee(fname, lname, email, phone, departmentID, usertypeID, password, status) ' + 
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [fname, lname, email, phone, department? department.id : null, 3, password, 1], 
      function(error, results, fields){
      if(error){
        customErrorMsg = "There was an error inserting this record into the database. Please try again."
        return res.status(403).send(customErrorMsg);
      }
      return res.send(results);
    });
  }, err => {
    //validation failed
    return res.status(403).send("Invalid registrant info"); 
  })
});

module.exports = router;
