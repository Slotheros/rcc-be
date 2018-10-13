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
    conn.beginTransaction(); 
    var policyId;
    var employees; 
    var promise = Policy.create(title, description, url, depts, conn).then(success => {
      policyId = success.insertId; 
      return User.findAllInDepts(depts, conn); 
    }, error => {
      conn.rollback(); 
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

  db.getConnection((err, conn) => {
    if(err){
      return res.status(400).send({errMsg: "Unable to establish connection to the database"});
    }
    conn.beginTransaction(); 
    //get policyIds for all the unacknowledged policies
    var promise = AckPolicy.getPolicyIds(eId, 0, conn).then(success => {
      return Policy.getPolicies(success, conn); 
    }, error => {
      conn.rollback(); 
      conn.release(); 
      return res.status(400).send(error); 
    });
    
    //get the policies
    promise.then(success => {
      conn.commit(); 
      conn.release(); 
      return res.send(success);
    }, error => {
      conn.rollback(); 
      conn.release(); 
      return res.status(400).send(error); 
    });
  });
});

router.get('/getAcknowledged/:eId', function(req, res){
  var eId = req.params.eId; 

  db.getConnection((err, conn) => {
    if(err){
      return res.status(400).send({errMsg: "Unable to establish connection to the database"});
    }
    conn.beginTransaction(); 
    //get policyIds for all the acknowledged policies
    var promise = AckPolicy.getPolicyIds(eId, 1, conn).then(success => {
      return Policy.getPolicies(success, conn); 
    }, error => {
      conn.rollback(); 
      conn.release(); 
      return res.status(400).send(error); 
    });
    
    //get the policies
    promise.then(success => {
      conn.commit(); 
      conn.release(); 
      return res.send(success);
    }, error => {
      conn.rollback(); 
      conn.release(); 
      return res.status(400).send(error); 
    });
  });
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

  db.getConnection((err, conn) => {
    if(err){
      return res.status(400).send({errMsg: "Unable to establish connection to the database"});
    }
    conn.beginTransaction(); 

    var relevantDepts = []; 
    var irrelevantDepts = []; 

    var promise = Policy.update(policyId, title, description, url, depts, conn).then(success => {
      //if there are no dept changes
      if(depts === null){
        return Promise.resolve(success); 
      } 

      //otherwise perform the process to insert/update ack_policy entries based on dept changes
      for(i in success){
        if(success[i].relevant == 1){
          relevantDepts.push(success[i]); 
        } else{
          irrelevantDepts.push(success[i]); 
        }
      }
      
      return Promise.all([AckPolicy.makeDeptsRelevant(relevantDepts, policyId, conn), 
        AckPolicy.makeDeptsIrrelevant(irrelevantDepts, policyId, conn)]); 
    });

    promise.then(success => {
      conn.commit(); 
      conn.release(); 
      return res.send(success); 
    });

    promise.catch(error => {
      conn.rollback(); 
      conn.release(); 
      return res.status(400).send(error); 
    });
  }); 
});

router.post('/delete', function(req, res) {
  var policyId = req.body.policyId; 

  db.getConnection((err, conn) => {
    if(err){
      return res.status(400).send({errMsg: "Unable to establish connection to the database"});
    }
    conn.beginTransaction(); 
    //delete the policy
    var promise = Policy.delete(policyId, conn).then(success => {
      return AckPolicy.deletePolicies(policyId, conn);
    }, error => {
      conn.rollback(); 
      conn.release(); 
      return res.status(400).send(error); 
    });
    
    //delete all related entries in the ack_policy table
    promise.then(success => {
      conn.commit(); 
      conn.release(); 
      return res.send(success); 
    }, error => {
      conn.rollback(); 
      conn.release(); 
      return res.status(400).send(error); 
    });
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