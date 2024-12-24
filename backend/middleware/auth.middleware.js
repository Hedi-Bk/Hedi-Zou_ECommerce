import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res
        .status(401)
        .json({ message: " Unauthorized: Access Token Not Found" });
    }

    try {
      const decoded = jwt.verify(
        accessToken,
        process.env.JWT_ACCESS_TOKEN_SECRET
      );
      const user = await User.findById(decoded.userId).select("-password"); //Find the User and deslect the password
      if (!user) {
        return res.status(401).json({ message: " User Not Found" });
      }
      req.user = user;
      next(); // this Will Call adminRoute which is the next middleware
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: " Access Token Expired" });
      }
      throw error;
    }
  } catch (error) {
    console.log("Error In The protectRoute Middleware", error);
    return res.status(500).json({ message: "  Invaliddde access Token" });
  }
};

export const adminRoute = async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied - Admin only" });
  }
};
