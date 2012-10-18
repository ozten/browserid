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
vowsHarness = require('../lib/vows_harness.js'),
testSetup = require('../lib/test-setup.js'),
user = require('../lib/user.js');

// pull in test environment, including wd
var browser,
    firstPrimaryEmail,
    firstPrimaryPassword,
    secondPrimaryEmail,
    secondPrimaryPassword,
    secondaryEmail,
    secondaryPassword,
    emails = [];

function getEmailIndex(email) {
  emails = emails.sort(function(a, b) { return a === b ? 0 : a > b ? 1 : -1; });
  var index = emails.indexOf(email);
  return index;
}

function saveEmail(email) {
  emails.push(email);
  return email;
}

function removeEmail(email, done) {
  browser.chain()
    .get(persona_urls['persona'])
    .wclick(CSS['persona.org'].emailListEditButton)
    .elementsByCssSelector(CSS['persona.org'].removeEmailButton, function(err, elements) {
      var index = getEmailIndex(email);
      var button = elements[index];

      browser.chain()
        .clickElement(button)
        // Give Chrome a bit to display the alert or else the command to
        // accept the alert is fired too early.
        .delay(500)
        .acceptAlert(function() {
          emails.splice(index, 1);

          if (emails.length) {
            // if there are emails remaining, click the done button
            browser.wclick(CSS['persona.org'].emailListDoneButton, done);
          }
          else {
            // if there are no emails remaining, the user will be logged out
            browser.wfind(CSS['persona.org'].header.signIn, done);
          }
        });
    });

}

