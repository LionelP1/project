import express from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  changeUserPassword 
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', protect, getUserProfile);

router.put('/profile', protect, updateUserProfile);

router.put('/change-password', protect, changeUserPassword);

export default router;

