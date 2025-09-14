const express = require('express');
const {problemController} = require('../../controllers');
const ProblemRouter = express.Router();

ProblemRouter.get("/ping", problemController.pingProblemController);
ProblemRouter.get("/:id", problemController.getProblem);
ProblemRouter.get("/", problemController.getProblems);
ProblemRouter.post("/",problemController.addProblem);
ProblemRouter.delete('/:id',problemController.deleteProblem);
ProblemRouter.patch('/:id',problemController.updateProblems);

module.exports = ProblemRouter;

