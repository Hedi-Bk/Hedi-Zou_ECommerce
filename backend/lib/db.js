import mongoose from "mongoose";

export const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(` Connected To The DataBase :${conn.connection.host}`);
  } catch (error) {
    console.log("Eroor Due  to The Conneting To The DB ", error);
  }
};
