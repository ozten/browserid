#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
path = require('path'),
assert = require('assert'),
restmail = require('../lib/restmail.js'),
utils = require('../lib/utils.js'),
persona_urls = require('../lib/urls.js'),
CSS = require('../pages/css.js'),
dialog = require('../pages/dialog.js'),
runner = require('../lib/runner.js'),
testSetup = require('../lib/test-setup.js'),
user = require('../lib/user.js');
NEW_PASSWORD = "password";

// pull in test environment, including wd
var browser, verificationBrowser, theUser;

var verifyEmail = user.verifyEmail
    getVerifiedUser = user.getVerifiedUser;

runner.run(module, {
  "setup": function(done) {
    // this is the more compact setup syntax
    testSetup.setup({b:2}, function(err, fix) {
      browser = fix.b[0];
      verificationBrowser = fix.b[1];
      done(err);
    });
  },
  "get a verified user": function(done) {
    getVerifiedUser(done);
  },

  "open myfavoritebeer, open dialog, click forgotPassword": function(done, user) {
    theUser = user;

    browser.chain()
      .newSession(testSetup.sessionOpts)
      .get(persona_urls['myfavoritebeer'])
      .wclick(CSS['myfavoritebeer.org'].signinButton)
      .wwin(CSS['dialog'].windowName)
      .wtype(CSS['dialog'].emailInput, theUser.email)
      .wclick(CSS['dialog'].newEmailNextButton)
      .wclick(CSS['dialog'].forgotPassword, done);
  },

  "choose new password": function(done) {
    browser.chain()
      .wtype(CSS['dialog'].choosePassword, NEW_PASSWORD)
      .wtype(CSS['dialog'].verifyPassword, NEW_PASSWORD)
<<<<<<< HEAD
      .wclick(CSS['dialog'].resetPasswordButton, function() {
        done();
=======
      .wclick(CSS['dialog'].resetPasswordButton, function(err) {
        done(err);
>>>>>>> 16b3cd1941eb92bf8a410d0a4674e403e83487d8
      });
  },

  "open reset verification link in new browser window": function(done, link) {
    verifyEmail(theUser.email, NEW_PASSWORD, 1, verificationBrowser, done);
  },

  "make sure user is signed in to RP after password reset": function(done) {
    browser.chain()
      .wwin()
      .wtext(CSS['myfavoritebeer.org'].currentlyLoggedInEmail, function(err, text) {
<<<<<<< HEAD
        assert.equal(text, theUser.email);
        done();
=======
        done(err || assert.equal(text, theUser.email));
>>>>>>> 16b3cd1941eb92bf8a410d0a4674e403e83487d8
      });
  },

  "open dialog again and make sure user is signed in to Persona": function(done) {
    browser.chain()
      .wclick(CSS['myfavoritebeer.org'].logout)
      .wclick(CSS['myfavoritebeer.org'].signinButton)
      .wwin(CSS['dialog'].windowName)
      // the thisIsNotMe button is only displayed if the user is already
      // authenticated.
<<<<<<< HEAD
      .wclick(CSS['dialog'].thisIsNotMe, function() {
        done();
=======
      .wclick(CSS['dialog'].thisIsNotMe, function(err) {
        done(err);
>>>>>>> 16b3cd1941eb92bf8a410d0a4674e403e83487d8
      });
  },

  "open dialog and sign in with new password": function(done) {
    dialog.signInExistingUser({
      email: theUser.email,
      password: NEW_PASSWORD,
      browser: browser
    }, done)
  },

  "shut down remaining browsers": function(done) {
<<<<<<< HEAD
    browser.quit();
    done();
=======
    browser.quit(done);
>>>>>>> 16b3cd1941eb92bf8a410d0a4674e403e83487d8
  }
});
