const express = require('express');
const router = express.Router();
const {
    updateUser,
    searchUsers
} = require('../controllers/user');
const authMiddleware = require('../middlewares/authentication');

router.use(authMiddleware)

router.put('/:id', updateUser)

router.post('/search', searchUsers)

module.exports = router
