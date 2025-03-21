import Product from '../models/product.model.js';

export const reduceProductStock = async (productId, amount) => {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    if (product.stock < amount) throw new Error('Not enough stock available');
  
    product.stock -= amount;
    await product.save();
    return product;
  };
