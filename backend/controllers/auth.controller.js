import redis from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken"; //Allows you to create and verify tokens
//Signup Controller

const generateToken = (userId) => {
  //crée un jeton en utilisant une clé secrète et le temps d'expiration
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_TOKEN_SECRET,
    {
      expiresIn: "15m",
    }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    {
      expiresIn: "7d",
    }
  );
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  // Stocker le Refresh Token dans la base Redis pour une durée limitée de 7 jours
  await redis.set(
    // redis.set() sauvegarde le Refresh Token avec une expiration définie
    `Refrech Token : ${userId} `,
    refreshToken,
    "EX", //EXPIRATION
    60 * 60 * 24 * 7
  ); //7 days
};
//
const setCookies = (res, accessToken, refreshToken) => {
  //Stocker les Access et Refresh Tokens dans des cookies

  res.cookie("accessToken", accessToken, {
    //accessToken = Key name =what u will see
    httpOnly: true, //Prevents the cookie from being accessed by client-side scripts ==XSS
    secure: process.env.NODE_ENV === "production", // In the production environment, the cookie will only be sent over HTTPS
    sameSite: "strict", //Prevents the cookie from being sent to the server with cross-site requests Forgery ==CRSF
    maxAge: 15 * 60 * 1000, //Expires in 15 minutes
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, //Expires in 7 days
  });
};
export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "User Already Exists From auth.controller" });
    }
    //Create User
    const user = await User.create({ email, password, name });
    //Authenticate User
    const { accessToken, refreshToken } = generateToken(user._id);
    await storeRefreshToken(user._id, refreshToken); //Store Refresh Token
    setCookies(res, accessToken, refreshToken);
    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "User Created Successfully",
    });
    //
  } catch (error) {
    res.status(500).json({ message: error });
  }
};
//Login Controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = generateToken(user._id);
      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);
      res.status(200).json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        message: "Login Successfully",
      });
    } else {
      res.status(401).json({ message: "Invalid Credentials " });
    }
  } catch (error) {
    console.log(" Error In The login Controller", error);
    res.status(500).json({ message: error.message });
  }
};

//Logout Controller
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_TOKEN_SECRET
      );
      await redis.del(`Refrech Token : ${decoded.userId} `);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logout Successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error logging out", error: error.message });
  }
};

//Refresh Token Controller
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh Token Not Found" });
    }
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET
    );
    const storedToken = await redis.get(`Refrech Token : ${decoded.userId} `);
    if (refreshToken !== storedToken) {
      return res.status(401).json({ message: "Invalid Refresh Token" });
    }
    const accessToken = jwt.sign(
      //La méthode jwt.sign génère un JSON Web Token (JWT)
      { userId: decoded.userId },
      process.env.JWT_ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    //Stocker les Access dans des cookies
    res.cookie("accessToken", accessToken, {
      //accessToken = Key name =what u will see
      httpOnly: true, //Prevents the cookie from being accessed by client-side scripts ==XSS
      secure: process.env.NODE_ENV === "production", // In the production environment, the cookie will only be sent over HTTPS
      sameSite: "strict", //Prevents the cookie from being sent to the server with cross-site requests Forgery ==CRSF
      maxAge: 15 * 60 * 1000, //Expires in 15 minutes
    });

    res.json({ "accessToken ": accessToken, message: "Token Refreshed" });
  } catch (error) {
    console.log("Error Refreshing Token", error);
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    res.json(req.user); //req.user = user;
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
