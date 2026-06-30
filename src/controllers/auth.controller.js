import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail, sendPasswordResetOtpEmail } from '../utils/email.js';

const generateAccessAndRefreshTokens = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );

  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken },
  });

  return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existedUser = await prisma.user.findUnique({ where: { email } });
  if (existedUser) {
    throw new ApiError(409, 'User with email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  // Send Welcome Email
  sendWelcomeEmail(user.email, user.name);

  return res.status(201).json(new ApiResponse(201, user, 'User registered successfully'));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(404, 'User does not exist');
  }

  if (!user.password) {
    throw new ApiError(401, 'Please login using your Google or Facebook account');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid user credentials');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

  const loggedInUser = { id: user.id, name: user.name, email: user.email, role: user.role };

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, 'User logged in successfully'));
});

const logoutUser = asyncHandler(async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request');
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await prisma.user.findUnique({ where: { id: decodedToken.id } });

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, 'Refresh token is expired or used');
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user.id);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    };

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', newRefreshToken, options)
      .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, 'Access token refreshed'));
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh token');
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, 'Current user fetched successfully'));
});

// ... existing exports
const oauthCallback = asyncHandler(async (req, res) => {
  const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
  if (!req.user) {
    return res.redirect(`${frontendUrl}/auth?error=oauth_failed`);
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(req.user.id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  // We redirect to frontend and pass the user id / token in query param for one-time sync
  // Then the frontend will store it in localStorage.
  const userJson = encodeURIComponent(JSON.stringify({
    id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role
  }));

  res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .redirect(`${frontendUrl}/?token=${accessToken}&user=${userJson}`);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, 'User not found');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await prisma.user.update({ where: { email }, data: { resetPasswordOtp: otp, resetPasswordOtpExpires: new Date(Date.now() + 10 * 60000) } });
  await sendPasswordResetOtpEmail(email, otp);
  return res.status(200).json(new ApiResponse(200, {}, 'OTP sent successfully'));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.resetPasswordOtp !== otp || user.resetPasswordOtpExpires < new Date()) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { email }, data: { password: hashedPassword, resetPasswordOtp: null, resetPasswordOtpExpires: null } });
  return res.status(200).json(new ApiResponse(200, {}, 'Password reset successfully'));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  oauthCallback,
  forgotPassword,
  resetPassword,
};
