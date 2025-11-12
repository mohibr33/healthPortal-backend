// controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const sendEmail = require("../utils/sendemail");
const crypto = require("crypto");

const pendingSignups = new Map();

// Function to generate random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ------------------------- SIGNUP (STEP 1: Send OTP) -------------------------
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // ✅ Check if user already exists in DB
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // ✅ Hash password but do not save user yet
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    // ✅ Store user details temporarily in memory
    pendingSignups.set(email, {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || "user",
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000, // OTP valid for 5 minutes
    });

    // ✅ Send OTP to user's email
    await sendEmail(email, "Verify your email", `Your OTP is ${otp}`);

    res.status(200).json({
      message: "OTP sent to your email. Please verify to complete signup.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------------- VERIFY OTP (STEP 2: Save User to DB) -------------------------
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // ✅ Find pending signup
    const userData = pendingSignups.get(email);
    if (!userData)
      return res
        .status(400)
        .json({ message: "No pending signup found or OTP expired." });

    // ✅ Check OTP validity
    if (userData.otp !== otp || userData.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // ✅ Save verified user to MongoDB
    const newUser = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      isVerified: true,
    });

    await newUser.save();

    // ✅ Delete pending signup data from memory
    pendingSignups.delete(email);

    res.status(200).json({ message: "Email verified successfully. Signup completed!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------------- LOGIN (STEP 1) -------------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(400).json({ message: "Verify email first" });
    }

    // Generate OTP for login
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();

    await sendEmail(email, "Login OTP", `Your OTP is ${otp}`);

    res.json({ message: "OTP sent to email, please verify to login" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------------- VERIFY LOGIN OTP (STEP 2) -------------------------
exports.verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // ✅ Clear OTP fields
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // ✅ Include both id and role in JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ✅ Return token + role
    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------------- FORGOT PASSWORD -------------------------
// ------------------------- FORGOT PASSWORD (SEND OTP) -------------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // ✅ Generate OTP instead of reset token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000; // valid 5 min

    await user.save();

    // ✅ Email OTP code only (no reset link)
    await sendEmail(
      email,
      "Password Reset OTP",
      `Your password reset code is: ${otp}`
    );

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ------------------------- RESET PASSWORD AFTER OTP -------------------------
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (Date.now() > user.otpExpiry)
      return res.status(400).json({ message: "OTP expired" });

    // ✅ Hash new password properly before saving
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // ✅ Clear OTP fields
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


