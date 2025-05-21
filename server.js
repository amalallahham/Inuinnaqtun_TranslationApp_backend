import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import MongoStore from "connect-mongo";
import crypto from "crypto";
import session from "express-session";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/user.js";
import apiRoutes from "./routes/api.js";

import bodyParser from "body-parser";

dotenv.config();

const app = express();

connectDB();

app.use(
  session({
    secret: crypto.randomBytes(20).toString("hex"),
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 },
  })
);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, res, next) => {
  const excludeRoutes = ["/login", "/register", "/404"];
  res.locals.user = excludeRoutes.includes(req.path)
    ? null
    : req?.session?.user;
  next();
});

app.set("view engine", "ejs");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.use("/admin", adminRoutes);
app.use("/", userRoutes);
app.use("/api", apiRoutes);

app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found", user: null });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
