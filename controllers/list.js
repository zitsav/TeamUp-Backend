const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors');

const createList = async (req, res) => {
  const { userId } = req.user;
  const { title, card_id} = req.body;
  
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    if (!card_id) {
      throw new BadRequestError('Card id is required');
    }

    const card = await prisma.card.findUnique({
      where: {
        id: parseInt(card_id),
      },
    });

    if (!card) {
      throw new BadRequestError('Card not found');
    }

    const newList = await prisma.list.create({
      data: {
        title,
        Card: {
          connect: { id: parseInt(card_id) },
        },
      },
    });

    res.status(StatusCodes.CREATED).json({ list: newList });
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const getList = async (req, res) => {
  const { id } = req.params;
  
  try {
    const list = await prisma.list.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!list) {
      throw new BadRequestError('List not found');
    }

    res.status(StatusCodes.OK).json({ list });
  } catch (error) {
    console.error('Error fetching list:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const updateList = async (req, res) => {
  const { id } = req.params;
  const { title, position } = req.body;
  
  try {
    const updatedList = await prisma.list.update({
      where: {
        id: parseInt(id),
      },
      data: {
        title,
        position,
      },
    });

    if (!updatedList) {
      throw new BadRequestError('List not found');
    }

    res.status(StatusCodes.OK).json({ list: updatedList });
  } catch (error) {
    console.error('Error updating list:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const deleteList = async (req, res) => {
  const { id } = req.params;
  
  try {
    const deletedList = await prisma.list.delete({
      where: {
        id: parseInt(id),
      },
    });

    if (!deletedList) {
      throw new BadRequestError('List not found');
    }

    res.status(StatusCodes.OK).json({ list: deletedList });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const getAllListsInCard = async (req, res) => {
  const { id } = req.params;
  
  try {
    const card = await prisma.card.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        lists: true,
      },
    });

    if (!card) {
      throw new BadRequestError('Card not found');
    }

    res.status(StatusCodes.OK).json({ lists: card.lists });
  } catch (error) {
    console.error('Error fetching lists in card:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createList,
  getList,
  updateList,
  deleteList,
  getAllListsInCard,
};