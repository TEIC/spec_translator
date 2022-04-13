var express = require('express');
var router = express.Router();
var GithubAuth = require('../src/auth');

const github = require('../src/github.json');

router.get('/login', function(req, res, next) {
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${github.clientId}&scope=public_repo`)
});

router.get('/redirect', function(req, res, next) {
  let auth = new GithubAuth();
  authResult = auth.authenticate(req.query.code);
  authResult.then(value => {
    res.render('user', {token: value.token});
  });
});

module.exports = router;