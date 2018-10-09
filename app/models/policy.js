const db = require('../utilities/db');

function Policy(id, title, description, url, acknowledged, date){
  this.id = id; 
  this.title = title; 
  this.description = description; 
  this.url = url; 
  this.acknowledged = acknowledged; 
  this.date = date; 
}

Policy.create = function(title, description, url, depts, conn){
  return new Promise((resolve, reject) => {
    var deptParams = getDeptParams(depts); 
    var createDate = new Date(Date.now()); 
    createDate = createDate.toISOString().slice(0,10); 

    conn.beginTransaction(function(err){
      if(err){
        reject(err); 
      }
      conn.query('INSERT INTO policy(title, description, url, date, deptSales, deptGarage, deptAdmin, deptFoodBeverage, ' + 
      'deptProduction) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);', [title, description, url, createDate, deptParams[0], deptParams[1], 
      deptParams[2], deptParams[3], deptParams[4]], function(error, results){
        if (error) {
          conn.rollback();
          error.errMsg = "There was an error inserting this record into the database. Please try again."; 
          reject(error);
        }
        resolve(results); 
      });
    });
  });
}

// generate array of 0/1 that states whether this policy is relevant to the corresponding dept
function getDeptParams(depts){
  var deptParams = [0, 0, 0, 0, 0];
  for(dept in depts) {
    switch(depts[dept].id) {
      case 1: 
        deptParams[0] = 1; 
        break; 
      case 2: 
        deptParams[1] = 1; 
        break; 
      case 3: 
        deptParams[2] = 1; 
        break; 
      case 4: 
        deptParams[3] = 1; 
        break; 
      case 5: 
        deptParams[4] = 1; 
        break; 
    }
  }

  return deptParams; 
}

Policy.update = function(policyId, title, description, url, depts) {
  return new Promise((resolve, reject) => {
    //generate the query based on which values are not null
    var query = "UPDATE policy SET ";
    var params = []; 
    query = addToQuery(title, "title", query, params); 
    query = addToQuery(description, "description", query, params); 
    query = addToQuery(url, "url", query, params); 
    if(depts !== null) {
      var deptParams = getDeptParams(depts); 
      query = addToQuery(deptParams[0], "deptSales", query, params); 
      query = addToQuery(deptParams[1], "deptGarage", query, params); 
      query = addToQuery(deptParams[2], "deptAdmin", query, params); 
      query = addToQuery(deptParams[3], "deptFoodBeverage", query, params); 
      query = addToQuery(deptParams[4], "deptProduction", query, params); 
    }
    query = query.slice(0, query.length-1); 
    query += " WHERE (policyId = ?);";
    params.push(policyId); 

    //query the database
    db.query(query, params, function(error, results){
      if(error){
        error.errMsg = "Error updating the policy in the database."; 
        reject(error); 
      } 
      resolve(results); 
    });
  }); 
}

function addToQuery(param, strAdd, query, params){
  if(param !== null){
    query += strAdd + " = ?,"; 
    params.push(param); 
  }
  return query; 
}

Policy.delete = function(policyId){
  return new Promise((resolve, reject) => {
    db.query("UPDATE policy SET deleted=1 WHERE (policyID=?);", [policyId], function(error, results){
      if(error){
        error.errMsg = "Error soft deleting this policy."; 
        reject(error); 
      } 
      resolve(results); 
    });
  });
}

Policy.getPolicies = function(policyIds) {
  var where = "("; 
  var params = [];
  for(i in policyIds){
    params.push(policyIds[i]);
    where += "?,"; 
  }
  where = where.slice(0, where.length-1) + ")"; 
  
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM policy WHERE (policyID IN " + where + ") AND (deleted = 0);", params, function(error, results){
      if(error){
        error.errMsg = "There was an error getting this information from the database. Please try again."; 
        reject(error); 
      } else{
        resolve(results); 
      }
    });
  });
}

module.exports = Policy; 