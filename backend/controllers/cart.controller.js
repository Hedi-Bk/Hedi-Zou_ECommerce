import Product from "../models/product.model.js";

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user; // Ici, on suppose que l'utilisateur est déjà authentifié et que ses informations sont attachées à la requête (req.user)
    //. Cela peut être réalisé à l'aide de middleware d'authentification (par exemple, avec un token JWT).
    const existingItem = user.cartItems.find((item) => item.id === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cartItems.push(productId);
    }
    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    console.log("Error in addToCart Controller", error.message);
    res.status(500).json({ message: error.message });
  }
};
export const getCartProducts = async (req, res) => {
  try {
    //Récupérer tous les produits dont les ID figurent dans le tableau req.user.cartItems.
    const products = await Product.find({ _id: { $in: req.user.cartItems } });

    //add quantity to each product
    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find(
        (cartItem) => cartItem.id === product.id
      );
      return {
        ...product.toJSON(),
        quantity: item.quantity,
      };
    });

    res.json({ cartItems });
  } catch (error) {
    console.log("Error in getAllCartProducts Controller", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;
    if (!productId) {
      user.cartItems = [];
    } else {
      user.cartItems = user.cartItems.filter((item) => item.id !== productId);
    }
    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    console.log("Error in removeAllFromCart Controller", error.message);
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params; // Rename id to productId while   destructuring
    const { quantity } = req.body;
    const user = req.user;
    const existingItem = user.cartItems.find((item) => item.id === productId);
    if (existingItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter((item) => item.id !== productId);
        await user.save();
        return res.json(user.cartItems);
      }
      existingItem.quantity = quantity;
      await user.save();
      return res.json(user.cartItems);
    } else {
      res.status(404).json({ message: "Product not found in cart" });
    }
    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    console.log("Error in updateQuantity Controller", error.message);
    res.status(500).json({ message: error.message });
  }
};
