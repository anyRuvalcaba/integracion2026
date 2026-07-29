import PaymentMethod from "../models/PaymentMethod.js";

const getPaymentMethods = async (req, res, next) => {
  try {
    const paymentMethods = await PaymentMethod.find()
      .select("-cvv")
      .populate("user");
    res.status(200).json(paymentMethods);
  } catch (error) {
    next(error);
  }
};

const getUserPaymentMethods = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const paymentMethods = await PaymentMethod.find({ user: userId }).select(
      "-cvv",
    );
    res.status(200).json(paymentMethods);
  } catch (error) {
    next(error);
  }
};

const getPaymentMethodById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paymentMethod = await PaymentMethod.findById(id)
      .select("-cvv")
      .populate("user");
    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    res.status(200).json(paymentMethod);
  } catch (error) {
    next(error);
  }
};

const createPaymentMethod = async (req, res, next) => {
  try {
    const {
      user,
      type,
      cardNumber,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      accountNumber,
      isDefault,
      cvv,
    } = req.body;

    if (isDefault) {
      await PaymentMethod.updateMany({ user }, { isDefault: false });
    }

    const newPaymentMethod = await PaymentMethod.create({
      user,
      type,
      cardNumber,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      accountNumber,
      isDefault: isDefault || false,
      cvv,
    });
    await newPaymentMethod.populate("user");
    const responseData = newPaymentMethod.toObject();
    delete responseData.cvv;
    res.status(201).json(responseData);
  } catch (error) {
    next(error);
  }
};

const updatePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      type,
      cardNumber,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      accountNumber,
      isDefault,
      cvv,
    } = req.body;

    const existing = await PaymentMethod.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    if (existing.user.toString() !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (isDefault) {
      await PaymentMethod.updateMany(
        { user: existing.user, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
      id,
      { type, cardNumber, cardHolderName, expiryDate, paypalEmail, bankName, accountNumber, isDefault, cvv },
      { new: true }
    ).populate("user");
    const responseData = updatedPaymentMethod.toObject();
    delete responseData.cvv;
    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

const deletePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await PaymentMethod.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    if (existing.user.toString() !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    await PaymentMethod.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export {
  getPaymentMethods,
  getUserPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};