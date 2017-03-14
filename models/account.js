var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    username: { type: String },
    email: { type: String },
    password: { type: String },
    verified: { type: Boolean, default: false},
    verifyToken: String,
	userStatus: String,
    admin: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    regTime: { type: Date, default: Date.now }
}, { strict: false });

Account.plugin(passportLocalMongoose, { usernameUnique: true });

module.exports = mongoose.model('user', Account, 'users');
