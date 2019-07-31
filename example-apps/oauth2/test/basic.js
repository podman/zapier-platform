require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('oauth2 app', () => {
  before(() => {
    // It's a good idea to store your Client ID and Secret in the environment rather than in code.
    // This works locally via the `export` shell command and in production by using `zapier env`
    if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
      throw new Error(
        'For the tests to run, you need to do `export CLIENT_ID=1234 CLIENT_SECRET=asdf`'
      );
    }
  });

  it('generates an authorize URL', () => {
    const bundle = {
      // In production, these will be generated by Zapier and set automatically
      inputData: {
        state: '4444',
        redirect_uri: 'http://zapier.com/'
      },
      environment: {
        // These will come from your local environment. When running in production, Zapier builds a bundle
        // that includes environment variables you have set with `zapier env` command.
        CLIENT_ID: process.env.CLIENT_ID,
        CLIENT_SECRET: process.env.CLIENT_SECRET
      }
    };

    return appTester(App.authentication.oauth2Config.authorizeUrl, bundle).then(
      authorizeUrl => {
        authorizeUrl.should.eql(
          'https://auth-json-server.zapier-staging.com/oauth/authorize?client_id=1234&state=4444&redirect_uri=http%3A%2F%2Fzapier.com%2F&response_type=code'
        );
      }
    );
  });

  it('can fetch an access token', () => {
    const bundle = {
      inputData: {
        // In production, Zapier passes along whatever code your API set in the query params when it redirects
        // the user's browser to the `redirect_uri`
        code: 'one_time_code'
      },
      environment: {
        CLIENT_ID: process.env.CLIENT_ID,
        CLIENT_SECRET: process.env.CLIENT_SECRET
      },
      cleanedRequest: {
        querystring: {
          accountDomain: 'test-account',
          code: 'one_time_code'
        }
      },
      rawRequest: {
        querystring: '?accountDomain=test-account&code=one_time_code'
      }
    };

    return appTester(
      App.authentication.oauth2Config.getAccessToken,
      bundle
    ).then(result => {
      result.access_token.should.eql('a_token');
      result.refresh_token.should.eql('a_refresh_token');
    });
  });

  it('can refresh the access token', () => {
    const bundle = {
      // In production, Zapier provides these. For testing, we have hard-coded them.
      // When writing tests for your own app, you should consider exporting them and doing process.env.MY_ACCESS_TOKEN
      authData: {
        access_token: 'a_token',
        refresh_token: 'a_refresh_token'
      },
      environment: {
        CLIENT_ID: process.env.CLIENT_ID,
        CLIENT_SECRET: process.env.CLIENT_SECRET
      }
    };

    return appTester(
      App.authentication.oauth2Config.refreshAccessToken,
      bundle
    ).then(result => {
      result.access_token.should.eql('a_new_token');
    });
  });

  it('includes the access token in future requests', () => {
    const bundle = {
      authData: {
        access_token: 'a_token',
        refresh_token: 'a_refresh_token'
      }
    };

    return appTester(App.authentication.test, bundle).then(result => {
      result.should.have.property('username');
      result.username.should.eql('Bret');
    });
  });
});
