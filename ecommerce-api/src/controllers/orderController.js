import Order from "../models/Order.js";

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user")
      .populate("products.productId")
      .populate("address")
      .populate("paymentMethod");
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("user")
      .populate("products.productId")
      .populate("address")
      .populate("paymentMethod");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.user._id.toString() !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const { user, products, address, paymentMethod, totalPrice, shippingCost } =
      req.body;

    const newOrder = await Order.create({
      user,
      products,
      address,
      paymentMethod,
      totalPrice,
      shippingCost,
    });

    await newOrder.populate("user");
    await newOrder.populate("products.productId");

    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const existing = await Order.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (existing.user.toString() !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await Order.findByIdAndUpdate(
      id,
      { status, paymentStatus },
      { new: true },
    );

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export { getOrders, getOrderById, createOrder, updateOrderStatus };