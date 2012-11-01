/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
wsapi = require('../wsapi.js');

exports.method = 'post';
exports.writes_db = true;
exports.authed = 'assertion';
exports.args = {
  'email': 'email'
};
exports.i18n = false;

exports.process = function (req, res) {
  var email = req.params.email;
  // TODO write to db or ???
  var success = true;
  res.json({success: success});
};