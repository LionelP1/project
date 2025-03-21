import Order from '../models/order.model.js';
import Product from '../models/product.model.js';

import { reduceProductStock } from '../utils/productUtils.js';

export const placeOrder = async (req, res) => {
    try {
      const { products } = req.body;
  
      if (req.user.role !== 'buyer') {
        return res.status(403).json({ error: 'Only buyers can place orders.' });
      }
  
      let totalPrice = 0;
      const productList = [];
  
      for (const item of products) {
        const product = await Product.findById(item.product);
        if (!product) return res.status(404).json({ error: `Product not found: ${item.product}` });
        if (product.stock < item.purchaseAmount) return res.status(400).json({ error: `Not enough stock for product: ${product.name}` });
  
        totalPrice += product.price * item.purchaseAmount;
        productList.push({ product, purchaseAmount: item.purchaseAmount });
      }
  
      const order = new Order({
        buyer: req.user._id,
        products,
        totalPrice
      });
      await order.save();
  
      for (const { product, purchaseAmount } of productList) {
        await reduceProductStock(product._id, purchaseAmount);
      }
  
      res.status(201).json(order);
    } catch (error) {
      console.error('Error placing order:', error.message);
      res.status(500).json({ error: error.message });
    }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('products.product', 'name price')
      .sort('-createdAt');

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getOrdersForMyProducts = async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ error: 'Only farmers can view orders for their products.' });
    }

    const myProductIds = await Product.find({ farmer: req.user._id }).distinct('_id');

    const orders = await Order.find({ 'products.product': { $in: myProductIds } })
      .populate('products.product', 'name price')
      .populate('buyer', 'fullName')
      .sort('-createdAt');

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching farmer orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id).populate('products.product');

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const isOwner = order.products.some(
      (item) => item.product.farmer.toString() === req.user._id.toString()
    );

    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to update this order.' });
    }

    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    order.status = status;
    await order.save();

    res.status(200).json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this order.' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be cancelled.' });
    }

    for (const item of order.products) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.purchaseAmount;
        await product.save();
      }
    }

    order.status = 'cancelled';
    await order.save();

    res.status(200).json({ message: 'Order cancelled successfully.' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const addProductToOrder = async (req, res) => {
  try {
    const { productId, purchaseAmount } = req.body;

    let order = await Order.findOne({ buyer: req.user._id, status: 'pending' }).populate('products.product');

    if (!order) {
      order = new Order({
        buyer: req.user._id,
        products: [],
        totalPrice: 0
      });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    if (product.stock < purchaseAmount) {
      return res.status(400).json({ error: 'Not enough stock available.' });
    }

    const existingItem = order.products.find(item => item.product._id.toString() === productId);
    if (existingItem) {
      existingItem.purchaseAmount += purchaseAmount;
    } else {
      order.products.push({ product: productId, purchaseAmount });
    }

    let totalPrice = 0;
    for (const item of order.products) {
      totalPrice += item.product.price * item.purchaseAmount;
    }
    order.totalPrice = totalPrice;

    await order.save();

    res.status(200).json({ message: 'Product added to cart (pending order).', order });
  } catch (error) {
    console.error('Error adding product to cart-like order:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const removeProductFromOrder = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    const order = await Order.findById(orderId).populate('products.product');

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to modify this order.' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot modify an order that is not pending.' });
    }

    const updatedProducts = order.products.filter(
      (item) => item.product._id.toString() !== productId
    );

    if (updatedProducts.length === order.products.length) {
      return res.status(404).json({ error: 'Product not found in this order.' });
    }

    order.products = updatedProducts;

    let totalPrice = 0;
    for (const item of order.products) {
      totalPrice += item.product.price * item.purchaseAmount;
    }
    order.totalPrice = totalPrice;

    await order.save();

    res.status(200).json({ message: 'Product removed from order.', order });
  } catch (error) {
    console.error('Error removing product from order:', error);
    res.status(500).json({ error: 'Server error' });
  }
};



