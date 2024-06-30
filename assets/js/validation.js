"use strict";

$(document).ready(function () {
  $(".validate").each((idx, btn) => {
    let btnObj = $(btn);
    btnObj.on("click", () => {
      let spinner = $(btn).children().first();

      spinner.removeClass("d-none");
      let jobid = btnObj.data("jobid"),
        scpid = btnObj.data("scpid");

      $.ajax({
        method: "POST",
        url: "validate",
        data: { jobid: jobid, scpid: scpid },
      }).done(function (msg) {
        location.reload();
      });
    });
  });
});
