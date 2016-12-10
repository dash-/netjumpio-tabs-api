///
// Dependencies
///

const isFunction = require('lodash/isFunction');
const isObject = require('lodash/isObject');
const size = require('lodash/size');
const cloneDeep = require('lodash/cloneDeep');


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
		findById: Model.findById,
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
  Model.findById = findById;
  Model.count = count;

  Model.update = update;
  Model.updateAll = update;


	///
	// Mixin methods
	///

	function removeAll(where, callback) {
		return saved.updateAll.call(Model, where, deletedAt(), callback);
	}

	function removeById(id, callback) {
		return saved.updateAll.call(Model, { [idField]: id }, deletedAt(), callback);
	}

	function remove(options, callback) {
		if(isFunction(options) && ! isFunction(callback)) {
			callback = options;
		}

		return this.updateAttributes(deletedAt(), callback);
	}

	function findOrCreate(query = {}, ...etc) {
		return saved.findOrCreate.call(
			Model, whereNotDeleted(query), ...etc
		);
	}

	function find(query = {}, ...etc) {
		return saved.find.call(
			Model, whereNotDeleted(query), ...etc
		);
	}

	function findById(id, query={}, ...etc) {
		return saved.findById.call(
			Model, id, whereNotDeleted(query), ...etc
		);
	}

	function count(where = {}, ...etc) {
		return saved.count.call(
			Model, whereNotDeleted({where}), ...etc
		);
	}

	function update(where = {}, ...etc) {
		return saved.update.call(
			Model, whereNotDeleted({where}), ...etc
		);
	}


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

function whereNotDeleted(query = {}) {
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

