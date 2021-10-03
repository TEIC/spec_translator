const { createOAuthUserAuth } = require("@octokit/auth-oauth-user");
const github = require('./github.json');

class GithubAuth {

  async authenticate(code) {
    const auth = createOAuthUserAuth({
      clientId: github.clientId,
      clientSecret: github.clientSecret,
      code: code
    });
    
    const result = await auth();
    return result;
  }
}

module.exports = GithubAuth