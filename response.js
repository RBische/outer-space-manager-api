var http = require('http')

http.ServerResponse.prototype.respond = function (content, internalCode, status) {
  if (typeof status === 'undefined') { // only one parameter found
    if (typeof content === 'number' || !isNaN(parseInt(content))) { // usage "respond(status)"
      status = parseInt(content)
      content = undefined
    } else { // usage "respond(content)"
      status = 200
    }
  }
  if (status !== 200) { // error
    content = {
      'code': status,
      'internalCode': internalCode,
      'status': http.STATUS_CODES[status],
      'message': content && content.toString() || null
    }
  }
  if (typeof content !== 'object') { // wrap content if necessary
    content = {'result': content}
  }
  // respond with JSON data
  this.status(status).send(JSON.stringify(content) + '\n')
}
