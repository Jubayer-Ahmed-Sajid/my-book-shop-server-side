const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

// Middleware configuration
app.use(
  cors({
    origin: "https://book-shop-jp-project.vercel.app",
    credentials: true,
  })
);

// verify token
const verifyToken = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) return res.status(401).send("Access Denied");
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      res.status(400).send("Invalid Token");
    } else {
      req.user = decoded;
      next();
    }
  });
};

// verify seller
const verifySeller = async (req, res, next) => {
  const { email } = req.user;
  const user = await userCollection.findOne({ email });
  console.log(user);
  if (!user) return res.status(401).send("Access Denied");
  if (user.role !== "seller") return res.status(401).send("Access Denied");
  next();
};
// verify buyer
const verifyBuyer = async (req, res, next) => {
  const { email } = req.user;
  const user = await userCollection.findOne({ email });
  if (!user) return res.status(401).send("Access Denied");
  if (user.role !== "buyer") return res.status(401).send("Access Denied");
  next();
};

// verify admin
const verifyAdmin = async (req, res, next) => {
  const { email } = req.user;
  const user = await userCollection.findOne({ email });
  console.log(user);
  if (!user) return res.status(401).send("Access Denied");
  if (!user.isAdmin) return res.status(401).send("Access Denied");
  next();
};

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

    // jwt token
    app.post("/jwt", async (req, res) => {
      const { email } = req.body;
      const token = jwt.sign({ email }, process.env.TOKEN_SECRET, {
        expiresIn: "10d",
      });
      res.send({ token });
    });

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

    // Add an item to the wishlist for a user
    app.patch(
      "/users/add-wishlist",
      verifyToken,
      verifyBuyer,
      async (req, res) => {
        const { email, id } = req.body;
        console.log(email, id);
        const result = await userCollection.updateOne(
          { email },
          { $addToSet: { wishlist: new ObjectId(String(id)) } } // Avoid duplicates in the wishlist
        );
        res.send(result);
      }
    );

    // Remove an item from the wishlist for a user
    app.patch(
      "/users/remove-wishlist",
      verifyToken,
      verifyBuyer,
      async (req, res) => {
        const { email, id } = req.body;
        console.log(email, id);
        const result = await userCollection.updateOne(
          { email },
          { $pull: { wishlist: new ObjectId(String(id)) } }
        );
        res.send(result);
      }
    );

    // Add an item to the cart for a user
    app.patch("/users/add-cart", verifyToken, verifyBuyer, async (req, res) => {
      const { email, id } = req.body;
      console.log(email, id);
      const result = await userCollection.updateOne(
        { email },
        { $addToSet: { cart: new ObjectId(String(id)) } }
      );
      res.send(result);
    });

    // Remove an item from the cart for a user
    app.patch(
      "/users/remove-cart",
      verifyToken,
      verifyBuyer,
      async (req, res) => {
        const { email, id } = req.body;
        console.log(email, id);
        const result = await userCollection.updateOne(
          { email },
          { $pull: { cart: new ObjectId(String(id)) } }
        );
        res.send(result);
      }
    );

    // Buying api
    app.patch(
      "/users/buy",
      verifyToken,
      verifyBuyer,
      async (req, res) => {
        const { email, id } = req.body;
        console.log(email, id);
        
        const book = await booksCollection.findOne({ _id: new ObjectId(id)});
        if (book.stock === 0) {
          return res.send("Out of stock");
        }
        const result = await booksCollection.updateOne(
          { _id: new ObjectId(id)},
          { $inc: { stock: -1 } }
        );
        const user = await userCollection.updateOne(
          { email },
          { $pull: { cart: new ObjectId(String(id)) } }
        );
        res.send(result);
      }
    );
    
    // Get all users
    app.get("/all-users", verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // Admin status update
    app.patch(
      "/user/update/:email",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        const query = { email };
        const update = { $set:req.body };
        const result = await userCollection.updateOne(query, update);
        res.send(result);
      }
    );

    // approve seller status
    app.patch(
      "/seller/approve/:email",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        const query = { email };
        const update = { $set:  req.body  };
        const result = await userCollection.updateOne(query, update);
        res.send(result);
      }
    );

    // Promote buyer to seller
    app.patch("/users/promote-to-seller/:email", verifyToken, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      console.log(req.body);
      const query = { email };
      const update = { $set: req.body  };
      const result = await userCollection.updateOne(query, update);
      res.send(result);
    });

    // Delete user
    app.delete(
      "/user/delete/:email",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        const query = { email };
        const result = await userCollection.deleteOne(query);
        res.send(result);
      }
    );
    // Books-related APIs

    // Insert a new book
    app.post(
      "/books",
      verifyToken,
      (req, res, next) => {
        verifySeller(req, res, (err) => {
          if (err) {
            verifyAdmin(req, res, next);
          } else {
            next();
          }
        });
      },
      async (req, res) => {
        const books = req.body;
        const query = { email: books.email, name: books.title };

        // Check if the book already exists
        const book = await booksCollection.findOne(query);
        if (book) {
          return res.send("You have already added the book");
        }

        const insertedBook = await booksCollection.insertOne(books);
        res.send(insertedBook);
      }
    );

    // Update book
    app.patch(
      "/book/update/:id",
      verifyToken,
      (req, res, next) => {
        verifySeller(req, res, (err) => {
          if (err) {
            verifyAdmin(req, res, next);
          } else {
            next();
          }
        });
      },
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const update = { $set: req.body };
        const result = await booksCollection.updateOne(query, update);
        res.send(result);
      }
    );

    // Delete book
    app.delete(
      "/book/delete/:id",
      verifyToken,
      (req, res, next) => {
        verifySeller(req, res, (err) => {
          if (err) {
            verifyAdmin(req, res, next);
          } else {
            next();
          }
        });
      },
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await booksCollection.deleteOne(query);
      }
    );

    // Get all books with optional filtering and sorting
    app.get("/all-books", async (req, res) => {
      const { title, sorts, category, author } = req.query;
      const query = {};
      // Filter by title, category, and author
      if (title) {
        query.title = { $regex: title, $options: "i" };
      }
      if (category) {
        query.category = { $regex: category, $options: "i" };
      }
      if (author) {
        query.author = { $regex: author, $options: "i" };
      }
      const sortOptions = sorts === "asc" ? 1 : -1;
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
    app.get("/books/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const book = await booksCollection.findOne(query);
      res.send(book);
    });

    // Get all books
    app.get("/admin-books", verifyToken, verifyAdmin, async (req, res) => {
      const result = await booksCollection.find().toArray();
      res.send(result);
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
    app.get(
      "/added-books/:email",
      verifyToken,
      verifySeller,
      async (req, res) => {
        const email = req.params.email;
        const result = await booksCollection.find({ email }).toArray();
        res.send(result);
      }
    );

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
