import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import generateTokenAndSetCookie from '../utils/generateToken.js';

export const signup = async (req, res) => {
    try {
      const { fullName, username, email, password, confirmPassword, gender, role, phone, address, profilePicture } = req.body;
  
      if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
      }
  
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  
      if (existingUser) {
        return res.status(400).json({ error: "Username or Email already exists" });
      }
  
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      const newUser = new User({
        fullName,
        username,
        email,
        password: hashedPassword,
        gender,
        role,
        phone,
        address,
        profilePicture: profilePicture || "",
      });
  
      await newUser.save();
  
      // Generate token
      generateTokenAndSetCookie(newUser._id, res);
  
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        profilePicture: newUser.profilePicture
      });
    } catch (error) {
      console.log("Error in signup controller", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
};

export const login = async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
  
      if (!user) {
        return res.status(400).json({ error: "Invalid username or password" });
      }
  
      // Compare password
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ error: "Invalid username or password" });
      }
  
      generateTokenAndSetCookie(user._id, res);
  
      res.status(200).json({
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.log("Error in login controller", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
};
  
export const logout = async (req, res) => {
    try {
      res.cookie("jwt", "", { maxAge: 0 });
      return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.log("Error in logout controller", error.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };


  