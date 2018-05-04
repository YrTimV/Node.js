const mongoose = require('mongoose');
const moment = require('moment');

// moment(value.create_time).format('YYYY/MM/DD HH:mm:ss');
// Task schema.
const taskSchema = new mongoose.Schema({
	username: {type: String, required: true},
	createDate: {type: Date, required: true},
	updateDate: Date,
	completeDate: Date,
	priority: {type: String, enum: ['low', 'normal', 'high'], required: true},
	text: String
});

// Task params.
const params = {
	username: {name: 'username', regexp: /^[\w|\d]{3,}$/},
	priority: {name: 'priority', regexp: /^(low|normal|high)$/i},
	title: {name: 'title', regexp: /^\w+$/},
	text: {name: 'text', regexp: /.*/}
};

// Param sets for different actions.
const commonParams = [
	params.username, params.priority, params.title, params.text
];

// Validate task params.
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
		common: commonParams
	},
	fn: {
		validateParams
	},
	model: mongoose.model('Task', taskSchema)
};
