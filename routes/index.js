var passport = require('passport');
var Account = require("../models/account.js");
var express = require('express');
var crypto = require('crypto');
var async = require('async');
var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport')
var router = express.Router();

//Basic setup for email service
var auth = {
  auth: {
    api_key: 'hidden',
    domain: 'hidden'
  }
}
var smtpTransport = nodemailer.createTransport(mg(auth));

router.all('*', function(req, res,next) {
    res.locals.currUser = req.user;
    next();
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Node Login System', currUser: req.user, messages: req.flash("alert") });
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
      async.waterfall([
        function(needed) {
          crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex');
            account.verifyToken = token;
            account.save(function(err) {
              if(err) console.log(err);
            });
            needed(err, token);
          });
        },
        function(token, needed) {
          var mailOptions = {
            from: 'hidden', //sender address
            to: req.body.email,
            subject: 'Welcome',
            text: 'You have register. Please go to http://' + req.headers.host + '/verify/' + token + ' to verify your account'
          };
          smtpTransport.sendMail(mailOptions, function(err, info) {
            if(err) {
              cosnole.log('Error: ' + err);
           } else {
              console.log('Response" ' + info);
              req.flash('alert', 'An e-mail has been sent to ' + req.body.email + ' with further instructions \n');
            }
          });
        }
        ]); 
      req.flash('alert', 'Registered! please check your email');
      res.redirect('/');
      });
    });
  } else {
    req.flash('error', "Something went wrong, make sure all fields are complete and your passwords match");
    res.redirect('/register');
  }
});
  
router.get('/verify/:token', function(req, res, next) {
  Account.findOne({ verifyToken: req.params.token }, 'username verified verifyToken', function(err, user) {
    if (err) return handleError(err);

    user.verified = true;
    user.verifyToken = undefined;
    user.save(function(err) {
      if(err) console.log(err);
    });
    req.flash('alert', 'Your account is now verified');
    res.redirect('/');
  });
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
    req.flash('alert', 'Login Success!');
    res.redirect('/');
  });

  router.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
  });

  router.get('/ping', function(req, res){
      res.send("pong!", 200);
  });

router.get('/user', function(req,res) {
    if(req.user) {
	res.render('user');
    } else {
	res.redirect('/login');
    }
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

      req.flash('alert', "The alertrmation has been changed");
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
  res.render('forgot', { user: req.user, messages: req.flash("alert") });
});

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
          if(err) console.log(err);
          needed(err, token, user);
        });
      });
    },
    function(token, user, needed) {
      //email user with token
      var mailOptions = {
        from: 'hidden', //sender address
        to: user.email,
        subject: 'Reset email',
        text: 'this is a test. go to http://' + req.headers.host + '/reset/' + token + '\n\n'
      };
      smtpTransport.sendMail(mailOptions, function(err, info) {
        if(err) {
          cosnole.log('Error: ' + err);
        } else {
          console.log('Response" ' + info);
          req.flash('alert', 'An e-mail has been sent to ' + user.email + ' with further instructions \n');
          needed(err, 'done');
        }
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  Account.findOne({ resetPasswordToken: req.params.token}, function(err, user) {
    if(!user || Date.now() > user.resetPasswordExpires) {
      req.flash('alert', 'Password reset token is invalid or has expired.');
      if(Date.now() > user.resetPasswordExpires) {

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        
        user.save(function(err) {
          if(err) console.log(err);
        });
      }
      return res.redirect('/forgot');
    }
    res.render('reset', { user: req.user });
  });
});

router.post('/reset/:token', function(req, res) {
  Account.findOne({ resetPasswordToken: req.params.token }, function(err, user) {
    if(!user || Date.now() > user.resetPasswordExpires) {
      req.flash('alert', 'Password reset token is invalid or has expired');
      return res.redirect('back');
    }

    if(user) {
      user.setPassword(req.body.password, function() {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.save();
        req.flash('alert', "Password has been changed");
        return res.redirect('/');
      });
    } else {
      res.status(200).json({status: 0, msg: 'Password could not be changed'});
    }

  });
});

module.exports = router;
