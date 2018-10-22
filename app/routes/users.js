const express = require('express');
const router = express.Router();
const db = require('../utilities/db');
const validator = require('../utilities/validator');
var User = require('../models/user');
var Policy = require('../models/policy');
var AckPolicy = require('../models/ackPolicy');
var Survey = require('../models/survey'); 
var AckSurvey = require('../models/ackSurvey'); 
var multer = require('multer');
var path = require('path');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './app/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '.csv'); 
  }
});
var upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if(ext !== '.csv') {
        return callback(new Error('Only csvs are allowed'));
    }
    return callback(null, true);
  }  
}).single('csvCompare');
const fs = require('fs'); 
const parser = require('csv-parser');

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
    var policyIds; 

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
      //save the policyids 
      policyIds = success; 
      //get surveys relevant to this employee
      return Survey.getSurveyIdsByDept(department.id, conn); 
    })

    promise = promise.then(success => {
      //create ack_policy entries for new employee
      return Promise.all([AckPolicy.newEmployee(policyIds, user, conn), AckSurvey.newEmployee(success, user, conn)]);
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

/**
 * Uploads a csv to the server, and processes its contents. 
 * Returns two lists: 1) list of employees that were listed in the csv file but
 * weren't in our database 2) list of employees in our database that weren't
 * in the csv file
 */
router.post('/csvCompare', function(req, res){
  upload(req, res, function (err) {
    if (err) {
      // An error occurred when uploading
      return res.status(422).send({msg: "An error occured with the CSV upload."})
    }  
    // No error occured.
    var csvData = [];
    var emails = ""; 
    var phones = ""; 
    var stream = fs.createReadStream(req.file.path)
      .pipe(parser({delimiter: ','}))
      .on('data', function(csvRow){
        csvRow['Home Cell'] = "+" + csvRow['Home Cell'].replace(/-/g, '');
        csvData.push(csvRow); 
        emails += csvRow['Personal eMail'] + ","; 
        phones += csvRow['Home Cell'] + ",";
      })
      .on('end', function(){
        emails = emails.slice(0, emails.length-1); 
        phones = phones.slice(0, phones.length-1);
        return csvComparison(res, csvData, emails, phones); 
      });
  }); 
}); 

function csvComparison(res, csvData, emails, phones) {
  db.getConnection((err, conn) => {
    if(err){
      return res.status(503).send({errMsg: "Unable to establish connection to the database"});
    }
    conn.beginTransaction(); 
    Promise.all([User.findAllNotInDb(csvData, conn), User.findAllNotInCsv(emails, phones, conn)]).then(success => {
      conn.commit(); 
      conn.release(); 
      return res.send(success); 
    }, error => {
      conn.rollback(); 
      conn.release(); 
      return res.status(500).send(error); 
    });
  });
}

module.exports = router;
