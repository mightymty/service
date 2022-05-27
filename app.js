const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const pdf = require('html-pdf');
const ejs = require('ejs');

const PORT = 4000;
const app = express();

app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//ejs
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

app.get('/form1', (request, response) => {
  response.sendFile(path.join(__dirname, '/public/firstForm.html'));
});

app.get('/form2', (request, response) => {
  response.sendFile(path.join(__dirname, '/public/secondForm.html'));
});

app.get('/', (request, response) => {
  //This route will default to index.html. If that does not exist the text No index found will show.
  response.send('No index found!');
});

const checkFileExist = async (filePath, timeout = 5000) => {
  let totalTime = 0;
  let checkTime = timeout / 10;

  return await new Promise((resolve, reject) => {
    const timer = setInterval(function() {
      totalTime += checkTime;

      let fileExists = fs.existsSync(filePath);

      if (fileExists || totalTime >= timeout) {
          clearInterval(timer);
          resolve(fileExists);
      }
    }, checkTime);
  });
}

const getTime = () => {
  const time = new Date();
  const year = time.getFullYear();
  const month = time.getMonth();
  const day = time.getDate();
  const hour = time.getHours();
  const minute = time.getMinutes();
  const second = time.getSeconds();

  return `${year}${month}${day}${hour}${minute}${second}`;
}

app.post('/save', (req, res) => {

  //Det är här man skriver koden för att convertera datan till PDF
  //En html template som fylls med datan från req.body converteras till PDF

  const body = JSON.stringify(req.body);
  const template = fs.readFileSync(path.join(__dirname, '/views/template.ejs'), 'utf8');
  const html = ejs.compile(template);
  const page = html({ title: 'Välkommen', body });
  const options = { format: 'A4' };

  //res.render('template', { title: 'Välkommen', body });
  (async function run(){

    const filePath = `../tornado-${getTime()}.pdf`;
    pdf.create(page, options).toFile(filePath, function(err, res) {
      if (err) return console.log(err);
      console.log(res);
    });

    await checkFileExist(filePath);

    console.log('POSTED FROM CLIENT: ', req.body);
    res.sendFile(path.join(__dirname, filePath));
    return;
  }());

});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
