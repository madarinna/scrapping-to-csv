const pup = require ('puppeteer');
const ObjectsToCsv = require('objects-to-csv');

run();

async function run(){
    const itemsList = await scrap("https://www.tokopedia.com/p/handphone-tablet/handphone?page=1&rt=4,5");
    await writeToCSV(itemsList);
}

async function scrap(mainUrl) { //function to start scraping on the main page
    const browser = await pup.launch({ headless: false });
    const mainPage = await browser.newPage();
    await mainPage.setViewport({
        width: 1280,
        height: 703
    });

    await mainPage.setDefaultNavigationTimeout(0);

    await mainPage.goto(mainUrl);

    await autoScroll(mainPage);

    let itemsList=[];
    itemsList = await getMainInfo(mainPage, itemsList); // fetch main info of items (e.g. name, price, img URL) in the first page

    if (Object.keys(itemsList).length < 100){ // go to the next page if the amount of data needed is not enough
        await mainPage.evaluate(async() => {
            await document.querySelector('#zeus-root > div > div:nth-child(2) > div > div.css-1xpribl.e1nlzfl4 > div > div.css-18p2ktc > div.css-13wayc1 > div > div.css-txlndr-unf-pagination > div > button.css-1gpfbae-unf-pagination-item.e19tp72t3').click();
        });

        await mainPage.reload({ waitUntil: ["networkidle0", "domcontentloaded"] }); 

        await autoScroll(mainPage);
        
        itemsList = await getMainInfo(mainPage, itemsList); // fetch main info of items in the next page

        console.log("Items:", Object.keys(itemsList).length);
    }

    for (var x in Object.keys(itemsList)){ // fetch the detailed info for each item e.g. description and rating
        itemsList[x] = await getDetailItem(itemsList[x], mainPage);
        console.log('Item:', parseInt(x)+1);
        // console.log(itemsList[x]);
    }

    await browser.close();

    return (itemsList);
}

async function getMainInfo(mainPage, results){ // function to get main info of the data e.g. name, price, img URL
    try {
        return await mainPage.evaluate((results) => {
            let links = document.querySelectorAll('#zeus-root > div > div:nth-child(2) > div > div.css-1xpribl.e1nlzfl4 > div > div.css-18p2ktc > div.css-13wayc1 > div > div.css-13l3l78.e1nlzfl13 > div')
            let items = [...links];
            let dif = items.length;

            if (Object.keys(results).length > 0) dif = 100 - Object.keys(results).length;
            
            items.slice(0, dif).map( item => {
                url = item.querySelector('a.css-89jnbj').href,
                name = item.querySelector('span.css-1bjwylw').innerText,
                price = item.querySelector('span.css-o5uqvq').innerText,
                image = item.querySelector('img[class="success fade"]').src
                results.push({
                    item_url: url,
                    item_name:  name,
                    item_price: price,
                    item_image: image
                })
            });
            return results;
        }, results);
    } catch (UnhandledPromiseRejectionWarning) {
        console.log("catching error in getMainInfo");
        await mainPage.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
        await autoScroll(mainPage);
        return await mainPage.evaluate((results) => {
            let links = document.querySelectorAll('#zeus-root > div > div:nth-child(2) > div > div.css-1xpribl.e1nlzfl4 > div > div.css-18p2ktc > div.css-13wayc1 > div > div.css-13l3l78.e1nlzfl13 > div')
            let items = [...links];
            let dif = items.length;

            if (Object.keys(results).length > 0) dif = 100 - Object.keys(results).length;
            
            items.slice(0, dif).map( item => {
                url = item.querySelector('a.css-89jnbj').href,
                name = item.querySelector('span.css-1bjwylw').innerText,
                price = item.querySelector('span.css-o5uqvq').innerText,
                image = item.querySelector('img[class="success fade"]').src
                results.push({
                    item_url: url,
                    item_name:  name,
                    item_price: price,
                    item_image: image
                })
            });
            return results;
        }, results);
    }
}

async function getDetailItem(result, page){ // function to get the detailed info of item e.g. description and rating
    try {    
        await page.goto(result.item_url);
        await autoScroll(page);
        await page.waitForSelector(".css-1as1ohz");
        let description = await page.evaluate(() => {
            return document.querySelector(".css-1as1ohz").innerText;
        });
        let rating = await page.evaluate(() => {
            return document.querySelector("span.css-4g6ai3 > span:nth-child(1)").innerText;
        });
        result.item_description = description;
        result.item_rating = rating;
        return result;
    } catch (UnhandledPromiseRejectionWarning) {
        console.log("catching error in getDetailItem");
        await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
        await autoScroll(page);
        await page.waitForSelector(".css-1as1ohz");
        let description = await page.evaluate(() => {
            return document.querySelector(".css-1as1ohz").innerText;
        });
        let rating = await page.evaluate(() => {
            return document.querySelector("span.css-4g6ai3 > span:nth-child(1)").innerText;
        });
        result.item_description = description.split("\n").join("");
        result.item_rating = rating;
        return result;
    }
}

async function autoScroll(page){ // function to get the page scrolling
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight*(2/3)){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

async function writeToCSV(data) {
    try {
        const csv = new ObjectsToCsv(data);
   
        // Save to file:
        await csv.toDisk('./top-100-handphone.csv');
    
        // Return the CSV file as string:
        console.log(await csv.toString());
    } catch (UnhandledPromiseRejectionWarning){
        console.log("catching error in writeToCSV")
    }
};
