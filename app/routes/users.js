const express = require('express');
const router = express.Router();
const passport = require('passport'); 
const db = require('../utilities/db');
const validator = require('../utilities/validator');

/**
 * Endpoint for getting all users
 * Returns all users from the DB
 */
router.get('/getUsers', function(req, res) {
  db.query('SELECT * FROM employee', [], function(error, results, fields){
    if(error){
      return res.status(404).send(error);
    }
    return res.send(results);
  });
});

/**
 * Endpoint for getting a user's information
 * Returns all of user's information
 * @param id - the user's id in the DB
 */
router.get('/getUser/:id', function(req, res) {
  return res.send('Get specified user');
});

/**
 * Endpoint for adding a new user to the DB
 * @param fname - user's first name
 * @param lname - user's last name
 * @param email - user's email address
 * @param phone - user's phone number
 * @param department - user's department
 * @param password - user's password
 */
router.post('/register', function(req, res){
  var fname = req.body.fName; 
  var lname = req.body.lName; 
  var email = req.body.email; 
  var phone = req.body.phoneNum; 
  var department = req.body.department; 
  var password = req.body.password;
  
  // Validate the request data
  var valid = validator.validateRegistrant(fname, lname, email, phone, department, password); 

  valid.then(success => { // Validation passed
    // Insert the registrant into the database
    db.query('INSERT INTO employee(fname, lname, email, phone, departmentID, usertypeID, password, status) ' + 
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [fname, lname, email, phone, department? department.id : null, 3, password, 1], 
      function(error, results, fields){
      if(error){
        error.errMsg = "Database error"; 
        return res.status(403).send(error);
      }
      return res.send(results);
    });
  }, err => { // Validation failed
    return res.status(403).send({errMsg: "Invalid registrant info"}); 
  })
});

/**
 * Exports the router for use in db.js to listen to members of the connection pool
 */
module.exports = router;
