import Product from '../models/product.model.js';
import cloudinary from '../config/cloudinary.js';

export const createProduct = async (req, res) => {
  try {
    const { name, category, price, stock } = req.body;

    if (req.user.role !== 'farmer') {
      return res.status(403).json({ error: 'Only farmers can create products.' });
    }

    const imageUrl = req.file ? req.file.path : 'default.jpg';
    const imageId = req.file ? req.file.filename : '';

    const product = new Product({
      name,
      category,
      price,
      stock,
      image: imageUrl,
      imageId: imageId,
      farmer: req.user._id
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('farmer', 'fullName');
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('farmer', 'fullName');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (product.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this product.' });
    }

    const { name, category, price, stock } = req.body;

    if (req.file) {
      if (product.imageId) {
        await cloudinary.uploader.destroy(product.imageId);
      }

      product.image = req.file.path;
      product.imageId = req.file.filename;
    }

    product.name = name || product.name;
    product.category = category || product.category;
    product.price = price || product.price;
    product.stock = stock || product.stock;

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (product.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this product.' });
    }

    // Delete product image from Cloudinary if exists
    if (product.imageId) {
      await cloudinary.uploader.destroy(product.imageId);
    }

    await product.remove();
    res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

