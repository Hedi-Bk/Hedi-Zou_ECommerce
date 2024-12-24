//Imporatations
import express from "express";
import dotenv from "dotenv"; //AlowsYou TT o read the conteny of the dotenv file
import cookieParser from "cookie-parser";
import { connectDb } from "./lib/db.js";
//Routes
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import payementRoutes from "./routes/payement.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import path from "path";
//
dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();
//
app.use(express.json({ limit: "10mb" })); //Allows you to read the body of the request
app.use(cookieParser()); //Allows you to read the cookies
const __dirname = path.resolve(); //Allows you to get the path of the root of our App

app.use("/api/auth", authRoutes); //Allows you to use the routes
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payements", payementRoutes);
app.use("/api/analytics", analyticsRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`this is Running on ${PORT} hedi`);
  //Connect to the DB
  connectDb();
});
