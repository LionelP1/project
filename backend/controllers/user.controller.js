import User from '../models/user.model.js';

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
  



  