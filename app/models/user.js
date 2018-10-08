const db = require('../utilities/db');
const bcrypt = require('bcrypt-nodejs'); 

function User(fname, lname, email, phone, department, usertype, password){
  this.fname = fname; 
  this.lname = lname; 
  this.email = email; 
  this.phone = phone; 
  this.department = department; 
  this.usertype = usertype; 
  this.password = password;

  //checks if the password matches the value stored in the db
  this.validPassword = function(password){
    var valid = bcrypt.compareSync(password, this.password);
    return valid; 
  }
}

/**
 * Creates a new user entry in the database.
 * @param {User} user 
 */
User.create = function(user){
  return new Promise((resolve, reject) => {
    //encrypts the password
    user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(8));

    db.query('INSERT INTO employee(fname, lname, email, phone, departmentID, usertypeID, password, status) ' + 
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [user.fname, user.lname, user.email, user.phone, user.department? user.department.id : null, 3, user.password, 1], 
      function(error, results, fields){
        if(error){
          error.errMsg = "There was an error inserting this record into the database. Please try again."; 
          reject(error); 
        }
        resolve(results);
      }
    );
  });
}

/**
 * Gets a list of all users that are in the specified departments and are active employees. 
 * @param {*} departments 
 */
User.findAllInDepts = function(departments, conn){
  //generate array of department ids
  var params = []; 
  var where = "("; 
  for(dept in departments){
    where += "?,"; 
    params.push(departments[dept].id); 
  }
  where = where.slice(0, where.length-1) + ")"; 
  
  //status value
  params.push(1); 

  return new Promise((resolve, reject) => {
    conn.query("SELECT emp.eID, emp.fname, emp.lname, emp.email, emp.phone, dept.departmentID, dept.department, " +  
      "role.usertypeID, role.usertype FROM employee AS emp JOIN " + 
      "department AS dept ON (emp.departmentID = dept.departmentID) JOIN " + 
      "usertype AS role ON (emp.usertypeID = role.usertypeID) WHERE " + 
      "(dept.departmentID IN " + where + ") " +
      "AND (emp.status = 1);", params, function(error, results, fields){
      if(error){
        error.errMsg = "Can't get list of users in this department"; 
        reject(error); 
      }
      var users = []; 
      for(r in results){
        var temp = results[r]; 
        users.push({eId: temp.eID, fname: temp.fname, lname: temp.lname, email: temp.email, phone: temp.phone, 
          department: {id: temp.departmentID, name: temp.department}, 
          usertype: {id: temp.usertypeID, name: temp.usertype}}); 
      }
      resolve(users); 
    });
  });
}

/**
 * Gets a list of the phone numbers of all the users that are in the specified departments 
 * and are active employees. 
 * @param {*} departments 
 */
User.findPhonesInDepts = function(departments){
  //generate array of department ids
  var params = []; 
  var where = "("; 
  for(dept in departments){
    where += "?,"; 
    params.push(departments[dept].id); 
  }
  where = where.slice(0, where.length-1) + ")"; 
  
  //status value
  params.push(1); 

  return new Promise((resolve, reject) => {
    db.query("SELECT phone FROM employee WHERE " + 
      "(departmentID IN " + where + ") " +
      "AND (status = 1);", params, function(error, results, fields){
      if(error){
        error.errMsg = "Can't get list of users in this department"; 
        reject(error); 
      }
      var phoneArray = []; 
      for(r in results){
        phoneArray.push(results[r].phone);
      }
      resolve(phoneArray);
    });
  });
}

/**
 * Takes in a user object and searches the employee table for a match
 * @param {User} user 
 * @param {*} callback 
 */
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
      if(userData == undefined || userData == null){
        reject({errMsg: "This user doesn't exist in the database"});
      } else{
        resolve(); 
      }
    })
  }).then(success => 
    callback(null, new User(userData.fname, userData.lname, userData.email, userData.phone,
      {id: userData.departmentID, name: userData.department}, 
      {id: userData.usertypeID, name: userData.usertype}, userData.password)), 
    err => callback(err, null)
  );
}

/**
 * Returns an object that contains all of the information in a User object sans password.
 * @param {User} user 
 */
User.userWithoutPwd = function(user){
  return {
    fname: user.fname, 
    lname: user.lname, 
    email: user.email, 
    phone: user.phone,
    department: user.department, 
    usertype: user.usertype
  };
}

module.exports = User; 