const express = require('express');
const router = express.Router();
const {
    createCard,
    deleteCard,
    changeCardPosition,
    moveCardToDifferentBoard,
    addCardMember
} = require('../controllers/card');
const authMiddleware = require('../middlewares/authentication');

router.use(authMiddleware)

router.post('/', createCard)

router.post('/user', addCardMember)

// router.put('/:id', cardController.updateCard)

router.delete('/:id', deleteCard)

router.put('/position/:id', changeCardPosition)

router.put('/move/:id', moveCardToDifferentBoard)

module.exports = router