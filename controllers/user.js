const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, UnauthenticatedError } = require('../errors');

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

    if (user.id !== userId) {
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

module.exports = {
  updateUser,
};