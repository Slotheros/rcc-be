function validateName(name){
	return true; 
}

function validateEmail(email){
	return true; 
}

function validatePhoneNumber(phone){
	return true; 
}

function validateDepartment(department){
	return true; 
}

function validatePassword(password){
	return true; 
}

function validateRegistrant(fname, lname, email, phone, department, password){
	return new Promise((resolve, reject) => {
		//do all of the validations and if any of them fail reject
		var validName = (validateName(fname) && validateName(lname)); 
		var validEmail = validateEmail(email); 
		var validPhone = validatePhoneNumber(phone); 
		var validDepartment = validateDepartment(department);
		var validPassword = validatePassword(password); 

		if(validName && validEmail && validPhone && validDepartment && validPassword){
				resolve();
		} else{
				reject(); 
		}
	}); 
}

module.exports = {
	validateRegistrant
}