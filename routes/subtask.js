const express = require('express');
const router = express.Router();
const { createSubtask,
    editSubtask,
    deleteSubtask
} = require('../controllers/subtask');
const authMiddleware = require('../middlewares/authentication')

router.use(authMiddleware)

router.post('/', createSubtask)

router.put('/:id', editSubtask)

router.delete('/:id', deleteSubtask)

module.exports = router