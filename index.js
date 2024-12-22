const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

// Middleware configuration
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// MongoDB connection URI using environment variables
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vqva6ft.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB client configuration
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Collections
const userCollection = client.db("my-book-shop").collection("Users");
const booksCollection = client.db("my-book-shop").collection("books");
const testimonialCollection = client
  .db("my-book-shop")
  .collection("testimonials");

// Main function to handle MongoDB operations
async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");

    // User-related APIs

    // Insert user into the database
    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      const query = { email: req.body.email };

      // Check if the user already exists
      const user = await userCollection.findOne(query);
      if (user?.email === query.email) {
        return res.send({ message: "User already exists" });
      }

      console.log(userInfo);
      const result = await userCollection.insertOne(userInfo);
      res.send(result);
    });

    // Get user data by email
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const user = await userCollection.findOne({ email });
      res.send(user);
    });

    // Update wishlist for a user
    app.patch("/users/add-wishlist", async (req, res) => {
      const { email, id } = req.body;
      console.log(email, id);
      const result = await userCollection.updateOne(
        { email },
        { $addToSet: { wishlist: new ObjectId(String(id)) } } // Avoid duplicates in the wishlist
      );
      res.send(result);
    });

    // Add an item to the cart for a user
    app.patch("/users/add-cart", async (req, res) => {
      const { email, id } = req.body;
      console.log(email, id);
      const result = await userCollection.updateOne(
        { email },
        { $addToSet: { cart: new ObjectId(String(id)) } }
      );
      res.send(result);
    });

    // Books-related APIs

    // Insert a new book
    app.post("/books", async (req, res) => {
      const books = req.body;
      const query = { email: books.email, name: books.title };

      // Check if the book already exists
      const book = await booksCollection.findOne(query);
      if (book) {
        return res.send("You have already added the book");
      }

      const insertedBook = await booksCollection.insertOne(books);
      res.send(insertedBook);
    });

    // Get all books with optional filtering and sorting
    app.get("/all-books", async (req, res) => {
      const { title, sorts, category, author } = req.query;
      const query = {};

      console.log(req.query);

      // Filter by title, category, and author
      if (title) {
        query.title = { $regex: title, $options: "i" };
      }
      if (category) {
        query.category = category;
      }
      if (author) {
        query.author = { $regex: author, $options: "i" };
      }

      const sortOptions = sorts === "asc" ? 1 : -1; // Ascending or descending sort

      // Fetch books with applied filters and sorting
      const books = await booksCollection
        .find(query)
        .sort({ price: sortOptions })
        .toArray();

      // Fetch unique authors and categories
      const booksInfo = await booksCollection
        .find({}, { projection: { category: 1, author: 1 } })
        .toArray();
      const authors = [...new Set(booksInfo.map((book) => book.author))];
      const categories = [...new Set(booksInfo.map((book) => book.category))];
      const totalBook = await booksCollection.countDocuments(query);

      res.send({ books, authors, categories, totalBook });
    });

    // Get a single book by ID
    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const book = await booksCollection.findOne(query);
      res.send(book);
    });

    // Get books for the featured section
    app.get("/featured-books", async (req, res) => {
      const count = parseInt(req.query.count) || 4; // Default to 4 books if count is not provided
      const books = await booksCollection
        .aggregate([{ $sample: { size: count } }])
        .toArray();
      res.send(books);
    });

    // Seller added books
    app.get("/added-books/:email", async (req, res) => {
      const email = req.params.email;
      const result = await booksCollection.find({ email }).toArray();
      res.send(result);
    });

    // Testimonials-related APIs

    // Get all testimonials
    app.get("/testimonials", async (req, res) => {
      const result = await testimonialCollection.find().toArray();
      res.send(result);
    });
  } catch (error) {
    console.log(error); // Handle any errors that occur
  }
}
run().catch(console.dir);

// Default route for server health check
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});
