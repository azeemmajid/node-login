var passport = require('passport');
var Account = require("../models/account.js");
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Node Login System', user: req.user, messages: req.flash("info") });
});

router.get('/userlist', function(req, res) {
  Account.find({}, function(err, docs) {
    if (!err){
      res.render('userlist', { "userlist" : docs, title: 'Userlist' });
    } else {throw err;}
  });
});

router.get('/register', function(req,res) {
  res.render('register', { title: 'Register Here'});
});

router.post('/register', function(req, res) {
   Account.register(new Account({ username : req.body.username, email: req.body.email }), req.body.password, function(err, account) {
        if (err) {
            return res.render('register', { account : account });
        }

        passport.authenticate('local')(req, res, function () {
          res.redirect('/');
        });
    });
});

 router.get('/login', function(req, res) {
      res.render('login', { user : req.user, title: 'Login', messages: req.flash("alert") });
  });

  router.post('/login', passport.authenticate('local', {
      successRedirect: '/loginSuccess',
      failureRedirect: '/loginFailure'
    })
  );

  router.get('/loginFailure', function(req, res, next) {
    req.flash('alert', 'Failed to login');
    res.redirect('/login');
  });

  router.get('/loginSuccess', function(req, res, next) {
    req.flash('info', 'Login Success!');
    res.redirect('/');
  });

  router.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
  });

  router.get('/ping', function(req, res){
      res.send("pong!", 200);
  });

router.get('/users/:username', function(req, res) {
  Account.findOne({ 'username': req.params.username }, 'username regTime' , function(err, user) {
    if (err) return handleError(err);
    res.render('user', { "user" : user });
  });
});

router.get('/users/:username/edit', function(req, res) {
  Account.findOne({ 'username': req.params.username }, 'username regTime' , function(err, user) {
    if (err) return handleError(err);
    res.render('user', { "user" : user });
  });
});

module.exports = router;
