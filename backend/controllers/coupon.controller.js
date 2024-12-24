//
import Coupon from "../models/coupon.model.js";

export const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    });
    res.json(coupon || null);
  } catch (error) {
    console.log("Error in getCoupon Controller", error.message);
    res
      .status(500)
      .json({ message: "Coupon Controller Err", message: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({
      code: code,
      isActive: true,
      userId: req.user._id,
    });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon Not Found" });
    }
    if (coupon.expirationDate < Date.now()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(404).json({ message: "Coupon Expired" });
    }
    res.json({
      message: "Coupon Validated Successfully",
      code: code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (error) {
    console.log("Error in validateCoupon Controller", error.message);
    res
      .status(500)
      .json({ message: "Coupon Controller Err", message: error.message });
  }
};
