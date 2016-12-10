///
// Dependencies
///

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
		// This single line of code is preferable, but is believed to cause a bug
		// in some systems, related to:
		//
		// * https://github.com/strongloop/loopback-datasource-juggler/issues/936
		// * https://github.com/strongloop/loopback/issues/2164
		//
		// <PREFERABLE CODE>
		//   const promises = scope.newAdminUsers.map(Person.create);
		// </PREFERABLE CODE>
		//
		// As such, until a fix is published, the following section using callbacks
		// will suffice:

		// <ALTERNATE CODE>
		const promises = [];
		scope.newAdminUsers.map(newUser => {
			promises.push(new Promise((resolve, reject) => {
				Person.create(newUser, (err, addedUser) => {
					if(err) {
						return reject(err);
					} else {
						return resolve(addedUser);
					}
				});
			}));
		});
		// </ALTERNATE CODE>

		Promise.all(promises).then(addedUsers => {
			scope = _.assign({}, scope, {newAdminUsers: addedUsers});
		}).then(() => scope);
	}

	function getOrCreateAdminRole(scope) {
		const adminRole = {name: 'admin'};
		return Role.find({where: adminRole}).then(existingRole => {
			if(existingRole) {
				return existingRole;
			}
			return Role.create(adminRole);

		}).then(role => {
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

