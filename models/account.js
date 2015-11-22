var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    username: String,
    email: String,
    password: String,
    regTime: { type: Date, default: Date.now }
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('user', Account, 'users');
