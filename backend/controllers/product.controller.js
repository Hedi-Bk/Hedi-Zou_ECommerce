import redis from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}); //Find all products
    /*
    [
      { _id: "1", name: "Laptop", price: 1200, description: "High performance laptop" },
      { _id: "2", name: "Mouse", price: 25, description: "Wireless mouse" }
  ]
    */
    res.json({ products }); // =>res.data = { products } => res.data.products = products(Array)
  } catch (error) {
    console.log("Error in getAllProducts Controller", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_Products"); //Get the featured products from Redis Stored as "String"
    if (featuredProducts) {
      featuredProducts = JSON.parse(featuredProducts); //Convert the String to an Array
      return res.json(featuredProducts);
    }
    //If the featured products are not in Redis, fetch them from the database MONDODB
    featuredProducts = await Product.find({ isFeatured: true }).lean(); //Lean() method returns a plain JavaScript object ="{}" instead of a Mongoose document
    if (!featuredProducts) {
      return res
        .status(404)
        .json({ message: "No Featured Products Found in the DB" });
    }

    //Store the featured products in Redis
    await redis.set("featured_Products", JSON.stringify(featuredProducts));
    res.json(featuredProducts);
  } catch (error) {
    console.log("Error in getFeaturedProducts Controller", error.message);
    res.status(500).json({ message: "server Error", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;
    let cloudinaryResponse = null;
    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }
    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url
        ? cloudinaryResponse.secure_url
        : "",
      category,
    });
    res.status(201).json(product);
  } catch (error) {
    console.log("Error in createProduct Controller", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product Not Found" });
    }
    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("Image Deleted Successfully");
      } catch (error) {
        console.log("Error in deleting image from Cloudinary", error.message);
      }
    }
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Product Deleted Successfully" });
  } catch (error) {
    console.log("Error in deleteProduct Controller", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 3 } },
      { $project: { _id: 1, name: 1, image: 1, price: 1, description: 1 } },
    ]);
    res.json(products); //res.data = products
  } catch (error) {
    console.log("Error in getRecommendedProducts Controller", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  //category = shoes for example
  try {
    const products = await Product.find({ category });
    res.json({ products });
  } catch (error) {
    console.log("Error in getProductsByCategory Controller", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();
      //update the featured products in Redis  ==update the cache
      await updateFeaturedProductCache();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product Not Found" });
    }
  } catch (error) {
    console.log("Error in toggleFeaturedProduct Controller", error.message);
    res.status(500).json({ message: error.message });
  }
};
async function updateFeaturedProductCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_Products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.log("Error in updateFeaturedProductCache", error.message);
  }
}
