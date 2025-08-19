const fs = require("fs");
const pdfParse = require("pdf-parse");

const filePath = "./sample.pdf"; // replace with your PDF file path

const dataBuffer = fs.readFileSync("SampleContract-Shuttle.pdf");

pdfParse(dataBuffer).then(data => {
    console.log("PDF text content:\n", data.text);
}).catch(err => {
    console.error("Error parsing PDF:", err);
});