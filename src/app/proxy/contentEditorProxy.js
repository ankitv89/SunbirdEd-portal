const proxyHeaders = require('./proxyUtils.js')
const proxy = require('express-http-proxy')
const bodyParser = require('body-parser')
const permissionsHelper = require('./../helpers/permissionsHelper.js')
const envHelper = require('./../helpers/environmentVariablesHelper.js')
const contentProxyUrl = envHelper.CONTENT_PROXY_URL
const reqDataLimitOfContentUpload = '30mb'
const telemetryHelper = require('../helpers/telemetryHelper')
const learnerServiceBaseUrl = envHelper.LEARNER_URL

module.exports = function (app) {
  const proxyReqPathResolverMethod = function (req) {
    return require('url').parse(contentProxyUrl + req.originalUrl).path
  }

  app.use('/api/*', permissionsHelper.checkPermission(), proxy(contentProxyUrl, {
    preserveHostHdr: true,
    proxyReqOptDecorator: proxyHeaders.decorateRequestHeaders(),
    proxyReqPathResolver: proxyReqPathResolverMethod
  }))

  app.use('/content-plugins/*', proxy(contentProxyUrl, {
    preserveHostHdr: true,
    proxyReqOptDecorator: proxyHeaders.decorateRequestHeaders(),
    proxyReqPathResolver: proxyReqPathResolverMethod
  }))

  app.use('/plugins/*', proxy(contentProxyUrl, {
    preserveHostHdr: true,
    proxyReqOptDecorator: proxyHeaders.decorateRequestHeaders(),
    proxyReqPathResolver: proxyReqPathResolverMethod
  }))

  app.use('/assets/public/*', proxy(contentProxyUrl, {
    preserveHostHdr: true,
    proxyReqOptDecorator: proxyHeaders.decorateRequestHeaders(),
    proxyReqPathResolver: proxyReqPathResolverMethod
  }))

  app.use('/content/preview/*', proxy(contentProxyUrl, {
    preserveHostHdr: true,
    proxyReqOptDecorator: proxyHeaders.decorateRequestHeaders(),
    proxyReqPathResolver: proxyReqPathResolverMethod
  }))

  // Log telemetry for action api's
  app.all('/action/*', telemetryHelper.generateTelemetryForProxy)

  app.use('/action/content/v3/unlisted/publish/:contentId', permissionsHelper.checkPermission(),
    bodyParser.json(), proxy(contentProxyUrl, {
      preserveHostHdr: true,
      limit: reqDataLimitOfContentUpload,
      proxyReqOptDecorator: proxyHeaders.decorateRequestHeaders(),
      proxyReqPathResolver: proxyReqPathResolverMethod,
      proxyReqBodyDecorator: function (bodyContent, srcReq) {
        if (bodyContent && bodyContent.request && bodyContent.request.content) {
          bodyContent.request.content.baseUrl = srcReq.protocol + '://' + srcReq.headers.host
        }
        return bodyContent
      }
    }))

  app.use('/action/data/v1/page/assemble', proxy(learnerServiceBaseUrl, {
    proxyReqOptDecorator: proxyHeaders.decorateRequestHeaders(),
    proxyReqPathResolver: function (req) {
      var originalUrl = req.originalUrl
      originalUrl = originalUrl.replace('action/', '/')
      return require('url').parse(learnerServiceBaseUrl + originalUrl).path
    }
  }))

  app.use('/action/*', permissionsHelper.checkPermission(), proxy(contentProxyUrl, {
    preserveHostHdr: true,
    limit: reqDataLimitOfContentUpload,
    proxyReqOptDecorator: proxyHeaders.decorateRequestHeaders(),
    proxyReqPathResolver: proxyReqPathResolverMethod
  }))
}
