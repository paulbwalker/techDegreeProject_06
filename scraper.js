/* *************************************************
** Project 6 Web Scraper CLI application
************************************************* */

/* REQUIRE STATEMENTS -------------------------------------------------- */
const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const Json2csvParser = require('json2csv').Parser;

/* GLOBAL VARIABLES ----------------------------------------------------- */
const time = scrapeDate();
const fields = ['Title','Price','imageURL','URL','time'];
const folderName = './Data'; 

/* SEPERATE FUNCTION STATEMENTS ----------------------------------------- */

// This function checks if there is a folder make new one if not.
function checkIffolder () {
  try {
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName)
    }
  } catch (err) {
    console.error(err)
  }
}

// This function formats the time for file name
function scrapeDate () {
  let date = new Date();
  let year = date.getFullYear().toString();
  let month = (date.getMonth() + 1).toString();
  let day = date.getDate().toString();
  (day.length == 1) && (day = '0' + day);
  (month.length == 1) && (month = '0' + month);
  let yyyymmdd = `${year}-${month}-${day}`;
  return yyyymmdd;
}

// This function will write out errors to the scraper-error log
// Function gets called in the catch statement if there is an error
function errorMessageFn () {
    const dateTime = new Date() + '<errorMessage>';
    const errorMessageFile = fs.writeFileSync('scraper-error.log', 
								`${dateTime}\n`, {flag: 'a'}, (e) => {
      if (e) {
          console.log('Error while writing to file', e);
      }
    });
}


/* WEB SCRAPER FUNCTION ---------------------------------------------------- */

// This function gets entryPoint, loads cheerio, gets links and returns it. 
// The base removes the shirts.php. I await response then call the entryPoint.
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
  // Have to attach the get function or you get a cheerio array
    }).get();

	    const data = await Promise.all(links.map(async (shirt) => {
	    	try {

	    		const shirtHtml = await request(shirt.link);
	    		const $ = cheerio.load(shirtHtml);
	    		const Title = $('head title').text();
		        const Price = $('.price').text();
		        const imageURL = `${base}` + $('.shirt-picture img').attr('src');
		        const URL = shirt.link;
		        const time = new Date();

		        return {
				          Title,
				          Price,
				          imageURL,
				          URL,
				          time
				        } 

	    	}

    	catch (err) {
    		console.error(err);
    		errorMessageFn();
    	}

	    }));
  			  checkIffolder ();
			  const json2csvParser = new Json2csvParser({ fields });
			  const csv = json2csvParser.parse(data);
			  const writableStream = fs.writeFileSync(`./Data/${time}.csv`, csv); 
			  console.log('Done!');

	} 
	catch (err) {
		console.log('Our error', err);
		errorMessageFn();
	}

}());