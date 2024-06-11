const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, UnauthenticatedError } = require('../errors');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const asyncHandler = require('express-async-handler');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const updateUser = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { name, profile } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!user) {
      throw new BadRequestError('User not found');
    }

    if (user.id !== parseInt(userId)) {
      throw new UnauthenticatedError('Not authorized to update this user');
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name,
        profile,
      },
    });

    res.status(StatusCodes.OK).json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.image) {
    throw new BadRequestError('Image file not found');
  }

  const imageFile = req.files.image;

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        profilePicture: true,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found');
    }

    if (user.profilePicture && user.profilePicture.publicID) {
      await cloudinary.uploader.destroy(user.profilePicture.publicID);
    }

    const result = await cloudinary.uploader.upload(imageFile.tempFilePath, {
      use_filename: true,
      folder: 'profile-pictures',
    });

    const image = {
      publicID: result.public_id,
      url: result.secure_url,
      userId: user.id,
    };

    fs.unlinkSync(imageFile.tempFilePath);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        profilePicture: {
          upsert: {
            create: image,
            update: image,
          },
        },
      },
      include: {
        profilePicture: true,
      },
    });

    res.status(StatusCodes.OK).json({ profilePicture: updatedUser.profilePicture });
  } catch (error) {
    console.log(error);
    if (fs.existsSync(imageFile.tempFilePath)) {
      fs.unlinkSync(imageFile.tempFilePath);
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
});

module.exports = {
  updateUser,
  uploadProfilePicture,
};