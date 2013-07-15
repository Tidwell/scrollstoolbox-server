var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var OwnedSchema = new Schema({
    name: String,
    owned: Number,
    buyOverride: Number,
    sellOverride: Number,
    alwaysBuy: Boolean,
    alwaysSell: Boolean
});

var UserModel = new Schema({
	username: String,
	password: String,
	inGameName: String,
	email: String,
	authed: Boolean,
	rating: Number,
	owned: [OwnedSchema],
	settings: {
		theme: String,

		//wts wtb
		separator: String,
		buyPrependText: String,
		buyAppendText: String,
		sellPrependText: String,
		sellAppendText: String,
		buyModifier: Number,
		sellModifier: Number,
		buyPModifier: Number,
		sellPModifier: Number,
		buyAt: String,
		sellAt: String,
		buyCommon: Boolean,
		buyUncommon: Boolean,
		buyRare: Boolean,
		sellCommon: Boolean,
		sellUncommon: Boolean,
		sellRare: Boolean,
		gPrefix: String,
		gSuffix: String,
		qPrefix: String,
		qSuffix: String,
		includeEnergy: Boolean,
		includeOrder: Boolean,
		includeGrowth: Boolean,
		minPrice: Number,
		maxPrice: Number
	}
});

UserModel = mongoose.model('User', UserModel);

var condensedUser = new Schema({
	username: String,
	inGameName: String,
	id: ObjectId
});

module.exports = {
	UserModel: UserModel, //model
	condensedUser: condensedUser //schema
};