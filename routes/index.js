var passport = require('passport');
var Account = require("../models/account.js");
var express = require('express');
var crypto = require('crypto');
var async = require('async');
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
  res.render('register', { title: 'Register Here', messages: req.flash("error") });
});

router.post('/register', function(req, res) {
  if(req.body.password == req.body.password2 && req.body.username && req.body.email && req.body.password) {
  Account.register(new Account({ username : req.body.username, email: req.body.email }), req.body.password, function(err, account) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('/register');
    }
    passport.authenticate('local')(req, res, function () {
      req.flash('info', 'Registered!');
      res.redirect('/');
      });
    });
  } else {
    req.flash('error', "Something went wrong, make sure all fields are complete and your passwords match");
    res.redirect('/register');
  }
});
  

 router.get('/login', function(req, res) {
      res.render('login', { user : req.user, title: 'Login', messages: req.flash("error") });
  });

  router.post('/login', passport.authenticate('local', {
      successRedirect: '/loginSuccess',
      failureRedirect: '/loginFailure',
      failureFlash: true
    })
  );

  router.get('/loginFailure', function(req, res, next) {
    //req.flash('error', 'Failed to login');
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

router.get('/user/edit', function(req, res) {
  res.render('useredit', {"user": req.user, messages: req.flash("alert")});
});

router.post('/user/editemail', function(req, res) {
  if(req.body.email !== req.user.email) {
    Account.findOneAndUpdate({'username': req.user.username}, { 'email': req.body.email}, function(err, user) {
      if(err) return handleError(err);

      req.flash('alert', "The information has been changed");
      res.redirect('/user/edit');
    });
  } else {
    res.redirect('/user/edit');
  }
});

router.post('/user/editpass', function(req, res) {
  if(req.body.newpass == req.body.newpass2) {
    Account.findOne({'username': req.user.username}, function(err, sanitizedUser) {
      if(sanitizedUser) {
        sanitizedUser.setPassword(req.body.newpass, function() {
          sanitizedUser.save();
          req.flash('alert', "Password has been changed");
          return res.redirect('/user/edit');
        });
      } else {
        res.status(200).json({status: 0, msg: 'Password could not be changed'});
      }
    });
  } else {
    req.flash("alert", "Passwords don't match");
  }
});

router.get('/forgot', function(req, res) {
  res.render('forgot', { user: req.user, messages: req.flash("error") });
});

//STILL NEEDS TO BE FINISHED
//-----------------------------------------------
router.post('/forgot', function(req, res) {
  async.waterfall([
    function(needed) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        needed(err, token);
      });
    },
    function(token, needed) {
      Account.findOne({ 'email': req.body.email }, 'username email regTime', function(err, user) {
        
        if(err) return handleError(err);

        if (!user) {
          req.flash('error', "No user has that email");
          return res.redirect('/forgot');
        }
        console.log(token);
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 10800000; //3 hours

        user.save(function(err) {
          needed(err, token, user);
        });
      });
    },
    function(token, user, needed) {
      //email user with token
    }
  ]);
});

module.exports = router;
