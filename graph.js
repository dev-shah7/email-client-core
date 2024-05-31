const graph = require('@microsoft/microsoft-graph-client');
const { Client } = require('@elastic/elasticsearch');
const msal = require('@azure/msal-node');
require('isomorphic-fetch');

const elasticsearchClient = new Client({ node: 'http://localhost:9200' });

module.exports = {
  getUserDetails: async function (msalClient, userId) {
    const client = getAuthenticatedClient(msalClient, userId);

    const user = await client
      .api('/me')
      .select('displayName,mail,mailboxSettings,userPrincipalName')
      .get();
    return user;
  },

  getEmails: async function (msalClient, userId) {
    const client = getAuthenticatedClient(msalClient, userId);
    const messages = await client
      .api('/me/mailFolders/inbox/messages')
      .select('subject, from, body')
      .get();
    return messages;
  },

  syncEmails: async function (msalClient, userId) {
    try {
      const client = getAuthenticatedClient(msalClient, userId);

      const messages = await this.getEmails(msalClient, userId);

      for (const message of messages.value) {
        const { id, subject, from, isRead, flags } = message;

        const { body: exists } = await elasticsearchClient.exists({
          index: 'emails',
          id: id,
        });

        if (!exists) {
          await elasticsearchClient.index({
            index: 'emails',
            id: id,
            body: {
              id: id,
              subject: subject,
              from: from,
              isRead: isRead,
              flags: flags,
            },
          });
        } else {
          await elasticsearchClient.update({
            index: 'emails',
            id: id,
            body: {
              doc: {
                id: id,
                subject: subject,
                from: from,
                isRead: isRead,
                flags: flags,
              },
            },
          });
        }
      }

      return await this.getEmails(msalClient, userId);
    } catch (error) {
      console.error('Error syncing emails:', error);
      throw new Error('Error syncing emails');
    }
  },

  monitorEmailChanges: async function (msalClient, userId) {
    try {
      const client = getAuthenticatedClient(msalClient, userId);

      const subscription = await client.api('/subscriptions').post({
        changeType: 'created,updated,deleted',
        notificationUrl: process.env.NOTIFICATION_URL,
        resource: '/me/mailFolders/inbox/messages',
        expirationDateTime: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
      });

      return subscription;
    } catch (error) {
      console.error('Error monitoring email changes:', error);
      throw new Error('Error monitoring email changes');
    }
  },
};

function getAuthenticatedClient(msalClient, userId) {
  if (!msalClient || !userId) {
    throw new Error(
      `Invalid MSAL state. Client: ${
        msalClient ? 'present' : 'missing'
      }, User ID: ${userId ? 'present' : 'missing'}`
    );
  }

  const client = graph.Client.init({
    authProvider: async (done) => {
      try {
        const account = await msalClient
          .getTokenCache()
          .getAccountByHomeId(userId);

        if (account) {
          const scopes =
            process.env.OAUTH_SCOPES || 'https://graph.microsoft.com/.default';
          const response = await msalClient.acquireTokenSilent({
            scopes: scopes.split(','),
            redirectUri: process.env.OAUTH_REDIRECT_URI,
            account: account,
          });

          done(null, response.accessToken);
        }
      } catch (err) {
        console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        done(err, null);
      }
    },
  });

  return client;
}
