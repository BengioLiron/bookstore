const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'db.json');
const ADMIN_PASSWORD = 'ספרן2026'; // אפשר לשנות ולטעון environment production

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = {
        books: [
          {id:1,title:'מאה שנות בדידות',author:'גבריאל גרסיה מרקס',cat:'רומן',price:45,date:Date.now()-100000},
          {id:2,title:'1984',author:"ג'ורג' אורוול",cat:'מדע בדיוני',price:35,date:Date.now()-200000},
          {id:3,title:'הנסיך הקטן',author:'אנטואן דה סנט-אכזופרי',cat:'ילדים',price:28,date:Date.now()-300000},
          {id:4,title:'עלייתו ונפילתו של הרייך השלישי',author:'ויליאם שייר',cat:'היסטוריה',price:55,date:Date.now()-50000},
          {id:5,title:'כך דיבר זרתוסטרה',author:'פרידריך ניטשה',cat:'פילוסופיה',price:40,date:Date.now()-80000},
          {id:6,title:'הנביא',author:'ח\'ליל ג\'ובראן',cat:'פילוסופיה',price:30,date:Date.now()-10000},
          {id:7,title:'החצר השמאלית',author:'עמוס עוז',cat:'רומן',price:38,date:Date.now()-400000},
          {id:8,title:'דיוני',author:'פרנק הרברט',cat:'מדע בדיוני',price:50,date:Date.now()-60000}
        ],
        requests: [],
        nextId: 9
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch(err) {
    console.error('Error reading DB: ', err);
    return {books: [], requests: [], nextId: 1};
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function checkAdmin(req, res, next) {
  const pwd = req.headers['x-admin-password'] || req.body.adminPassword;
  if (pwd && pwd === ADMIN_PASSWORD) return next();
  return res.status(401).json({error: 'Unauthorized'});
}

app.get('/api/books', (req, res) => {
  const db = readDb();
  const sorted = [...db.books].sort((a,b)=>b.date-a.date);
  res.json(sorted);
});

app.post('/api/books', checkAdmin, (req, res) => {
  const {title, author, cat, price, image} = req.body;
  if (!title || !author || !cat || !price) {
    return res.status(400).json({error: 'Missing fields'});
  }
  const db = readDb();
  const book = {id: db.nextId++, title, author, cat, price:Number(price), date:Date.now(), image: image||undefined};
  db.books.unshift(book);
  writeDb(db);
  res.json(book);
});

app.put('/api/books/:id', checkAdmin, (req, res) => {
  const id = Number(req.params.id);
  const {title, author, cat, price, image} = req.body;
  const db = readDb();
  const book = db.books.find(b=>b.id===id);
  if (!book) return res.status(404).json({error:'Not found'});
  if (!title || !author || !cat || !price) return res.status(400).json({error:'Missing fields'});
  book.title = title;
  book.author = author;
  book.cat = cat;
  book.price = Number(price);
  book.image = image||undefined;
  writeDb(db);
  res.json(book);
});

app.delete('/api/books/:id', checkAdmin, (req, res) => {
  const id = Number(req.params.id);
  const db = readDb();
  const before = db.books.length;
  db.books = db.books.filter(b=>b.id!==id);
  if (db.books.length===before) return res.status(404).json({error:'Not found'});
  writeDb(db);
  res.json({success:true});
});

app.post('/api/requests', (req, res) => {
  const {bookId, bookTitle, name, phone, note, email} = req.body;
  if (!bookId || !bookTitle || !name || !phone) {
    return res.status(400).json({error:'Missing fields'});
  }
  const db = readDb();
  const item = {id: db.requests.length+1, bookId, bookTitle, name, phone, note, email, date: new Date().toLocaleString('he-IL')};
  db.requests.unshift(item);
  writeDb(db);
  res.json({success:true, request:item});
});

app.get('/api/requests', checkAdmin, (req, res) => {
  const db = readDb();
  res.json(db.requests);
});

app.use(express.static(path.join(__dirname, '.')));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Bookstore API listening on http://localhost:${port}`);
});
