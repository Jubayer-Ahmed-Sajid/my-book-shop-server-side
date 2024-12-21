const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

// middlewares

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vqva6ft.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const userCollection = client.db("my-book-shop").collection("Users");
const booksCollection = client.db("my-book-shop").collection("books");
async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // User related api

    // insert user
    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      const query = { email: req.body.email };
      const user = userCollection.findOne(query);
      if (user.email == query) {
        return res.send({ message: "User already exist" });
      }
      console.log(userInfo);
      const result = await userCollection.insertOne(userInfo);
      res.send(result);
    });

    // get user data api
    app.get("/user/:email", async (req, res) => {
      const email = req.params;
      console.log(email);
      const user = await userCollection.findOne(email);
      res.send(user);


    //   books related api

    // insert book api
    app.post("/books", async(req,res)=>{
        const books = req.body
        const query = {email: books.email, name:books.title}
        const book =await booksCollection.findOne(query)
        if(book){
            return res.send("You have already added the book")
        }
        const insertedBook = await booksCollection.insertOne(books)
        res.send(insertedBook)

    })

    // get all books api
    app.get("/all-books",async(req,res)=>{

        const { title, sorts, category, author } = req.query;
        const query = {};
        console.log(req.query)
        if (title) {
          query.title = { $regex: title, $options: "i" };
        }
        if (category) {
          query.category = category;
        }
        if (author) {
          query.author = { $regex: author, $options: "i" };
        }
        const sortOptions = sorts === "asc" ? 1 : -1;
        const books =await booksCollection.find(query)
        .sort({ price: sortOptions })
        .toArray(query)
       

        const booksInfo =await booksCollection.find(
        {},
        { projection: { category: 1, author: 1 } }
      ).toArray();

      const authors = [...new Set(booksInfo.map((book) => book.author))];
      const categories = [
        ...new Set(booksInfo.map((book) => book.category))
      ];
      const totalBook = await booksCollection.countDocuments(query);
      res.send({ books, authors, categories, totalBook });
    
    })
    });
  } catch (error) {
    console.log(error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});
app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});
