const express = require('express'); 
const db = require('../utilities/db');

function User(fname, lname, email, phone, department, usertype, password){
  this.fname = fname; 
  this.lname = lname; 
  this.email = email; 
  this.phone = phone; 
  this.department = department; 
  this.usertype = usertype; 
  this.password = password; 
  this.validPassword = function(password){
    return this.password == password; 
  }
}

//takes in a user object and searches the employee table for it
User.findOne = function(user, callback){
  var userData; 
  new Promise((resolve, reject) => {
    db.query(`SELECT emp.fname, emp.lname, emp.email, emp.phone, dept.departmentID, dept.department, 
      role.usertypeID, role.usertype, emp.password FROM employee AS emp JOIN 
      department AS dept ON (emp.departmentID = dept.departmentID) JOIN 
      usertype AS role ON (emp.usertypeID = role.usertypeID)
      WHERE(email = ?)`, [user.email], function(error, results, fields){
      if(error){
        reject(error); 
      }
      userData = results[0];
      resolve(); 
    })
  }).then(success => 
    callback(null, new User(userData.fname, userData.lname, userData.email, userData.phone,
      {id: userData.departmentID, name: userData.department}, 
      {id: userData.usertypeID, name: userData.usertype}, userData.password)), 
    err => callback(error, null)
  );
}

module.exports = User; 