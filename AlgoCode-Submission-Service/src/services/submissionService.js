const { fetchProblemDetails } = require('../apis/problemAdminApi');
const submissionProducer = require('../producers/submissionQueueProducer');
class SubmissionService{
    constructor(submissionRepository){
        this.submissionRepository = submissionRepository;
    }
    async pingCheck(){
        return "Pong";
    }

    async addSubmission(submissionPayload){
        const problemId = submissionPayload.problemId;
        const userId = submissionPayload.userId;
        const problemAdminServiceAPiResponse = await fetchProblemDetails(problemId);

        if(!problemAdminServiceAPiResponse){
            throw {message: "Not able to create submission"};
        }

        const languageCodeStub = problemAdminServiceAPiResponse.data.codeStubs.find(
            codeStub => codeStub.language.toLowerCase() === submissionPayload.language.toLowerCase()
        );

        submissionPayload.code = languageCodeStub.startSnippet + "\n\n" +
        submissionPayload.code + "\n\n" + languageCodeStub.endSnippet;
    
        const submission = await this.submissionRepository.createSubmission(submissionPayload);
        if(!submission){
            throw {message: "Not able to create submission"};
        }
        console.log(submission);

        const response = await submissionProducer({
            [submission._id]:{
                code: submission.code,
                language: submission.language,
                inputCase: problemAdminServiceAPiResponse.data.testCases[0].input,
                outputCase: problemAdminServiceAPiResponse.data.testCases[0].output,
                userId,
                submissionId: submission._id
            }
        });
        return {
            queueResponse:response,
            submission
        };
    }
}

module.exports = SubmissionService;