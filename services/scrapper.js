const axios = require("axios");
var dbService = require("./db.service");
var ObjectID = require("mongodb").ObjectId;
const fs = require("fs");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

class Scrapper {
  axiosConfig = {
    url: "",
    method: "get",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0",
    },
  };

  async linkedin() {
    this.axiosConfig.url =
      "https://www.linkedin.com/jobs/search/?currentJobId=3923594750&distance=25&f_WT=1&geoId=100459316&keywords=c%23%20developer&origin=JOBS_HOME_SEARCH_CARDS";
    await axios(this.axiosConfig)
      .catch((error) => {
        fs.writeFile(
          __dirname +
            "/../logs/errors" +
            new Date().toLocaleString("DDMMYYY") +
            ".txt",
          JSON.stringify(error.toJSON()),
          (err) => {
            if (err) {
              console.error("fs log error: ", err);
            }
          }
        );
      })
      .then(async (response) => {
        const dom = new JSDOM(response.data.replace("/s+/g", ""));
        let jobs = [
          ...dom.window.document.querySelectorAll(
            ".base-search-card.base-search-card--link.job-search-card"
          ),
        ];
        jobs = await Promise.all(
          jobs.map(async (s) => {
            let jobLink = s.querySelector(".base-card__full-link");
            let jobTitle = s.querySelector(".base-search-card__title");
            let company = s.querySelector(".base-search-card__subtitle");
            let location = s.querySelector(".job-search-card__location");
            let jobTime = s.querySelector(".job-search-card__listdate");
            let jobDesc = await this.getJobDescription(jobLink.href);

            return {
              _id: new ObjectID(),
              link: jobLink.href,
              title: jobTitle.textContent.trim(),
              location: location.textContent.trim(),
              date: jobTime?.attributes?.getNamedItem("dateTime")?.textContent,
              description: jobDesc,
              company: company.textContent.trim(),
              validated: false,
            };
          })
        );

        jobs = jobs.filter((s) => s.date);

        if (jobs.length > 0) {
          //insert in bdd here
          let _dbClient = new dbService();
          try {
            await _dbClient.connect();

            let myJobs = await _dbClient.db.collection("jobs");
            await myJobs.insertOne({
              source: "linkedin",
              scrapped: new Date().toISOString(),
              jobs: jobs,
            });
            console.log("Scrapper completed.", new Date().toISOString());
          } catch (err) {
            console.error("Error", err);
          } finally {
            await _dbClient.close();
          }
        }
      });
  }

  async getJobDescription(link) {
    this.axiosConfig.url = link;

    let response = await axios(this.axiosConfig).catch((error) => {
      fs.writeFile(
        __dirname +
          "/../logs/errors" +
          new Date().toLocaleString("DDMMYYY") +
          ".txt",
        JSON.stringify(error.toJSON()),
        (err) => {
          if (err) {
            console.error("fs log error: ", err);
          }
        }
      );
    });

    if (response) {
      const dom = new JSDOM(response.data.replace("/s+/g", ""));

      let description = dom.window.document.querySelector(
        ".description__text.description__text--rich"
      );

      return description.innerHTML.trim();
    }
  }
}

module.exports = Scrapper;
