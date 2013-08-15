var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var OwnedSchema = new Schema({
    name: String,
    owned: Number,
    buyOverride: Number,
    sellOverride: Number,
    alwaysBuy: Boolean,
    alwaysSell: Boolean,
    tier1: Number,
    tier2: Number,
    tier3: Number,
    tradeable: Number
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
		includeDecay: Boolean,
		minPrice: Number,
		maxPrice: Number,

		buytier1: Boolean,
		buytier2: Boolean,
		buytier3: Boolean,
		selltier1: Boolean,
		selltier2: Boolean,
		selltier3: Boolean,

		tier2multiplier: Number,
		tier3multiplier: Number,

		tierPrefix: String,
		tierSuffix: String,

		buyMax: Number,

		goal: Number,

		ownedColors: {
			extras: String,
			playset: String,
			missing: String,
			none: String
		},
		rarityColors: {
			rare: String,
			uncommon: String,
			common: String
		},
		factionColors: {
			growth: String,
			order: String,
			energy: String,
			decay: String
		}
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