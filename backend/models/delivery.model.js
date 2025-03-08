const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    deliveryAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'out_for_delivery', 'delivered', 'failed'],
        default: 'pending'
    },
    deliveryDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Delivery = mongoose.model('Delivery', DeliverySchema);

export default Delivery;
