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
    // generate array of 0/1 that states whether this policy is relevant to the corresponding dept
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

    conn.beginTransaction(function(err){
      if(err){
        reject(err); 
      }
      conn.query('INSERT INTO policy(title, description, url, deptSales, deptGarage, deptAdmin, deptFoodBeverage, ' + 
      'deptProduction) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [title, description, url, deptParams[0], deptParams[1], 
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

module.exports = Policy; 