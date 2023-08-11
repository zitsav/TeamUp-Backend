const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors');

const createCard = async (req, res) => {
  const { userId } = req.user;
  const { title, description, list_id, position } = req.body;
  
  try {
    const newCard = await prisma.card.create({
      data: {
        title,
        description,
        position,
        list: {
          connect: { id: list_id },
        },
      },
    });

    res.status(StatusCodes.CREATED).json({ card: newCard });
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const getCard = async (req, res) => {
  const { id } = req.params;
  
  try {
    const card = await prisma.card.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!card) {
      throw new BadRequestError('Card not found');
    }

    res.status(StatusCodes.OK).json({ card });
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const updateCard = async (req, res) => {
  const { id } = req.params;
  const { title, description, position } = req.body;
  
  try {
    const updatedCard = await prisma.card.update({
      where: {
        id: parseInt(id),
      },
      data: {
        title,
        description,
        position,
      },
    });

    if (!updatedCard) {
      throw new BadRequestError('Card not found');
    }

    res.status(StatusCodes.OK).json({ card: updatedCard });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const deleteCard = async (req, res) => {
  const { id } = req.params;
  
  try {
    const deletedCard = await prisma.card.delete({
      where: {
        id: parseInt(id),
      },
    });

    if (!deletedCard) {
      throw new BadRequestError('Card not found');
    }

    res.status(StatusCodes.OK).json({ card: deletedCard });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const getAllCardsInBoard = async (req, res) => {
  const { id } = req.params;

  try {
    const board = await prisma.board.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        cards: true,
      },
    });

    if (!board) {
      throw new BadRequestError('Board not found');
    }

    res.status(StatusCodes.OK).json({ cards: board.cards });
  } catch (error) {
    console.error('Error fetching cards in board:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createCard,
  getCard,
  updateCard,
  deleteCard,
  getAllCardsInBoard,
};