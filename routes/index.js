var express = require("express");
var router = express.Router();
var dbService = require("../services/db.service");
var scrapper = require("../services/scrapper");

router.get("/offers", async (req, res) => {
  let _dbClient = new dbService();
  try {
    let jobs = await _dbClient.getJobs(req);

    res.render("offers", {
      scrap: jobs,
    });
  } catch (err) {
    console.error("Error", err);
  } finally {
    await _dbClient.close();
  }
});

router.post("/validate", async (req, res) => {
  let _dbClient = new dbService();
  try {
    await _dbClient.validateJob(req.body.jobid, req.body.scpid);

    res.send("ok");
  } catch (err) {
    console.error("Error", err);
    res.statusCode(500).send(err);
  } finally {
    await _dbClient.close();
  }
});

router.get("/cv", (req, res) => {
  res.render("cv", {});
});

router.get("/scrap", async (req, res) => {
  let scrap = new scrapper();
  await scrap.linkedin();

  let _dbClient = new dbService();

  let jobs = await _dbClient.getJobs(req);
  res.send(jobs);
});

module.exports = router;
