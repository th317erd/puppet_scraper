const Nife = require('nife');
const {
  defineTask,
  HTTPUtils,
} = require('mythix');

const { WebhookTaskBase } = require('./webhook-task-base');

module.exports = defineTask('BatchQueueWebhooks', ({ application, Parent, time, Sequelize }) => {
  const Ops         = Sequelize.Op;
  const workerCount = application.getConfigValue('tasks.BatchQueueWebhooks.workers', 1, 'integer');

  return class BatchQueueWebhooks extends Parent {
    static workers    = workerCount;
    static frequency  = time.seconds(2 * workerCount);
    static startDelay = time.seconds(1);
    static keepAlive  = true;
    static enabled    = true;

    getOps() {
      return Ops;
    }

    getWebhookProcessingModel() {
      return this.getModel('Batch');
    }

    getNeedProcessingQuery() {
      const Ops = this.getOps();
      var now   = Date.now();

      return {
        lockedAt: {
          [Ops.is]: null,
        },
        webhookSuccess: {
          [Ops.eq]: false,
        },
        webhookRetryCount: {
          [Ops.lt]: 10,
        },
        webhookNextRetryAtMS: {
          [Ops.lte]: now,
        },
        markedReceivedAt: {
          [Ops.is]: null,
        },
        [Ops.or]: [
          { completedAt:  { [Ops.is]: null } },
          { failedAt:     { [Ops.not]: { [Ops.is]: null } } },
        ],
      };
    }

    async sendRequest(batch) {
      try {
        var user = await batch.getUser();
        if (!user)
          throw new Error('"user" not found for batch');

        var response = await HTTPUtils.post(user.webhookURL, {
          headers: {
            'Content-Type':     'application/json',
            'X-Puppet-Secret':  user.webhookSecret,
          },
          data: { batchID: batch.id, status: 'success' },
        });

        if (response.statusCode !== 200)
          throw new Error('Webhook status code is not 200');

        return {
          status:     'success',
          model:      batch,
        };
      } catch (error) {
        return {
          status:       'error',
          value:        error,
          model:        batch,
          extraAttrs: {
            // Still mark it as complete, as we have success, we just can't send to the webhook
            completedAt:  new Date(),
          },
        };
      }
    }

    async batchDoneProcessing(batch) {
      const { Request, Cache } = this.getModels();

      var requests = await Request.all({ batch: batch.id }, {
        attributes: [
          'status',
          'completedAt',
          'failedAt',
          'errorMessage',
          'requestInfo',
        ],
      });

      // If no requests yet, we are not finished,
      // so just return
      if (!requests.length) {
        return false;
      }

      // Are there any failures?
      // If so, fail the batch as well,
      // and return false
      var failure = requests.find((request) => request.failedAt);
      if (failure) {
        if (!batch.failedAt) {
          await batch.update({ failedAt: failure.failedAt, errorMessage: failure.errorMessage || 'unknown error' });
        }

        return false;
      }

      // Are all requests done processing?
      // If not, just return
      if (requests.findIndex((request) => (request.status !== 'success' || !request.completedAt)) >= 0) {
        return false;
      }

      // Check to see if all caches are built
      var requestInfoIDs  = Nife.pluck('requestInfo', requests);
      var cacheCount      = await Cache.count({
        where: {
          requestInfo: {
            [Ops.in]: requestInfoIDs,
          },
        },
        col: 'requestInfo',
        distinct: true,
      });

      return (cacheCount === requestInfoIDs.length);
    }

    async execute() {
      try {
        var batches = await this.getModelsToProcess();
        if (!batches || !batches.length)
          return;

        var promises = [];

        for (var i = 0, il = batches.length; i < il; i++) {
          var batch = batches[i];

          // Do we have cache?
          var isDoneProcessing = await this.batchDoneProcessing(batch);
          if (!isDoneProcessing)
            continue;

          var promise = this.sendRequest(batch);
          promises.push(promise);
        }

        // This will also clear any locks
        await this.handleResults(await Promise.allSettled(promises));
      } catch (error) {
        this.getLogger().error(`Error while executing "BatchQueueWebhooks" task`, error);
        await this.clearLocks(error.message, false);
      }
    }
  };
}, WebhookTaskBase);
