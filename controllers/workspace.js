const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors');

const createWorkspace = async (req, res) => {
  const { userId } = req.user;
  const { title } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    const newWorkspace = await prisma.workspace.create({
      data: {
        title,
        admin: {
          connect: { id: userId },
        },
        members: {
          create: {
            userId,
          },
        },
        boards: {
          create: [
            { title: 'ToDo', position: 1 },
            { title: 'Ongoing', position: 2 },
            { title: 'Finished', position: 3 }
          ],
        },
      },
      include: {
        admin: true,
        members: true,
        boards: true,
      },
    });

    res.status(StatusCodes.CREATED).json({ workspace: newWorkspace, user });
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const getAllWorkspaces = async (req, res) => {
  const { userId } = req.user;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
        title: true,
        members: true,
      },
    });

    res.status(StatusCodes.OK).json({ workspaces, user });
  } catch (error) {
    console.error('Error getting workspaces:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const getWorkspaceById = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId: parseInt(id),
      },
    });

    if (!workspaceMember) {
      throw new BadRequestError('User is not authorized to view this workspace');
    }

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        members: true,
        boards: {
          include: {
            cards: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new BadRequestError('Workspace not found');
    }

    res.status(StatusCodes.OK).json({ workspace, user });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const editWorkspace = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { title } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!workspace) {
      throw new BadRequestError('Workspace not found');
    }

    if (workspace.adminId !== userId) {
      throw new BadRequestError('User is not authorized to edit this workspace');
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: {
        id: parseInt(id),
      },
      data: {
        title,
      },
    });

    res.status(StatusCodes.OK).json({ workspace: updatedWorkspace, user });
  } catch (error) {
    console.error('Error editing workspace:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const removeWorkspace = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!workspace) {
      throw new BadRequestError('Workspace not found');
    }

    if (workspace.adminId !== userId) {
      throw new BadRequestError('User is not authorized to delete this workspace');
    }

    await prisma.workspace.delete({
      where: {
        id: parseInt(id),
      },
    });

    res.status(StatusCodes.OK).json({ message: 'Workspace deleted successfully', user });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createWorkspace,
  getAllWorkspaces,
  getWorkspaceById,
  editWorkspace,
  removeWorkspace,
};