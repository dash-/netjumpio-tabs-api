const Promise = require('bluebird');

module.exports = function(app) {
	const Person = app.models.person;
	const Role = app.models.Role;
	const RoleMapping = app.models.RoleMapping;

	const createPerson = Promise.promisify(Person.create);
	const createRole = Promise.promisify(Role.create);

	let scope = {};

	createPerson([
		{
			name: process.env.NETJUMP_IO__TABSETS__ADMIN_NAME,
			logoUrl: '',
			username: process.env.NETJUMP_IO__TABSETS__ADMIN_USER,
			email: process.env.NETJUMP_IO__TABSETS__ADMIN_EMAIL,
			password: process.env.NETJUMP_IO__TABSETS__ADMIN_PASS,
		}
	]).then((people) => {
		scope.people = people;
		return createRole({name: 'admin'});

	}).then((role) => {
		const createPrincipals = Promise.promisify(role.principals.create);
		return createPrincipals({
			principalType: RoleMapping.USER,
			principalId: scope.people[0].id,
		});
	});
};
