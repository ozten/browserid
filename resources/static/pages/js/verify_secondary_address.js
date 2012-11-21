/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

BrowserID.verifySecondaryAddress = (function() {
  "use strict";

  var ANIMATION_TIME=250,
      bid = BrowserID,
      user = bid.User,
      storage = bid.Storage,
      errors = bid.Errors,
      pageHelpers = bid.PageHelpers,
      dom = bid.DOM,
      helpers = bid.Helpers,
      complete = helpers.complete,
      validation = bid.Validation,
      tooltip = bid.Tooltip,
      REDIRECT_SECONDS = 5,
      sc;

  function showRegistrationInfo(info) {
    /*jshint validthis: true*/
    var self=this;
    dom.setInner("#email", info.email);
    dom.setInner(".website", self.redirectTo);

    if (self.uiTimeoutID) self.uiTimeoutID = clearTimeout(self.uiTimeoutID);
    updateRedirectTimeout.call(this);

    if (info.returnTo) {
      dom.show(".siteinfo");
    }
  }

  function updateRedirectTimeout() {
    /*jshint validthis: true*/
    dom.setInner("#redirectTimeout", this.secondsRemaining);
  }

  function countdownTimeout(onComplete) {
    /*jshint validthis: true*/
    var self=this;
    function checkTime() {
      if (self.secondsRemaining > 0) {
        updateRedirectTimeout.call(self);
        self.secondsRemaining--;
        self.uiTimeoutID = setTimeout(checkTime.bind(self), 1000);
      } else {
        complete(onComplete);
      }
    }

    checkTime();
  }

  function submit(oncomplete) {
    /*jshint validthis: true*/
    var self = this,
        pass = dom.getInner("#password") || undefined,
        inputValid = !self.mustAuth || validation.password(pass);
    console.log('verify_2nd_add pass=' + pass + ' inputValid=', inputValid);
    if (inputValid) {
      console.log('verify_2nd_add verifyFunction=', self.verifyFunction);
      user[self.verifyFunction](self.token, pass, function(info) {
        dom.addClass("body", "complete");

        var verified = info.valid;
	console.log('verify_2nd_add user.func callback with info=', info);
        if (verified) {
          pageHelpers.replaceFormWithNotice("#congrats", function() {
            // set the loggedIn status for the site.  This allows us to get
            // a silent assertion without relying on the dialog to set the
            // loggedIn status for the domain.  This is useful when the user
            // closes the dialog OR if redirection happens before the dialog
            // has had a chance to finish its business.
            /*jshint newcap:false*/
            storage.setLoggedIn(URLParse(self.redirectTo).originOnly(), self.email);
            countdownTimeout.call(self, function() {
              self.doc.location = self.redirectTo;
              complete(oncomplete, verified);
            });
          });
        }
        else {
          pageHelpers.showFailure(errors.cannotComplete, info, oncomplete);
        }
      }, function(info) {
        if (info.network && info.network.status === 401) {
          tooltip.showTooltip("#cannot_authenticate");
          complete(oncomplete, false);
        }
        else {
          pageHelpers.showFailure(errors.verifyEmail, info, oncomplete);
        }
      });
    }
    else {
      complete(oncomplete, false);
    }
  }

  function startVerification(oncomplete) {
    /*jshint validthis: true*/
    var self=this;
    user.tokenInfo(self.token, function(info) {
	console.log('verify_secondary_address startVerification user.tokenInfo callback with info=', info);
      if (info) {
        self.redirectTo = info.returnTo || "https://login.persona.org/";
        self.email = info.email;
        showRegistrationInfo.call(self, info);
        self.mustAuth = info.must_auth;

        if (self.mustAuth) {
          // These are users who are authenticating in a different browser or
          // session than the initiator.
          dom.addClass("body", "enter_password");
          dom.focus("input[autofocus]");
          complete(oncomplete, true);
        }
        else {
          // Easy case where user is in same browser and same session, just
          // verify and be done with it all!
          submit.call(self, oncomplete);
        }
      }
      else {
        // renderError is used directly instead of pageHelpers.showFailure
        // because showFailure hides the title in the extended info.
        self.renderError("error", errors.cannotConfirm);
        complete(oncomplete, false);
      }
    }, pageHelpers.getFailure(errors.getTokenInfo, oncomplete));
  }

  var Module = bid.Modules.PageModule.extend({
    start: function(options) {
      var self=this;
      self.checkRequired(options, "token", "verifyFunction");

      self.token = options.token;
      self.verifyFunction = options.verifyFunction;
      self.doc = options.document || document;

      self.redirectTimeout = options.redirectTimeout;
      if (typeof self.redirectTimeout === "undefined") {
        self.redirectTimeout = REDIRECT_SECONDS * 1000;
      }
      self.secondsRemaining = self.redirectTimeout / 1000;


      startVerification.call(self, options.ready);

      sc.start.call(self, options);
    },

    submit: submit
  });

  sc = Module.sc;

  return Module;
}());
