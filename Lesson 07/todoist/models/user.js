const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

// User schema.
const userSchema = new mongoose.Schema({
	username: {type: String, required: true},
	email: {type: String, required: true},
	registerDate: {type: Date, required: true},
	lastVisitDate: Date,
	firstName: String,
	lastName: String,
	age: Number,
	mainRole: {type: String, enum: ['Admin', 'User'], required: true}
});

userSchema.plugin(passportLocalMongoose);

// User params.
const params = {
	username: {name: 'username', regexp: /^[\w|\d]{3,}$/},
	password: {name: 'password', regexp: /.{6,}/},
	email: {name: 'email', regexp: /^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/},
	firstName: {name: 'firstName', regexp: /^[a-zа-яё\-]{2,}$/i},
	lastName: {name: 'lastName', regexp: /^[a-zа-яё\-]{2,}$/i},
	age: {name: 'age', regexp: /^\d{2,3}$/}
};

// Param sets for different actions.
const registerParams = [params.username, params.password, params.email];
const updateParams = [
	params.email, params.firstName, params.lastName, params.age
];

// Validate user params.
function validateParams(paramSet, body, allowEmpty = false) {
	const invalidParams = [];

	// Required params validation.
	paramSet.forEach((param) => {
		const value = (body[param.name] ? body[param.name] : '');

		if (!(allowEmpty && !value) && !param.regexp.test(value.trim())) {
			invalidParams.push(param.name);
		}
	});

	return invalidParams;
}


// Module export definitions.
module.exports = {
	params: {
		register: registerParams,
		update: updateParams
	},
	fn: {
		validateParams
	},
	model: mongoose.model('User', userSchema)
};
