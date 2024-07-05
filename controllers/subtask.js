const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, UnauthenticatedError } = require('../errors');

const createSubtask = async (req, res) => {
    const {userId} = req.user
    const {title, cardId} = req.body

    try{
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })
    
        if (!user) {
            throw new BadRequestError("User not found, try logging in again")
        }
    
        if (!cardId || !title){
            throw new BadRequestError("Insufficient parameters")
        }
    
        const card = await prisma.card.findUnique({
            where: {id: cardId},
            select:{
                assignedUsers: true
            }
        })
    
        const isMember = card.assignedUsers.some((assignedUser) => assignedUser.userId === userId);
        
        if (!isMember){
            throw new UnauthenticatedError("User not permitted to edit this card")
        }
    
        await prisma.subtask.create({
            data:{
                title,
                cardId,
            }
        })
    
        res.status(StatusCodes.CREATED).json({message: "SUCCESS"})
    }
    catch (error){
        console.log(error)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: "INTERNAL SERVER ERROR"})
    }
}

const editSubtask = async (req, res) => {
    const id = parseInt(req.params.id)
    const {userId} = req.user
    const {isDone} = req.body

    try{
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })
    
        if (!user) {
            throw new BadRequestError("User not found, try logging in again")
        }
    
        if (!isDone){
            throw new BadRequestError("Parameter missing")
        }
    
        const subtask = await prisma.subtask.findUnique({
            where: {id: id}
        })

        if (!subtask){
            throw new BadRequestError("Subtask doesn't exist")
        }

        const card = await prisma.card.findUnique({
            where: {id: subtask.cardId},
            select:{
                assignedUsers: true
            }
        })
    
        const isMember = card.assignedUsers.some(assignedUsers => assignedUsers.userId === userId);
        
        if (!isMember){
            throw new UnauthenticatedError("User not permitted to edit this card")
        }
    
        await prisma.subtask.update({
            where: {id: id},
            data:{
                isDone: isDone
            }
        })
    
        res.status(StatusCodes.OK).json({message: "SUCCESS"})
    }
    catch (error){
        console.log(error)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: "INTERNAL SERVER ERROR"})
    }
}

const deleteSubtask = async (req, res) => {
    const id = parseInt(req.params.id)
    const {userId} = req.user

    try{
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })
    
        if (!user) {
            throw new BadRequestError("User not found, try logging in again")
        }

        const subTask = await prisma.subtask.findUnique({
            where: {id: id}
        })

        if (!subTask){
            throw new BadRequestError("Subtask doesn't exist")
        }

        const card = await prisma.card.findUnique({
            where: {id: subTask.cardId},
            select:{
                assignedUsers: true
            }
        })
    
        const isMember = card.assignedUsers.some(assignedUsers => assignedUsers.userId === userId);
        
        if (!isMember){
            throw new BadRequestError("User not permitted to edit this card")
        }

        await prisma.subtask.delete({
            where: {id: id}
        })

        res.status(StatusCodes.OK).json({message: "SUCCESS"})
    }
    catch (error){
        console.log(error)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: "INTERNAL SERVER ERROR"})
    }
}

module.exports = {
    createSubtask,
    editSubtask,
    deleteSubtask
}