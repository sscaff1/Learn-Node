const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const promisify = require('es6-promisify');
const User = mongoose.model('User');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!',
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Oops you must be logged in to do that!');
  res.redirect('/login');
};

exports.forgot = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then(user => {
      if (!user) {
        req.flash('error', 'No account with that email exists!');
        return res.redirect('/login');
      }
      user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
      user
        .save()
        .then(() => {
          const resetURL = `http://${req.headers
            .host}/account/reset/${user.resetPasswordToken}`;
          return mail.send({
            user,
            subject: 'Password Reset',
            filename: 'password-reset',
            resetURL,
          });
        })
        .then(() => {
          req.flash('success', `You have been emailed a password reset link.`);
          res.redirect('/login');
        });
    })
    .catch(next);
};

exports.reset = (req, res, next) => {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now(),
    },
  })
    .then(user => {
      if (!user) {
        req.flash('error', 'Password reset is invalid or has expired!');
        return res.redirect('/login');
      }
      res.render('reset', { title: 'Reset your Password' });
    })
    .catch(next);
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    return next();
  }
  req.flash('error', 'Your password do not match!');
  res.redirect('back');
};

exports.update = (req, res, next) => {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now(),
    },
  })
    .then(user => {
      if (!user) {
        req.flash('error', 'Password reset is invalid or has expired!');
        return res.redirect('/login');
      }
      const setPassword = promisify(user.setPassword, user);
      setPassword(req.body.password)
        .then(() => {
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;
          user.save();
        })
        .then(() => req.login(user))
        .then(() => {
          req.flash('success', 'Nice! Your password has been reset!');
          res.redirect('/');
        });
    })
    .catch(next);
};
