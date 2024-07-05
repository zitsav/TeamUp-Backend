const express = require('express');
const router = express.Router();
const {
    updateBoard
} = require('../controllers/boards');
const authMiddleware = require('../middlewares/authentication');

router.use(authMiddleware)

router.put('/:id', updateBoard)

module.exports = router;