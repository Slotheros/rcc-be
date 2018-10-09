const express = require('express');
const router = express.Router();
const db = require('../utilities/db'); 
var Policy = require('../models/policy');
var User = require('../models/user'); 
var AckPolicy = require('../models/ackPolicy');

router.post('/create', function(req, res){
  var title = req.body.title; 
  var description = req.body.description; 
  var url = req.body.url; 
  var depts = req.body.depts; 

  // validate the request params

  db.getConnection((err, conn) => {
    if(err){
      return res.status(400).send({errMsg: "Unable to establish connection to the database"});
    }

    var policyId;
    var employees; 
    var promise = Policy.create(title, description, url, depts, conn).then(success => {
      policyId = success.insertId; 
      return User.findAllInDepts(depts, conn); 
    }, error => {
      conn.release(); 
      return res.status(403).send(error); 
    });
    
    // get all employees in the given depts
    promise = promise.then(success => {
      employees = success; 
      return AckPolicy.createPolicies(policyId, employees, conn);
    }, error => {
      conn.rollback(); 
      conn.release(); 
      return res.status(403).send(error); 
    });

    // create a policy acknowledgement for each employee
    promise.then(success => {
      conn.commit(); 
      conn.release(); 
      return res.send(success); 
    }, error => {
      conn.rollback(); 
      conn.release(); 
      return res.status(403).send(error); 
    });
  });
});

router.get('/getUnacknowledged/:eId', function(req, res){
  var eId = req.params.eId; 

  var promise = AckPolicy.getPolicyIds(eId, 0).then(success => {
    // gets policies for each policyId returned
    return Policy.getPolicies(success); 
  }, error => {
    return res.status(400).send(error); 
  });

  promise.then(success => {
    return res.send(success);
  }, error => {
    return res.status(400).send(error); 
  })
});

router.get('/getAcknowledged/:eId', function(req, res){
  var eId = req.params.eId; 

  var promise = AckPolicy.getPolicyIds(eId, 1).then(success => {
    // gets policies for each policyId returned
    return Policy.getPolicies(success); 
  }, error => {
    return res.status(400).send(error); 
  });

  promise.then(success => {
    return res.send(success);
  }, error => {
    return res.status(400).send(error); 
  })
});

router.post('/update', function(req, res) {
  var policyId = req.body.policyId; 
  var title = req.body.title ? req.body.title : null; 
  var description = req.body.description ? req.body.description : null; 
  var url = req.body.url ? req.body.url : null; 
  var depts = req.body.depts ? req.body.depts : null; 

  if(title === null && description === null && url === null && depts === null){
    return res.send("Nothing needs to be updated"); 
  }

  Policy.update(policyId, title, description, url, depts).then(success => {
    return res.send(success); 
  }, error => {
    return res.status(400).send(error); 
  });
});

router.post('/delete', function(req, res) {
  var policyId = req.body.policyId; 

  var promise = Policy.delete(policyId).then(success => {
    return AckPolicy.deletePolicies(policyId);
  }, error => {
    return res.status(400).send(error); 
  });

  promise.then(success => {
    return res.send(success); 
  }, error => {
    return res.status(400).send(error); 
  });
});

router.post('/acknowledge', function(req, res) {
  var policyId = req.body.policyId; 
  var eId = req.body.eId; 

  AckPolicy.acknowledgePolicy(eId, policyId).then(success => {
    return res.send(success); 
  }, error => {
    return res.status(400).send(error); 
  }); 
});

module.exports = router; 