// is null
// is string
// regex
function validateName(name){
	var regex = '^[A-Za-z][A-Za-z\\\'\\-]+([\\ A-Za-z][A-Za-z\\\'\\-]+)*';
	return validateField(name, regex);
}

function validateEmail(email){
    var regex = '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]' +
        '{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$';
    return validateField(email, regex);
}

function validatePhoneNumber(phone){
    var regex = '^(\\+\\d{1,2})?\\d{10}$';
    return validateField(phone, regex);
}

function validateDepartment(department){
	//obj is not null
	//proprties not null
    if (department) {
    	if (department.name && department.id) {
    		return true;
		}
	}
	return false;
}

function validatePassword(password){
    var regex = '((?=.*\\d)(?=.*[A-Z])(?=.*\\W).{8,})';
    return validateField(password, regex);
}

function validateField(value, regex = null) {
	if (value) {
        if (typeof value === 'string') {
			if (regex) {
				expression = new RegExp(regex);
				return expression.test(value);
			}
        }
	}
	return false;
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