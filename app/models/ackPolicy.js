const db = require('../utilities/db');
const User = require('./user'); 

function AckPolicy(eId, acknowledged, policyId){
  this.eId = eId; 
  this.acknowledged = acknowledged; 
  this.policyId = policyId; 
}

AckPolicy.createPolicies = function(policyId, employees, conn){
  return new Promise((resolve, reject) => {
    var count = 0; 
    for(emp in employees) {
      conn.query("INSERT INTO ack_policy(eID, ack, policyID, deleted) " + 
      "VALUES(?, ?, ?, ?);", [employees[emp].eId, 0, policyId, 0], function(error, results){
        count++; 
        if(error) {
          error.errMsg = "There was an error inserting this record into the database. Please try again.";
          reject(error); 
        } else{
          //reaches end of list so it resolved successfully
          if(count == employees.length-1){
            resolve({success: "Successfully created acknowledgements for policy for all relevant users."}); 
          }
        }
      });
    }
  });
}

AckPolicy.deletePolicies = function(policyId, conn) {
  return new Promise((resolve, reject) => {
    conn.query("UPDATE ack_policy SET deleted=1 WHERE (policyID=?);", [policyId], function(error, results){
      if(error){
        error.errMsg = "Error soft deleting policy acknowledgements."; 
        reject(error);
      }
      resolve(results); 
    })
  });
}

AckPolicy.getPolicyIds = function(eId, ack, conn) {
  return new Promise((resolve, reject) => {
    conn.query("SELECT policyID FROM ack_policy WHERE (eID = ?) AND (ack = ?) AND (deleted = 0);", 
    [eId, ack], function(error, results){
      if(error){
        error.errMsg = "There was an error getting this information from the database. Please try again."; 
        reject(error); 
      } else{
        var policyIds = []; 
        for(r in results){
          policyIds.push(results[r].policyID);
        }
        resolve(policyIds); 
      }
    })
  }); 
}

AckPolicy.acknowledgePolicy = function(eId, policyId){
  return new Promise((resolve, reject) => {
    db.query("UPDATE ack_policy SET ack=1 WHERE (eID = ?) AND (policyID = ?);", [eId, policyId], function(error, results){
      if(error){
        error.errMsg = "Error acknowledging the policy in the database."; 
        reject(error); 
      }
      resolve(results); 
    });
  });
}

AckPolicy.makeDeptsRelevant = function(relevantDepts, policyId, conn) {
  return new Promise((resolve, reject) => {
    //get list of users from these depts
    var employees = []; 
    User.findAllInDepts(relevantDepts, conn).then(success => {
      employees = success; 
      var count = 0; 
      //perform an insertion/update for each employee
      for(e in employees){
        conn.query("INSERT INTO ack_policy (eID, ack, policyID, deleted) VALUES (?, ?, ?, ?) ON DUPLICATE KEY " + 
          "UPDATE deleted = 0;", [employees[e].eId, 0, policyId, 0, 
          employees[e].eId, policyId], function(error, results){
            if(error){
              error.errMsg = "Error performing insertion/update in makeDeptsRelevant()"; 
              reject(error); 
            }
            count++; 
            if(count == employees.length){
              resolve("Successfully inserted/updated ack_policy entries to make depts relevant.");
            }
          });
      }
    }, error => {
      reject(error); 
    });
  });
}

AckPolicy.makeDeptsIrrelevant = function(irrelevantDepts, policyId, conn) {
  return new Promise((resolve, reject) => {
    //get list of users from these depts
    var employees = []; 
    User.findAllInDepts(irrelevantDepts, conn).then(success => {
      employees = success; 
      var count = 0; 
      //perform an update for each employee that sets 'deleted' to 1
      for(e in employees){
        conn.query("UPDATE ack_policy SET deleted=1 WHERE (eID = ?) AND (policyID = ?);", [employees[e].eId, policyId], 
          function(error, results){
            if(error){
              error.errMsg = "Error performing update in makeDeptsIrrelevant()"; 
              reject(error); 
            }
            count++; 
            if(count == employees.length){
              resolve("Successfully updated ack_policy entries to make depts irrelevant.");
            }
          }); 
      }
    }, error => {
      error.errMsg = "Error"; 
      reject(error); 
    });
  });
}

module.exports = AckPolicy; 