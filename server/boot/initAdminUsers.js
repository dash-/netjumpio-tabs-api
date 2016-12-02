///
// Dependencies
///

const Promise = require('bluebird');
const _ = require('lodash');


///
// Configuration
///

const allAdminUsers = [{
	name: process.env.NETJUMP_IO__TABSETS__ADMIN_NAME,
	logoUrl: '',
	username: process.env.NETJUMP_IO__TABSETS__ADMIN_USER,
	email: process.env.NETJUMP_IO__TABSETS__ADMIN_EMAIL,
	password: process.env.NETJUMP_IO__TABSETS__ADMIN_PASS,
}];


///
// Main
///

module.exports = function initAdminUsers(app) {
	const Person = app.models.person;
	const Role = app.models.Role;
	const RoleMapping = app.models.RoleMapping;

	(getNewAdminUsers({})
		.then(addNewAdminUsers)
		.then(getOrCreateAdminRole)
		.then(addNewAdminUsersToAdminRole)
		.catch(handleError)
	);


	///
	// Helpers
	///

	function getNewAdminUsers(scope) {
		const emails = _.map(allAdminUsers, 'email');

		return Person.find({where: {email: {inq: emails}}}).then(existingUsers => {
			const existingEmails = _.map(existingUsers, 'email');
			const newAdminUsers = _.reject(allAdminUsers, (user) => (
				_.includes(existingEmails, user.email)
			));

			scope = _.assign({}, scope, {newAdminUsers});

		}).then(() => scope);
	}

	function addNewAdminUsers(scope) {
		const promises = scope.newAdminUsers.map(Person.create);

		Promise.all(promises).then(addedUsers => {
			scope = _.assign({}, scope, {newAdminUsers: addedUsers});
		}).then(() => scope);
	}

	function getOrCreateAdminRole(scope) {
		return Role.create({name: 'admin'}).then(role => {
			scope = _.assign({}, scope, {adminRole: role});
		}).then(() => scope);
	}

	function addNewAdminUsersToAdminRole(scope) {
		const promises = _.map(scope.newAdminUsers, user => (
			scope.adminRole.principals.create({
				principalType: RoleMapping.USER,
				principalId: user.id,
			})
		));

		return Promise.all(promises).then(() => scope);
	}

	function handleError(error) {
		console.error(error);
	}
};

