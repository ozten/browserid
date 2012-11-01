// wait for something to work.
//   poll - how often to check in ms
//   timeout - how long to try before giving up in ms
//   check - a function that will perform the check, accepts a callback where the
//           first argument is a boolean indicating whether the check was successful
//           (if false, the check will be retried)
//   complete - a callback to invoke upon timeout or successful check with args.slice(1)
//           from the check function
exports.waitFor = function (poll, timeout, check, complete) {
  var startTime = new Date();
  function doit() {
    check(function(done) {
<<<<<<< HEAD
      if (done || ((new Date() - startTime) > timeout)) {
=======
      if (!done && ((new Date() - startTime) > timeout)) {
        complete.call(null, "timeout hit");
      } else if (done) {
>>>>>>> 16b3cd1941eb92bf8a410d0a4674e403e83487d8
        complete.apply(null, Array.prototype.slice.call(arguments, 1));
      } else {
        setTimeout(doit, poll);
      }
    });
  }
  setTimeout(doit, poll);
};
