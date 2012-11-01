/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
BrowserID.Modules.UpgradeToPrimaryUser = (function() {
  "use strict";

  var bid = BrowserID,
      sc,
      win,
      add,
      email,
      auth_url,
      dom = bid.DOM,
      helpers = bid.Helpers,
      dialogHelpers = helpers.Dialog,
      complete = helpers.complete;

  function upgrade(callback) {
    /*jshint validthis:true*/
    console.log("upgrade self=");
    this.publish("upgraded_primary_user", this.options);
  }

  function cancel(callback) {
    /*jshint validthis:true*/
    this.close("cancel_state");
    callback && callback();
  }

  var Module = bid.Modules.PageModule.extend({
    start: function(data) {
      console.log('incoming data=')
      console.log(data);
      console.log('this=', this);
      var self=this;
      data = data || {};

      win = data.window || window;
      add = data.add;
      email = data.email;
      auth_url = data.auth_url;



      self.renderDialog("upgrade_to_primary_user", {
        email: data.email,
        auth_url: data.auth_url,
        requiredEmail: data.requiredEmail || false,
        personaTOSPP: data.personaTOSPP,
        siteName: data.siteName,
        idpName: data.idpName
      });

      if (data.siteTOSPP) {
        dialogHelpers.showRPTosPP.call(self);
      }

      self.click("#cancel", cancel);

      sc.start.call(self, data);
    },

    submit: upgrade

    // BEGIN TESTING API
    ,
    cancel: cancel
    // END TESTING API
  });

  sc = Module.sc;

  return Module;
}());