vowsHarness({
  "setup all the things": function(done) {
    // this is the more compact setup syntax
    testSetup.setup({b:2, r:1, e:2}, function(err, fix) {
      browser = fix.b[0];
      firstPrimaryEmail = saveEmail(fix.e[0]);
      secondPrimaryEmail = saveEmail(fix.e[1]);
      secondaryEmail = saveEmail(fix.r[0]);
      firstPrimaryPassword = firstPrimaryEmail.split('@')[0];
      secondPrimaryPassword = secondPrimaryEmail.split('@')[0];
      secondaryPassword = secondaryEmail.split('@')[0];
      done(err);
    });
  },
  "go to 123done and create a primary account": function(done) {
    browser.chain()
      .newSession(testSetup.sessionOpts)
      .get(persona_urls['123done'])
      .wclick(CSS['123done.org'].signInButton)
      .wwin(CSS['dialog'].windowName)
      .wtype(CSS['dialog'].emailInput, firstPrimaryEmail)
      .wclick(CSS['dialog'].newEmailNextButton)
      .wclick(CSS['dialog'].verifyWithPrimaryButton)
      // sometimes the verifyWithPrimaryButton needs clicked twice
      .wclick(CSS['dialog'].verifyWithPrimaryButton)
      .wtype(CSS['eyedee.me'].newPassword, firstPrimaryPassword)
      .wclick(CSS['eyedee.me'].createAccountButton)
      .wwin()
      .wtext(CSS['123done.org'].currentlyLoggedInEmail, function(err, text) {
        assert.equal(text, firstPrimaryEmail);
        done();
      });
  },

  "add another primary to account": function(done) {
    browser.chain()
      .wclick(CSS['123done.org'].logoutLink)
      .wclick(CSS['123done.org'].signInButton)
      .wwin(CSS['dialog'].windowName)
      .wclick(CSS['dialog'].useNewEmail)
      .wtype(CSS['dialog'].newEmail, secondPrimaryEmail)
      .wclick(CSS['dialog'].addNewEmailButton)
      .wclick(CSS['dialog'].verifyWithPrimaryButton)
      // sometimes the verifyWithPrimaryButton needs clicked twice
      .wclick(CSS['dialog'].verifyWithPrimaryButton)
      .wtype(CSS['eyedee.me'].newPassword, secondPrimaryPassword)
      .wclick(CSS['eyedee.me'].createAccountButton)
      .wwin()
      .wtext(CSS['123done.org'].currentlyLoggedInEmail, function(err, text) {
        assert.equal(text, secondPrimaryEmail);
        done();
      });
  },

  "add secondary to account": function(done) {
    browser.chain()
      .wclick(CSS['123done.org'].logoutLink)
      .wclick(CSS['123done.org'].signInButton)
      .wwin(CSS['dialog'].windowName)
      .wclick(CSS['dialog'].useNewEmail)
      .wtype(CSS['dialog'].newEmail, secondaryEmail)
      .wclick(CSS['dialog'].addNewEmailButton)
      .wtype(CSS['dialog'].choosePassword, secondaryPassword)
      .wtype(CSS['dialog'].verifyPassword, secondaryPassword)
      .wclick(CSS['dialog'].createUserButton, done)
  },

  "get verification link": function(done) {
    restmail.getVerificationLink({ email: secondaryEmail }, done);
  },

  "follow link, wait for redirect, secondary should be displayed": function(done, link) {
    browser.chain()
      .wwin()
      .get(link)
      .wtext(CSS['123done.org'].currentlyLoggedInEmail, function(err, text) {
        assert.equal(text, secondaryEmail);
        done();
      });
  },

  "log in to 123done using secondPrimaryEmail": function(done) {
    browser.chain()
      .wclick(CSS['123done.org'].logoutLink)
      .wclick(CSS['123done.org'].signInButton)
      .wwin(CSS['dialog'].windowName)
      .wclick(CSS['dialog'].emailPrefix + getEmailIndex(secondPrimaryEmail))
      .wclick(CSS['dialog'].signInButton)
      .wwin()
      .wtext(CSS['123done.org'].currentlyLoggedInEmail, function(err, text) {
        assert.equal(text, secondPrimaryEmail);
        done();
      });
  },

  "log in to myfavoritebeer using secondaryEmail": function(done) {
    browser.chain()
      .get(persona_urls['myfavoritebeer'])
      .wclick(CSS['myfavoritebeer.org'].signInButton)
      .wwin(CSS['dialog'].windowName)
      .wclick(CSS['dialog'].emailPrefix + getEmailIndex(secondaryEmail))
      .wclick(CSS['dialog'].signInButton)
      .wwin()
      .wtext(CSS['myfavoritebeer.org'].currentlyLoggedInEmail, function(err, text) {
        assert.equal(text, secondaryEmail);
        done();
      });
  },

  "go to main site, remove secondPrimaryEmail": function(done) {
    removeEmail(secondPrimaryEmail, done);
  },

  "go to 123done, user should no longer be logged in": function(done) {
    browser.chain()
      .get(persona_urls['123done'])
      .wfind(CSS['123done.org'].signInButton, done);
  },

  "go to main site, remove secondaryEmail": function(done) {
    removeEmail(secondaryEmail, done);
  },

  "go to myfavoritebeer, make sure user is still signed in - mfb still uses old API": function(done) {
    browser.chain()
      .get(persona_urls['myfavoritebeer'])
      .wfind(CSS['myfavoritebeer.org'].logoutLink, done);
  },

  "go to main site, remove firstPrimaryEmail": function(done) {
    removeEmail(firstPrimaryEmail, done);
  },

  "user should now be signed out - cannot sign in with deleted addresses": function(done) {
    browser.chain()
      .get(persona_urls['persona'])
      .wclick(CSS['persona.org'].header.signIn)
      .wtype(CSS['persona.org'].signInForm.email, secondaryEmail)
      .wclick(CSS['persona.org'].signInForm.nextButton)
      .wfind(CSS['persona.org'].signInForm.verifyPassword)
      .wclear(CSS['persona.org'].signInForm.email)
      // the user will still be logged in to eyedee.me under the
      // secondPrimaryEmail, so try logging in using the firstPrimaryEmail
      .wtype(CSS['persona.org'].signInForm.email, firstPrimaryEmail)
      .wclick(CSS['persona.org'].signInForm.nextButton)
      .wfind(CSS['persona.org'].signInForm.verifyPrimaryButton, done);
  },

  "shut down remaining browsers": function(done) {
    browser.quit();
    done();
  }
}, module);
