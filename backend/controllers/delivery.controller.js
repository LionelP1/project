import Delivery from '../models/delivery.model.js';
import Order from '../models/order.model.js';


export const acceptDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;

    const activeDelivery = await Delivery.findOne({
      deliveryAgent: req.user._id,
      status: { $in: ['pending', 'out_for_delivery'] }
    });

    if (activeDelivery) {
      return res.status(400).json({ error: 'You already have an active delivery.' });
    }

    const order = await Order.findOne({ _id: orderId, status: 'confirmed', isDeliveryAssigned: false });
    if (!order) return res.status(404).json({ error: 'Order not available for delivery.' });

    const delivery = new Delivery({
      order: orderId,
      deliveryAgent: req.user._id
    });
    await delivery.save();

    order.isDeliveryAssigned = true;
    await order.save();

    res.status(201).json({ message: 'Delivery accepted successfully.', delivery });
  } catch (error) {
    console.error('Error accepting delivery:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMyActiveDelivery = async (req, res) => {
  try {
    const activeDelivery = await Delivery.findOne({
      deliveryAgent: req.user._id,
      status: { $in: ['pending', 'out_for_delivery'] }
    }).populate('order');

    if (!activeDelivery) {
      return res.status(404).json({ message: 'No active delivery assigned.' });
    }

    res.status(200).json(activeDelivery);
  } catch (error) {
    console.error('Error fetching active delivery:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const delivery = await Delivery.findById(req.params.id).populate('order');

    if (!delivery) return res.status(404).json({ error: 'Delivery not found.' });

    if (delivery.deliveryAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this delivery.' });
    }

    if (!['pending', 'out_for_delivery', 'delivered', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    delivery.status = status;
    await delivery.save();

    if (status === 'delivered') {
      delivery.order.status = 'delivered';
      await delivery.order.save();
    }

    res.status(200).json(delivery);
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const cancelDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) return res.status(404).json({ error: 'Delivery not found.' });

    if (delivery.deliveryAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this delivery.' });
    }

    if (delivery.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending deliveries can be cancelled.' });
    }

    const order = await Order.findById(delivery.order);
    if (order) {
      order.isDeliveryAssigned = false;
      await order.save();
    }

    await delivery.remove();

    res.status(200).json({ message: 'Delivery cancelled successfully. Order is now available again.' });
  } catch (error) {
    console.error('Error cancelling delivery:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
