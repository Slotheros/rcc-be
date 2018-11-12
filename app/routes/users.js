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
  db.query("SELECT emp.eID, emp.fname, emp.lname, emp.email, emp.phone, dept.departmentID, dept.department, " +  
  "role.usertypeID, role.usertype, emp.status FROM employee AS emp JOIN " + 
  "department AS dept ON (emp.departmentID = dept.departmentID) JOIN " + 
  "usertype AS role ON (emp.usertypeID = role.usertypeID);", [], function(error, results, fields){
    if(error){
      error.errMsg = "Can't list of users"; 
      return res.status(404).send(error);
    }
    return res.send(results);
  });
});

/**
 * Gets the phone numbers of all active users in the given departments. 
 */
router.post('/getPhoneNumbersByDepts', function(req, res) {
  var depts = req.body;
  User.findPhonesInDepts(depts).then(success => {
    return res.send(success); 
  }, error => {
    return res.status(403).send(error); 
  }); 
})

/**
 * Gets all active users present in the following departments. 
 */
router.post('/getActiveUsersByDepts', function(req, res) {
  var depts = req.body.departments;
  
  db.getConnection((err, conn) => {
    if(err){
      return res.status(400).send({errMsg: "Unable to establish connection to the database"});
    }
    User.findAllActiveInDepts(depts, conn).then(success => {
      conn.release(); 
      return res.send(success); 
    }, error => {
      conn.release(); 
      return res.status(403).send(error); 
    }); 
  });
});

/**
 * Gets all users present in the following departments. 
 */
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
  var id = req.params.id; 

  db.query("SELECT emp.eID, emp.fname, emp.lname, emp.email, emp.phone, dept.departmentID, dept.department, " +  
  "role.usertypeID, role.usertype, emp.status FROM employee AS emp JOIN " + 
  "department AS dept ON (emp.departmentID = dept.departmentID) JOIN " + 
  "usertype AS role ON (emp.usertypeID = role.usertypeID) WHERE (emp.eID = ?);", [id], 
  function(error, results, fields){
    if(error){
      error.errMsg = "Can't list of users"; 
      return res.status(404).send(error);
    }
    return res.send(results);
  });
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
      return Promise.all([AckPolicy.createForEmployee(policyIds, user.insertId, conn), 
        AckSurvey.createForEmployee(success, user.insertId, conn)]);
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

/**
 * Compares the employees listed in the CSV with those present in our database. 
 */
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

router.post('/setActive', function(req, res){
  var eId = req.body.eId; 
  var deptId = req.body.deptId; 

  db.getConnection((err, conn) => {
    if(err){
      return res.status(503).send({errMsg: "Unable to establish connection to the database"});
    }
    conn.beginTransaction(); 
    
    var policyIds = [];
    var surveyIds = []; 
    //set employee status to active(1)
    var promise = User.setStatus(eId, 1, conn).then(success => {
      // get policy ids relevant to this employee
      return Policy.getPolicyIdsByDept(deptId, conn);
    }); 
      
    promise = promise.then(success => {
      policyIds = success; 
      //get survey ids relevant to this employee
      return Survey.getSurveyIdsByDept(deptId, conn); 
    });
    
    promise = promise.then(success => {
      surveyIds = success; 
      return Promise.all([AckPolicy.createForEmployee(policyIds, eId, conn), 
        AckSurvey.createForEmployee(surveyIds, eId, conn)]);
    });

    promise.then(success => {
      conn.commit(); 
      conn.release(); 
      return res.send(success); 
    });

    promise.catch(error => {
      conn.rollback(); 
      conn.release(); 
      return res.status(500).send(error); 
    });
  });
});

router.post('/setInactive', function(req, res){
  var eId = req.body.eId; 

  db.getConnection((err, conn) => {
    if(err){
      return res.status(503).send({errMsg: "Unable to establish connection to the database"});
    }
    conn.beginTransaction(); 
    
    //set employee status to inactive(0)
    var promise = User.setStatus(eId, 0, conn).then(success => {
      //soft delete all policy and survey acks for the employee
      return Promise.all([AckPolicy.deleteAllForEmployee(eId, conn), 
        AckSurvey.deleteAllForEmployee(eId, conn)]);
    });

    promise.then(success => {
      conn.commit(); 
      conn.release(); 
      return res.send(success); 
    });

    promise.catch(error => {
      conn.rollback(); 
      conn.release(); 
      return res.status(500).send(error); 
    });
  });
});

/**
 * Allows the admin to change an employees' usertype.
 */
router.post('/setUsertype', function(req, res){
  var eId = req.body.eId; 
  var usertypeId = req.body.usertypeId; 

  db.query('UPDATE employee SET usertypeID = ? WHERE (eId = ?)', [usertypeId, eId], function(error, results){
    if(error){
      error.errMsg = "Unable to set the employee's usertype"; 
      return res.status(500).send(error); 
    }

    return res.send(results); 
  });
});

/**
 * Allows the admin to change an employees' department.
 */
router.post('/setDepartment', function(req, res){
  var eId = req.body.eId; 
  var deptId = req.body.deptId; 

  db.getConnection((err, conn) => {
    if(err){
      return res.status(503).send({errMsg: "Unable to establish connection to the database"});
    }
    conn.beginTransaction(); 
    //set employee's dept to the new dept
    var policyIds = [];
    var surveyIds = [];
    var promise = User.setDept(eId, deptId, conn).then(success => {
      //soft deletes all existing acks for the employee
      return Promise.all([AckPolicy.deleteAllForEmployee(eId, conn),
        AckSurvey.deleteAllForEmployee(eId, conn)]); 
    });

    promise = promise.then(success => {
      // get policy ids relevant to this employee
      return Policy.getPolicyIdsByDept(deptId, conn);
    }); 
      
    promise = promise.then(success => {
      policyIds = success; 
      //get survey ids relevant to this employee
      return Survey.getSurveyIdsByDept(deptId, conn); 
    });

    promise =promise.then(success => {
      //generate the new acks for the employee
      return Promise.all([AckPolicy.createForEmployee(policyIds, eId, conn), 
        AckSurvey.createForEmployee(surveyIds, eId, conn)]);
    });

    promise.then(success => {
      conn.commit(); 
      conn.release(); 
      return res.send(success); 
    });

    promise.catch(error => {
      conn.rollback(); 
      conn.release(); 
      return res.status(500).send(error); 
    });
  });
});

module.exports = router;
