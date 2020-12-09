const csv = require("csv-parser");
const fs = require("fs");

const scraped_data = [];

let pass = 0;
let fail = 0;

describe("Validation function", () => {
	// test stuff
	test("it should have valid data with 6 attributes on all 100 items", () => {
		// actual test
		fs.createReadStream("top-100-handphone.csv")
			.pipe(csv())
			.on("data", (row) => {
				scraped_data.push(row);
			})
			.on("end", () => {
				// checking each record has 6 attributes
				scraped_data.forEach((obj) => {
					if (
						Object.values(obj).filter((val) => (val ? true : false)).length == 6
					) {
						++pass;
					} else {
						++fail;
					}
				});

				expect(pass).toEqual(100);
				expect(fail).toEqual(0);
			});
	});
});
