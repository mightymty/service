const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const html2pdf = require("html-pdf");
const ejs = require("ejs");

const PORT = 4000;
const app = express();

app.use(express.static(path.join(__dirname, "/public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//ejs
app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");

app.get("/tornado", (request, response) => {
  response.sendFile(path.join(__dirname, "/public/tornado.html"));
});

app.get("/paternoster", (request, response) => {
  response.sendFile(path.join(__dirname, "/public/paternoster.html"));
});

app.get('/fardigrapport', (request, response) => {
  response.sendFile(path.join(__dirname, '/public/fardigrapport.html'));
});

app.get('/arbetsorder', (request, response) => {
  response.sendFile(path.join(__dirname, '/public/arbetsorder.html'));
});

app.get('/pdf', (request, response) => {
  response.sendFile(path.join(__dirname, '/public/arbetsorder.html'));
});

app.get('/', (request, response) => {
  //This route will default to index.html. If that does not exist the text No index found will show.
  response.send("No index found!");
});

const checkFileExist = async (filePath, timeout = 5000) => {
  let totalTime = 0;
  let checkTime = timeout / 10;

  return await new Promise((resolve, reject) => {
    const timer = setInterval(function () {
      totalTime += checkTime;

      let fileExists = fs.existsSync(filePath);

      if (fileExists || totalTime >= timeout) {
        clearInterval(timer);
        resolve(fileExists);
      }
    }, checkTime);
  });
};

const getTime = () => {
  let time = new Date();
  const offset = time.getTimezoneOffset()
  time = new Date(time.getTime() - (offset*60*1000))
  time.toISOString().split('T')[0]

  const year = time.getFullYear();
  const month = time.getMonth()+1;
  const day = time.getDate();
  return `${year}${month}${day}`;
};

app.post("/save", (req, res) => {
  //Det är här man skriver koden för att convertera datan till PDF
  //En html template som fylls med datan från req.body converteras till PDF

  console.log("POSTED: ", req.body);

  const template = fs.readFileSync(
    path.join(__dirname, "/public/pdf-template.ejs"),
    "utf8"
  );
  const html = ejs.compile(template);
  const page = html({ title: "Välkommen", data: req.body, ...req.body });
  const options = {
    format: "A4",
    base: req.protocol + "://" + req.get("host"),
  };

  //res.send(page); Uncomment to display page without saving pdf

  (async function run() {
    const { machine_type, location, client, unit_nbr } = req.body;

    const filePath = `../${getTime()}_${machine_type}_${location}_${client}_${unit_nbr}.pdf`;

    const stream = await createHtlm2PdfStream(page, options);
    res.contentType('application/pdf');
    stream.pipe(res);

    const fil = await  html2pdf.create(page, options).toFile(filePath, function (err, res) {
      if (err) return console.log(err);
    });
    console.log(fil)

    res.sendFile(path.join(__dirname, filePath), function (err) {
      if (err) {
        res.status(err.status).end();
      }
    });
  })();
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

function createHtlm2PdfStream(html, options) {
    return new Promise((resolve, reject) => {
        html2pdf.create(html, options).toStream((err, stream) => {
            if (err) {
                return reject(err);
            }
            resolve(stream);
        });
    });
}