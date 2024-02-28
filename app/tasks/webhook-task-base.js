const Nife                = require('nife');
const { TaskBase }        = require('mythix');
const { getNextRetryAt }  = require('./task-utils');

class WebhookTaskBase extends TaskBase {
  async stop() {
    await super.stop();
    await this.clearLocks(null, false, undefined, { webhookNextRetryAtMS: 0 });
  }

  async getNeedProcessingTaskCount() {
    const Model = this.getWebhookProcessingModel();

    return await Model.rowCount(this.getNeedProcessingQuery());
  }

  async getModelsToProcess() {
    const Model = this.getWebhookProcessingModel();

    var count = await this.getNeedProcessingTaskCount(Model);
    if (count === 0)
      return [];

    // Work on 25% of this workers load (per-pass)
    count = Math.floor((count / this.getNumberOfWorkers()) * 0.25);
    if (count < 5)
      count = 5;

    await this.getDBConnection().transaction(async (transaction) => {
      await Model.bulkUpdate({ lockedAt: new Date(), lockedBy: this.getRunID() }, {
        where: this.getNeedProcessingQuery(),
        transaction: transaction,
        lock: {
          level: transaction.LOCK.UPDATE,
          of:    Model,
        },
        limit: count,
      });
    });

    return await Model.all({
      'lockedBy':   this.getRunID(),
      '!lockedAt':  null,
    });
  }

  async clearLocks(error, success, ids, extraAttrs) {
    const Ops   = this.getOps();
    const Model = this.getWebhookProcessingModel();

    var dbConnection = this.getDBConnection();
    await dbConnection.transaction(async (transaction) => {
      var attrs = { lockedAt: null, lockedBy: null };
      var now   = new Date();

      if (error) {
        attrs.webhookFailedAt       = now;
        attrs.webhookErrorMessage   = error;
        attrs.webhookSuccess        = false;
        attrs.webhookSuccessAt      = null;
        attrs.webhookRetryCount     = dbConnection.literal('webhook_retry_count + 1');
        attrs.status                = 'webhook error';
      } else if (success) {
        attrs.webhookFailedAt       = null;
        attrs.webhookErrorMessage   = null;
        attrs.webhookSuccessAt      = now;
        attrs.webhookSuccess        = true;
        attrs.webhookNextRetryAtMS  = 0;
        attrs.status                = 'success';
      }

      if (Nife.isNotEmpty(extraAttrs))
        Object.assign(attrs, extraAttrs);

      await Model.update(attrs, {
        where: Model.where({
          id:           ids,
          lockedBy:     this.getRunID(),
          lockedAt: {
            [Ops.not]:  null,
          },
        }),
        transaction: transaction,
        lock: {
          level: transaction.LOCK.UPDATE,
          of:    Model,
        },
      });
    });
  }

  getNextRetryAt(retryCount) {
    return getNextRetryAt(retryCount);
  }

  async handleResults(results) {
    const getPromiseResults = (results) => {
      return results.map((result) => result.value);
    };

    const getSuccessResults = (results) => {
      return getPromiseResults(results).filter((result) => (result.status === 'success'));
    };

    const getFailedResults = (results) => {
      return getPromiseResults(results).filter((result) => (result.status === 'error'));
    };

    var successResults = getSuccessResults(results);
    var failedResults = getFailedResults(results);

    if (successResults.length === 0 && failedResults.length === 0) {
      await this.clearLocks(null, false);
      return;
    }

    // Update cache table, and clear locks for successful responses
    if (Nife.isNotEmpty(successResults)) {
      var modelIDs = successResults.map((result) => result.model.id);
      await this.clearLocks(null, true, modelIDs);
    }

    // If there are failed results, then clear the locks for each row
    // and set the error message and failed at time for each failure
    var failedResults = getFailedResults(results);
    if (Nife.isNotEmpty(failedResults)) {
      for (var i = 0, il = failedResults.length; i < il; i++) {
        var result      = failedResults[i];
        var error       = result.value;
        var retryCount  = result.model.webhookRetryCount || 0;

        if (error instanceof Error)
          error = error.message;

        await this.clearLocks(
          ('' + error),
          false,
          [ result.model.id ],
          Object.assign({ webhookNextRetryAtMS: this.getNextRetryAt(retryCount) }, result.extraAttrs || {}),
        );
      }
    }
  }
}

module.exports = {
  WebhookTaskBase,
};
