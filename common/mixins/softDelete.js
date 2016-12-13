///
// Dependencies
///

const isFunction = require('lodash/isFunction');
const isObject = require('lodash/isObject');
const size = require('lodash/size');
const cloneDeep = require('lodash/cloneDeep');
const last = require('lodash/last');
const tail = require('lodash/tail');


///
// Mixin
///

function softDelete(Model, options) {
	///
	// Local variables
	///

	const props = Model.definition.properties;
	const idField = Model.dataSource.idName(Model.modelName);
	const delAtField = 'deletedAt';
	const isDelField = 'isDeleted';


	///
	// Mixin property definitions
	///

	Model.defineProperty(delAtField, {
		type: Date,
		required: false
	});

	Model.defineProperty(isDelField, {
		type: Boolean,
		required: false
	});


	///
	// Saved pre-mixin methods
	///


	const saved = {
		findOrCreate: Model.findOrCreate,
		find: Model.find,
		count: Model.count,
		update: Model.update,
		updateAll: Model.updateAll,
	};


	///
	// Mixin method assignment
	///

	Model.remove = removeAll;
	Model.destroyAll = removeAll;
	Model.deleteAll = removeAll;

	Model.removeById = removeById;
	Model.destroyById = removeById;
	Model.deleteById = removeById;

	Model.prototype.destroy = remove;
	Model.prototype.remove = remove;
	Model.prototype.delete = remove;

	Model.findOrCreate = findOrCreate;

	Model.find = find;
	Model.count = count;

	Model.update = update;
	Model.updateAll = update;

	Model.restore = restore;


	///
	// Mixin methods
	///

	function removeAll(where, etc) {
		return saved.updateAll.call(
			Model, where, deletedAt(), getCallback(arguments)
		);
	}

	function removeById(id, etc) {
		return saved.updateAll.call(
			Model, { [idField]: id }, deletedAt(), getCallback(arguments)
		);
	}

	function remove(etc) {
		return this.updateAttributes(
			deletedAt(), getCallback(arguments)
		);
	}

	function findOrCreate(query, etc) {
		const args = [whereNotDeleted(query)].concat(
			tail(getArgs(arguments))
		);

		return saved.findOrCreate.apply(Model, args);
	}

	function find(query, etc) {
		const args = [whereNotDeleted(query)].concat(
			tail(getArgs(arguments))
		);

		return saved.find.apply(Model, args);
	}

	function count(where, etc) {
		const args = [whereNotDeleted({where: where})].concat(
			tail(getArgs(arguments))
		);

		return saved.count.apply(Model, args);
	}

	function update(where, etc) {
		return saved.update.call(
			Model, whereNotDeleted({where}), ...etc
		);
		const args = [whereNotDeleted({where: where})].concat(
			tail(getArgs(arguments))
		);

		return saved.update.apply(Model, args);
	}

	function restore(id) {
		return saved.update.call(Model, {id: id}, {
			[delAtField]: null,
			[isDelField]: false,
		}).then(result => {
			if(! result.count) {
				throw new Error('Could not restore data');
			}
			return Model.findById(id);
		});
	}


	///
	// Remote method registration
	///

	Model.remoteMethod('restore', {
		http: {path: '/:id/restore', verb: 'put'},
		accepts: {
			arg: 'id',
			type: 'string',
			http: { source: 'path' },
		},
		returns: {
			type: 'object',
			root: true,
		},
	});


	///
	// Helpers
	///

	function deletedAt() {
		return {
			[delAtField]: new Date(),
			[isDelField]: true,
		};
	}
};

module.exports = softDelete;


///
// Helpers
///

function getCallback(args) {
	const callback = last(getArgs(args));

	if(isFunction(callback)) {
		return callback;
	}

	return undefined;
}

function getArgs(args) {
	return Array.prototype.slice.call(args);
}

function whereNotDeleted(query) {
	let q = cloneDeep(isObject(query) ? query : {});
	isObject(q.where) || (q.where = {});

	const isNotDeleted = {isDeleted: {neq: true}};

	if(size(q.where) < 1) {
		q.where = isNotDeleted;
	} else {
		q.where = {and: [q.where, isNotDeleted]};
	}

	return q;
}

