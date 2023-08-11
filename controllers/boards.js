const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors');

const createBoard = async (req, res) => {
  const { userId } = req.user;
  const { title, description } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    const newBoard = await prisma.board.create({
      data: {
        title,
        description,
        user: {
          connect: { id: userId },
        },
      },
    });

    res.status(StatusCodes.CREATED).json({ board: newBoard });
  } catch (error) {
    console.error('Error creating board:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const getBoard = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    const boardMember = await prisma.boardMember.findFirst({
      where: {
        userId,
        boardId: parseInt(id),
      },
    });

    if (!boardMember) {
      throw new BadRequestError('User is not authorized to view this board');
    }

    const board = await prisma.board.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!board) {
      throw new BadRequestError('Board not found');
    }

    res.status(StatusCodes.OK).json({ board });
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const updateBoard = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const { title, description } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    const boardMember = await prisma.boardMember.findFirst({
      where: {
        userId,
        boardId: parseInt(id),
      },
    });

    if (!boardMember) {
      throw new BadRequestError('User is not authorized to view this board');
    }

    const updatedBoard = await prisma.board.update({
      where: {
        id: parseInt(id),
      },
      data: {
        title,
        description,
      },
    });

    if (!updatedBoard) {
      throw new BadRequestError('Board not found');
    }

    res.status(StatusCodes.OK).json({ board: updatedBoard });
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const deleteBoard = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    const boardMember = await prisma.boardMember.findFirst({
      where: {
        userId,
        boardId: parseInt(id),
      },
    });

    if (!boardMember) {
      throw new BadRequestError('User is not authorized to view this board');
    }

    const deletedBoard = await prisma.board.delete({
      where: {
        id: parseInt(id),
      },
    });

    if (!deletedBoard) {
      throw new BadRequestError('Board not found');
    }

    res.status(StatusCodes.OK).json({ board: deletedBoard });
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const getAllBoardsInWorkspace = async (req, res) => {
  const { userId } = req.user;
  const { workspaceId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    const boards = await prisma.board.findMany({
      where: {
        workspaceId: parseInt(workspaceId),
      },
    });

    res.status(StatusCodes.OK).json({ boards });
  } catch (error) {
    console.error('Error fetching boards in workspace:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  getAllBoardsInWorkspace,
};