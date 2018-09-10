const express = require('express');
const router = express.Router();
const passport = require('passport'); 
const db = require('../utilities/db');
const validator = require('../utilities/validator');
var User = require('../models/user');

//login
router.post('/login', passport.authenticate('local-login'), function(req, res){
  //send all the user info except for the password
  res.send(User.userWithoutPwd(req.user)); 
});

// handle logout
router.post("/logout", function(req, res) {
  req.logOut();
  res.send(200);
})

// loggedin
router.get("/loggedin", function(req, res) {
  res.send(req.isAuthenticated() ? User.userWithoutPwd(req.user) : '0');
});

module.exports = router; 