/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
db = require('../db.js'),
primary = require('../primary.js'),
wsapi = require('../wsapi.js'),
httputils = require('../httputils.js'),
url = require('url'),
logger = require('../logging.js').logger;

// return information about an email address.
//   type:  is this an address with 'primary' or 'secondary' support?
//   if type is 'secondary':
//     known: is this address known to browserid?
//   if type is 'primary':
//     auth: what is the url to send the user to for authentication
//     prov: what is the url to embed for silent certificate (re)provisioning

exports.method = 'get';
exports.writes_db = false;
exports.authed = false;
exports.args = {
  'email': 'email',
  'issuer': 'hostname'
};
exports.i18n = false;

const emailRegex = /\@(.*)$/;

exports.process = function(req, res) {
  // parse out the domain from the email
  var m = emailRegex.exec(req.params.email);
  var issuer = req.params.issuer;

  function sendInfo (err, urls) {
    if (err) {
      logger.info('"' + m[1] + '" primary support is misconfigured, falling back to secondary: ' + err);
      // primary check failed, fall back to secondary email verification
    }

    if (urls) {
      urls.type = 'primary';
      res.json(urls);
    } else {
      db.emailInfo(req.params.email, function(err, info) {
        if (err) {
          return wsapi.databaseDown(res, err);
        } else {
          var known = !!info;
          var state = known ? 'known' : 'unknown';
          if ('default' !== issuer) {
            if (info && info.hasPassword) {
              logger.info(info);
              logger.info(typeof info.hasPassword);
            } else {
              state = 'transition_no_password';
            }
            
          }
          res.json({ type: 'secondary', known: known, state: state });
        }
      });
    }
  }


  if ('default' !== issuer) {
    sendInfo(null, null);
  } else {
    primary.checkSupport(m[1], sendInfo);
  }
};
