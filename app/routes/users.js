const express = require('express');
const router = express.Router();
const db = require('../utilities/db');
const validator = require('../utilities/validator');
var User = require('../models/user');
var Policy = require('../models/policy');
var AckPolicy = require('../models/ackPolicy');
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './app/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '.csv'); 
  }
})
var upload = multer({ storage: storage }).single('csvCompare');

/**
 * Endpoint for getting all users
 * Returns all users from the DB
 */
router.get('/getUsers', function(req, res) {
  db.query('SELECT * FROM employee', [], function(error, results, fields){
    if(error){
      error.errMsg = "Can't list of users"; 
      return res.status(404).send(error);
    }
    return res.send(results);
  });
});


router.post('/getPhoneNumbersByDepts', function(req, res) {
  var depts = req.body;
  User.findPhonesInDepts(depts).then(success => {
    return res.send(success); 
  }, error => {
    return res.status(403).send(error); 
  }); 
})


router.post('/getUsersByDepts', function(req, res) {
  var depts = req.body.departments;
  
  db.getConnection((err, conn) => {
    if(err){
      return res.status(400).send({errMsg: "Unable to establish connection to the database"});
    }
    User.findAllInDepts(depts, conn).then(success => {
      conn.release(); 
      return res.send(success); 
    }, error => {
      conn.release(); 
      return res.status(403).send(error); 
    }); 
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

  
  //validate the request data
  var promise = validator.validateRegistrant(fname, lname, email, phone, department, password); 

  db.getConnection((err, conn) => {
    if(err){
      return res.status(503).send({errMsg: "Unable to establish connection to the database"});
    }

    conn.beginTransaction(); 
    var user; 

    //validation
    promise = promise.then(success => {
      //create User
      user = new User(null, fname, lname, email, phone, department, null, password); 
      //insert the registrant into the database
      return User.create(user, conn);
    }, err => { 
      // Validation failed
      conn.rollback(); 
      conn.release(); 
      return res.status(403).send({errMsg: "Invalid registrant info"}); 
    }); 

    promise = promise.then(success => {
      //save the user info
      user = success; 
      //get policies relevant to this employee
      return Policy.getPolicyIdsByDept(department.id, conn); 
    });  

    promise = promise.then(success => {
      //create ack_policy entries for new employee
      return AckPolicy.newEmployee(success, user, conn);
    });

    promise = promise.then(success => {
      conn.commit(); 
      conn.release(); 
      return res.send({msg: "Successfully registered employee."}); 
    });

    promise.catch(error => {
      conn.rollback(); 
      conn.release(); 
      return res.status(500).send(error); 
    }); 
  });
});

router.post('/csvCompare', function(req, res){
  upload(req, res, function (err) {
    if (err) {
      // An error occurred when uploading
      return res.status(422).send({msg: "An error occured with the CSV upload."})
    }  
   // No error occured.
    var path = req.file.path;
    return res.send({msg: "Upload Completed for " + path}); 
  }); 
}); 

module.exports = router;
