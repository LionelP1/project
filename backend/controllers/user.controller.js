import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';

export const getUserProfile = async (req, res) => {
  try {
      const user = await User.findById(req.user._id).select("-password");
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.status(200).json({
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        gender: user.gender,
        role: user.role,
        phone: user.phone,
        address: user.address,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
      });

    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Server error" });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      const { fullName, username, email, gender, phone, address, profilePicture } = req.body;
  
      if (username && username !== user.username) {
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
          return res.status(400).json({ error: "Username already taken" });
        }
      }
  
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({ error: "Email already taken" });
        }
      }
  
      user.fullName = fullName || user.fullName;
      user.username = username || user.username;
      user.email = email || user.email;
      user.gender = gender || user.gender;
      user.phone = phone || user.phone;
      user.address = address || user.address;
      user.profilePicture = profilePicture || user.profilePicture;
  
      const updatedUser = await user.save();
  
      res.status(200).json({
        message: "Profile updated successfully",
        user: {
          _id: updatedUser._id,
          fullName: updatedUser.fullName,
          username: updatedUser.username,
          email: updatedUser.email,
          gender: updatedUser.gender,
          role: updatedUser.role,
          phone: updatedUser.phone,
          address: updatedUser.address,
          profilePicture: updatedUser.profilePicture,
          createdAt: updatedUser.createdAt,
        },
      });
      
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Server error" });
    }
};

export const changeUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { currentPassword, newPassword } = req.body;

    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Server error" });
  }
};





  