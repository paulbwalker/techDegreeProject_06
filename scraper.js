/* *************************************************
** Project 6 Web Scraper CLI application
************************************************* */

/* REQUIRE STATEMENTS -------------------------------------------------- */
const request = require('request-promise');
const cheerio = require('cheerio');
const csv = require('fast-csv');
const fs = require('fs');

// This variable calls the scrapeDate function and pre-pend to the csv file.
const time = scrapeDate();

// This function gets shirts.php page loads cheerio gets links and returns it. 
(async function() {
  try {
    const entryPoint = 'http://shirts4mike.com/shirts.php';
    const base = entryPoint.slice(0,23);
    const mainHtml = await request(entryPoint);
    const $ = cheerio.load(mainHtml);

    const links = $('.products li a').map((index, element) => {
      const $url = $(element).attr('href');
      return {
        link:`${base}${$url}`,
        URL: $url
      }
  // Have to attach the get function for cheerio to map the links
    }).get();
  // This function waits until all promise is completed then moves on to the next task
    const data = await Promise.all(links.map(async (shirt) => {
  // Async requires you use the try catch block
      try {
        const shirtHtml = await request(shirt.link);
        const $ = cheerio.load(shirtHtml);

        const Title = $('head title').text();
        const Price = $('.price').text();
        const imageURL = $('.shirt-picture img').attr('src');
        const URL = shirt.URL;
        const time = new Date();


             return {
              Title,
              Price,
              imageURL,
              URL,
              time
            }           

      } catch (e) {
        return e.message;
      }
    }));

    fs.mkdir('Data', () => {
      const writableStream = fs.createWriteStream(`./Data/${time}.csv`);

      csv.
      write(data, {headers:true}).pipe(writableStream);

      writableStream.on("finish", function(){
        console.log("Scraping DONE!");
      });
    })

    // console.log(data);
  } catch (e) {
    // If error is thrown the dateTime is written (errorMessageFile) to the scraper-error log
    const dateTime = new Date() + '<errorMessage>';
    const errorMessageFile = fs.writeFile('scraper-error.log', `${dateTime}`, (e) => {
      if (e) {
          console.log('Error while writing to file', e);
      }
    });
  }

})();

// This function formats the date and removes the time from the date method
function scrapeDate() {
  let date = new Date();
  let year = date.getFullYear().toString();
  let month = (date.getMonth() + 1).toString();
  let day = date.getDate().toString();
  (day.length == 1) && (day = '0' + day);
  (month.length == 1) && (month = '0' + month);
  let yyyymmdd = `${year}-${month}-${day}`;
  return yyyymmdd;
}

