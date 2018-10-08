const db = require('../utilities/db');

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
        if(error){
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

AckPolicy.getPolicyIds = function(eId, ack) {
  return new Promise((resolve, reject) => {
    db.query("SELECT policyID FROM ack_policy WHERE (eID = ?) AND (ack = ?) AND (deleted = 0);", 
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

module.exports = AckPolicy; 