const express = require('express');
const router = express.Router();
const passport = require('passport'); 
const db = require('../utilities/db');
const validator = require('../utilities/validator');

//login
router.post('/login', passport.authenticate('local-login'), function(req, res){
  //send all the user info except for the password
  var user = req.user; 
  var data = {
    "fname": user.fname, 
    "lname": user.lname, 
    "email": user.email, 
    "phone": user.phone, 
    "department": user.department, 
    "usertype": user.usertype, 
  }
  res.send(data); 
});

// handle logout
router.post("/logout", function(req, res) {
  req.logOut();
  res.send(200);
})

// loggedin
router.get("/loggedin", function(req, res) {
  res.send(req.isAuthenticated() ? req.user : '0');
});

module.exports = router; 