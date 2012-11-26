/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
db = require('../db.js'),
primary = require('../primary.js'),
wsapi = require('../wsapi.js'),
httputils = require('../httputils.js'),
url = require('url'),
logger = require('../logging.js').logger,
config = require('../configuration.js');

// type: {primary, secondary} // indicates email type right now
// state: {string}
//   "known": the email address is known
//   "unknown": the email is not known to us
//   "transition_to_primary": the primary email address was last used as a secondary, the user will be authenticating via idp for the first time
//   "transition_to_secondary": the secondary email address was last used as a primary, the user has a password and can authenticate with it.
//   "transition_no_password": the secondary email address was last used as a primary address, the user has no password and must select one.
//   "offline": the primary authority is offline and the user cannot authenticate with this email right now.
// auth: <string> // (primary only) authentication URL
// prov: <string> // (primary only) certificate provisioning URL


// a table which can be used to determine state.  This table is only meaningful
// when a) the email is known and b) the primary is not "broken" right now
// passwordKnown -> lastUsedAs -> right now
const STATE_TABLE = {
  true: {
    "primary": {
      "primary": "known",
      "secondary": "transition_to_secondary"
    },
    "secondary": {
      "primary": "transition_to_primary",
      "secondary": "known"
    }
  },
  false: {
    "primary": {
      "primary": "known",
      "secondary": "transition_no_password"
    },
    "secondary": {
      "primary": "transition_to_primary",
      "secondary": "tranistion_no_password"
    }
  }
};

exports.method = 'get';
exports.writes_db = false;
exports.authed = false;
exports.args = {
  'email': 'email'
};
exports.i18n = false;

exports.process = function(req, res) {
  // parse out the domain from the email
  var domain = primary.emailRegex.exec(req.params.email)[1];

  // to determine the state of this email, we need the following information:
  // * emailKnown: is this in the database
  var emailKnown = false;
  // * hasPassword: does this email have a password?
  var hasPassword;
  // * lastUsedAs: when last used, what type of address was this?
  var lastUsedAs;
  // * primarySeenRecently: was the domain a primary IdP in the last 30 days?
  var primarySeenRecently;
  // * stateRightNow: is the domain a secondary or primary domain right now?
  var typeRightNow;
  // * asyncError: was there an error while trying to answer the above questions?
  var asyncError;

  // first, we answer all of these questions in parallel.
  // NOTE: using a library would improve this code.
  var questionsToAnswer = 3;

  // first question: figure out the state of the domain right now
  primary.checkSupport(domain, function(err, r) {
    questionsToAnswer--;

    if (!err && r && r.urls) {
      typeRightNow = r.urls;
      typeRightNow.type = 'primary';
      typeRightNow.issuer = r.authoritativeDomain;
    } else {
      if (err) {
        logger.info('"' + domain + '" primary support is misconfigured, falling back to secondary: ' + err);
      }
      typeRightNow = { type:'secondary' };
    }

    questionAnswered();
  });

  // second question: figure out whether the primary was recently seen
  db.getIDPLastSeen(domain, function(err, when) {
    questionsToAnswer--;

    // if the database is broke, then return an error
    if (err) {
      if (!asyncError) asyncError = err;
    } else {
      primarySeenRecently = when ? (new Date() - when > config.get('idp_offline_grace_period_ms')) : false;
    }

    questionAnswered();
  });

  // third question: get information about the email address
  db.emailInfo(req.params.email, function(err, info) {
    questionsToAnswer--;

    if (err) {
      if (!asyncError) asyncError = err;
    } else {
      emailKnown = !!info;
      hasPassword = info ? info.hasPassword : false;
      lastUsedAs = info ? info.lastUsedAs : null;
    }

    questionAnswered();
  });

  function questionAnswered() {
    if (questionsToAnswer > 0) return;

    if (asyncError) {
      // assume that this error was due to the database being down.
      // returning a 503 code shows the user an "overloaded" message,
      // which is generally what we want.
      return wsapi.databaseDown(res, asyncError.toString());
    }

    // now we have all the information we need, let's generate
    // a response
    var r = typeRightNow;

    if (!emailKnown) {
      r.state = "unknown";
    } else if (r.type === 'secondary' && primarySeenRecently) {
      r.state = "offline";
    } else {
      r.state = STATE_TABLE[hasPassword][lastUsedAs][typeRightNow.type];
    }

    res.json(r);
  }
};
