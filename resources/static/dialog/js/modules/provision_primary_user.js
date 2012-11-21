/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
BrowserID.Modules.ProvisionPrimaryUser = (function() {
  "use strict";

  var bid = BrowserID,
      user = bid.User,
      errors = bid.Errors;

  function provisionPrimaryUser(email, auth, prov, oncomplete) {
    /*jshint validthis:true*/
    var self=this;

    function complete(status) {
      oncomplete && oncomplete(status);
    }
    console.log('provisi_prim_user provPrimUser call email=', email, ' auth=', auth, ' prov=', prov);
    user.provisionPrimaryUser(email, {auth: auth, prov: prov}, function(status, status_info) {
      console.log('provisi_prim_user user.provPPrimUser callback status=', status, ' status_info=', status_info);
      switch(status) {
        case "primary.already_added":
          // XXX Is this status possible?
          break;
        case "primary.verified":
          self.close("primary_user_provisioned", { email: email, assertion: status_info.assertion } );
          complete(true);
          break;
        case "primary.verify":
          self.close("primary_user_unauthenticated", {
            email: email,
            auth_url: auth,
            // XXX use self.addressInfo universally.
            idpName: self.addressInfo.idpName
          });
          complete(true);
          break;
        case "primary.could_not_add":
          // XXX Can this happen?
          break;
        default:
          break;
      }
    }, self.getErrorDialog(errors.provisioningPrimary));
  }

  var ProvisionPrimaryUser = bid.Modules.PageModule.extend({
    start: function(options) {
      options = options || {};
      console.log('provision_primary_user start');
      var self = this,
          email = options.email,
          auth = options.auth,
          prov = options.prov;

      if(!email) {
        throw new Error("missing config option: email");
      }

      user.addressInfo(email, null, function(status) {

	console.log('user.addInfo called ', status);

        self.addressInfo = status;
        if(status.type === "primary") {
          provisionPrimaryUser.call(self, email, status.auth, status.prov);
        }
        else {
          self.renderError("error", { action: errors.provisioningBadPrimary });
        }
      }, self.getErrorDialog(errors.isEmailRegistered));


      ProvisionPrimaryUser.sc.start.call(self, options);
    }

    // BEGIN TESTING API
    ,
    provisionPrimaryUser: provisionPrimaryUser
    // END TESTING API
  });

  return ProvisionPrimaryUser;

}());
