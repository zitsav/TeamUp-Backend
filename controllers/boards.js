const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors');

const createBoard = async (req, res) => {
  const { userId } = req.user;
  const { title, description, workspaceId } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    if (!workspaceId) {
      throw new BadRequestError('WorkspaceId is required');
    }

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: parseInt(workspaceId),
      },
      include: {
        members: true,
      },
    });

    if (!workspace) {
      throw new BadRequestError('Workspace not found');
    }

    if (workspace.adminId !== userId) {
      throw new BadRequestError('User is not authorized to create a board in this workspace');
    }

    const newBoard = await prisma.board.create({
      data: {
        title,
        description,
        workspaceId: parseInt(workspaceId),
        position: workspace.lastPosition + 1,
      },
    });

    await prisma.workspace.update({
      where: {
        id: parseInt(workspaceId),
      },
      data: {
        lastPosition: workspace.lastPosition + 1,
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

    const board = await prisma.board.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        Workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!board) {
      throw new BadRequestError('Board not found');
    }

    const isMember = board.Workspace.members.some(member => member.userId === userId);

    if (!isMember) {
      throw new BadRequestError('User is not authorized to view this board');
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

    const board = await prisma.board.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        Workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!board) {
      throw new BadRequestError('Board not found');
    }

    if (board.Workspace.adminId !== userId) {
      throw new BadRequestError('User is not authorized to update this board');
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

    const board = await prisma.board.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        Workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!board) {
      throw new BadRequestError('Board not found');
    }

    if (board.Workspace.adminId !== userId) {
      throw new BadRequestError('User is not authorized to delete this board');
    }

    await prisma.board.delete({
      where: {
        id: parseInt(id),
      },
    });

    res.status(StatusCodes.OK).json({ message: 'Board deleted successfully' });
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

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: parseInt(workspaceId),
      },
      include: {
        members: true,
      },
    });

    if (!workspace) {
      throw new BadRequestError('Workspace not found');
    }

    const isMember = workspace.members.some(member => member.userId === userId);

    if (!isMember) {
      throw new BadRequestError('User is not a member of this workspace');
    }

    const boards = await prisma.board.findMany({
      where: {
        workspaceId: parseInt(workspaceId),
      },
      orderBy: {
        position: 'asc',
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