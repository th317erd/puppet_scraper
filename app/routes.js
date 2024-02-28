module.exports = function getRoutes() {
  var limitOffsetParams = {
    'limit': {
      'defaultValue': 20,
      'type':         'integer',
      'validate':     /^[0-9]+$/,
    },
    'offset': {
      'defaultValue': 0,
      'type':         'integer',
      'validate':     /^[0-9]+$/,
    }
  };

  return {
    'api': {
      'v1': {
        'scrape': [
          {
            '/<batchID:string>': {
              'add': {
                'methods':    [ 'POST' ],
                'accept':     [ 'application/json' ],
                'controller': 'ScrapeControllerV1.addToBatch',
              },
              'finalize': {
                'methods':    [ 'POST' ],
                'accept':     [ 'application/json' ],
                'controller': 'ScrapeControllerV1.finalizeBatch',
              },
              'methods':      [ 'GET' ],
              'accept':       [ 'application/json' ],
              'controller':   'ScrapeControllerV1.getBatchContent',
              'queryParams':  limitOffsetParams,
            },
            'mark': {
              'methods':    [ 'POST' ],
              'accept':     [ 'application/json' ],
              'controller': 'ScrapeControllerV1.markReceivedBatches',
            },
            'unreceived': {
              'methods':      [ 'GET' ],
              'accept':       [ 'application/json' ],
              'controller':   'ScrapeControllerV1.unreceivedBatches',
              'queryParams':  limitOffsetParams,
            },
            'pending': {
              'methods':      [ 'GET' ],
              'accept':       [ 'application/json' ],
              'controller':   'ScrapeControllerV1.pendingBatches',
              'queryParams':  limitOffsetParams,
            },
            'methods':    [ 'POST' ],
            'accept':     [ 'application/json' ],
            'controller': 'ScrapeControllerV1.createBatch',
          },
        ],
        'request/<requestID:string>': {
          'status': {
            'methods':    [ 'GET' ],
            'accept':     [ 'application/json' ],
            'controller': 'RequestControllerV1.requestStatus',
          },
          'batch': {
            'methods':    [ 'GET' ],
            'accept':     [ 'application/json' ],
            'controller': 'RequestControllerV1.requestBatch',
          },
          'content': {
            'methods':    [ 'GET' ],
            'accept':     [ 'application/json' ],
            'controller': 'RequestControllerV1.getRequestContent',
          },
        },
      },
    },
  };
};
