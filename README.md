# AlgoCode — Online Judge Platform

A online Code judge prototype composed of separate Node/TypeScript microservices:
- Problem admin service: manage problems and code stubs.
- Submission service: accept user submissions, persist them and push jobs to queues.
- Evaluator service: picks jobs from Redis/BullMQ, runs code inside Docker containers and produces results.
- Socket service: delivers asynchronous results to connected clients.
- Sample frontend: minimal socket-based demo.

Contents
- [Services and key files](#services-and-key-files)
- [Architecture & submission flow](#architecture--submission-flow)
- [Run locally — prerequisites & env](#run-locally---prerequisites--env)
- [How to run each service](#how-to-run-each-service)
- [Important implementation notes](#important-implementation-notes)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Services and key files

- Problem Admin Service (CRUD for problems)
  - Entry: [Algocode-Problem-Service/src/index.js](Algocode-Problem-Service/src/index.js)
  - Controller: [`problemController`](Algocode-Problem-Service/src/controllers/problem.controller.js) — uses [`ProblemService`](Algocode-Problem-Service/src/services/problem.service.js)
  - Repository: [`ProblemRepository`](Algocode-Problem-Service/src/repositories/problem.repository.js)
  - Model: [Algocode-Problem-Service/src/models/problem.model.js](Algocode-Problem-Service/src/models/problem.model.js)
  - Markdown sanitizer: [Algocode-Problem-Service/src/utils/markdownSanitizer.js](Algocode-Problem-Service/src/utils/markdownSanitizer.js)

- Submission Service (fastify)
  - Entry: [AlgoCode-Submission-Service/src/index.js](AlgoCode-Submission-Service/src/index.js)
  - Controller: [AlgoCode-Submission-Service/src/controllers/submissionController.js](AlgoCode-Submission-Service/src/controllers/submissionController.js)
  - Service: [`SubmissionService`](AlgoCode-Submission-Service/src/services/submissionService.js)
  - Repository plugin: [AlgoCode-Submission-Service/src/repositories/repositoryPlugin.js](AlgoCode-Submission-Service/src/repositories/repositoryPlugin.js)
  - Queue producer: [AlgoCode-Submission-Service/src/producers/submissionQueueProducer.js](AlgoCode-Submission-Service/src/producers/submissionQueueProducer.js)
  - Worker integration (consumes evaluation results): [AlgoCode-Submission-Service/src/workers/evaluationWorker.js](AlgoCode-Submission-Service/src/workers/evaluationWorker.js)

- Evaluator Service (TypeScript)
  - Entry: [AlgoCode-Evaluator-Service/src/index.ts](AlgoCode-Evaluator-Service/src/index.ts)
  - Worker: [`SubmissionWorker`](AlgoCode-Evaluator-Service/src/workers/submissionWorker.ts)
  - Job: [`SubmissionJob`](AlgoCode-Evaluator-Service/src/jobs/SubmissionJob.ts)
  - Executor factory: [`createExecutor`](AlgoCode-Evaluator-Service/src/utils/ExecutorFactory.ts)
  - Container helpers: [AlgoCode-Evaluator-Service/src/containers/containerFactory.ts](AlgoCode-Evaluator-Service/src/containers/containerFactory.ts), [AlgoCode-Evaluator-Service/src/containers/pullImage.ts](AlgoCode-Evaluator-Service/src/containers/pullImage.ts)
  - Language executors: [pythonExecutor.ts](AlgoCode-Evaluator-Service/src/containers/pythonExecutor.ts), [javaExecutor.ts](AlgoCode-Evaluator-Service/src/containers/javaExecutor.ts), [cppExecutor.ts](AlgoCode-Evaluator-Service/src/containers/cppExecutor.ts)
  - Docker stream decode: [AlgoCode-Evaluator-Service/src/containers/dockerHelper.ts](AlgoCode-Evaluator-Service/src/containers/dockerHelper.ts)
  - Bull queues: [AlgoCode-Evaluator-Service/src/queues/submissionQueue.ts](AlgoCode-Evaluator-Service/src/queues/submissionQueue.ts) and related queues/producers

- Socket Service
  - Entry: [AlgoCode-Socket-Service/src/server.js](AlgoCode-Socket-Service/src/server.js)
  - Accepts payloads via POST `/sendPayload` and forwards to connected socket by userId stored in Redis.

- Sample frontend
  - [Sample-Socket-Frontend/index.html](Sample-Socket-Frontend/index.html) — demonstration of socket workflow.

---

## Architecture & submission flow

High level flow:
1. Client posts a submission to Submission Service API. See route: [AlgoCode-Submission-Service/src/routes/api/v1/submissionRoutes.js](AlgoCode-Submission-Service/src/routes/api/v1/submissionRoutes.js).
2. Submission service (`SubmissionService`) augments the user code with problem code stubs fetched from Problem Admin API. See [`SubmissionService`](AlgoCode-Submission-Service/src/services/submissionService.js) and [AlgoCode-Submission-Service/src/apis/problemAdminApi.js](AlgoCode-Submission-Service/src/apis/problemAdminApi.js).
3. Submission is persisted and a job is produced to the Evaluator's queue via BullMQ ([AlgoCode-Submission-Service/src/producers/submissionQueueProducer.js](AlgoCode-Submission-Service/src/producers/submissionQueueProducer.js)).
4. Evaluator service worker (`SubmissionWorker`) picks the job and runs [`SubmissionJob`](AlgoCode-Evaluator-Service/src/jobs/SubmissionJob.ts).
5. `SubmissionJob` uses [`createExecutor`](AlgoCode-Evaluator-Service/src/utils/ExecutorFactory.ts) to pick a language executor which:
   - pulls Docker images ([pullImage](AlgoCode-Evaluator-Service/src/containers/pullImage.ts))
   - creates containers ([containerFactory](AlgoCode-Evaluator-Service/src/containers/containerFactory.ts))
   - runs compiled/interpreted code and decodes Docker logs ([dockerHelper](AlgoCode-Evaluator-Service/src/containers/dockerHelper.ts))
6. Evaluation results are pushed to an evaluation queue; Submission Service's evaluation worker forwards results to Socket Service via HTTP POST ([AlgoCode-Submission-Service/src/workers/evaluationWorker.js](AlgoCode-Submission-Service/src/workers/evaluationWorker.js)).
7. Socket Service looks up the target connectionId in Redis and emits the result to the connected client. See [AlgoCode-Socket-Service/src/server.js](AlgoCode-Socket-Service/src/server.js) and [Sample-Socket-Frontend/index.html](Sample-Socket-Frontend/index.html).

---

## Run locally — prerequisites & environment

Prerequisites:
- Node.js (>=16)
- npm
- Docker (for evaluator)
- Redis (used by BullMQ and Socket service)
- MongoDB

Common environment variables (per-service):
- Problem Service: see [Algocode-Problem-Service/src/config/server.config.js](Algocode-Problem-Service/src/config/server.config.js)
- Submission Service: see [AlgoCode-Submission-Service/src/config/serverConfig.js](AlgoCode-Submission-Service/src/config/serverConfig.js)
- Evaluator Service: see [AlgoCode-Evaluator-Service/src/config/serverConfig.ts](AlgoCode-Evaluator-Service/src/config/serverConfig.ts)

Example .env entries (create per-service .env files):
````sh
# Example for services that need MongoDB / Redis / URLs
PORT=3000
ATLAS_DB_URL=mongodb://localhost:27017/algocode
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
PROBLEM_ADMIN_SERVICE_URL=http://localhost:3000
LOG_DB_URL=mongodb://localhost:27017/logs