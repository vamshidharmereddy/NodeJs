const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
  }
};

initializeDBAndServer();
app.get("/books/", async (request, response) => {
  const getBooksQuery = `SELECT * FROM book ORDER BY book_id`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

app.get("/authors/", async (request, response) => {
  const getBooksQuery = `SELECT * FROM author ORDER BY author_id`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});
