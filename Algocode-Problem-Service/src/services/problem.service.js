const sanitizeMarkdownContent = require("../utils/markdownSanitizer");

class ProblemService{

    constructor(problemRepository){
        this.problemRepository= problemRepository;
    }

    async createProblem(problemData){
        problemData.description = sanitizeMarkdownContent(problemData.description);
        const problem = await this.problemRepository.createProblem(problemData);
        return problem;
    }

    async getAllProblems(){
        const problems = await this.problemRepository.getAllProblems();
        return problems;
    }

    async getProblem(problemId){
        const problem = await this.problemRepository.getProblem(problemId);
        return problem;
    }

    async deleteProblem(problemId){
        const deletedProblem = await this.problemRepository.deleteProblem(problemId);
        return deletedProblem;
    }

    async updateProblem(problemId, updatedData){
        const problem = await this.problemRepository.updateProblem(problemId, updatedData);
        return problem;
    }

}

module.exports = ProblemService;