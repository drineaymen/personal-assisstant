const { MongoClient, ServerApiVersion } = require("mongodb");
var ObjectID = require("mongodb").ObjectId;
const { ATLAS_URI, DBNAME } = require("./config");

class dbService {
  client = new MongoClient(ATLAS_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  db;

  async connect() {
    this.client.connect((err) => console.log(err));
    this.db = this.client.db(DBNAME);
  }

  async close() {
    await this.client.close();
  }

  async getJobs(req) {
    try {
      await this.connect();

      let myJobs = await this.db.collection("jobs");
      let jobs = await myJobs.find().toArray();
      return jobs.map((j) => {
        if (req.query.location) {
          j.jobs = j.jobs.filter((s) =>
            s.location.includes(req.query.location)
          );
        }
        if (req.query.validated) {
          j.jobs = j.jobs.filter(
            (j) => String(j.validated) === req.query.validated
          );
        }
        return j;
      });
    } catch (err) {
      console.error("Error", err);
    } finally {
      await this.close();
    }
  }

  async validateJob(jobid, scpid) {
    try {
      await this.connect();

      let myJobs = await this.db.collection("jobs");
      let scrap = await myJobs.findOne({
        _id: ObjectID.createFromHexString(scpid),
      });

      if (scrap) {
        scrap.jobs = scrap.jobs.map((j) => {
          if (j._id.equals(ObjectID.createFromHexString(jobid))) {
            j.validated = true;
          }

          return j;
        });

        await myJobs.updateOne(
          { _id: ObjectID.createFromHexString(scpid) },
          { $set: { jobs: scrap.jobs } },
          { upsert: true }
        );
      }
    } catch (err) {
      console.error("Error", err);
      await this.close();
      throw err;
    } finally {
      await this.close();
    }
  }
}

module.exports = dbService;
