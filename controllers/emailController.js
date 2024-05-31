const { default: axios } = require('axios');
const graph = require('../graph');
const { default: syncEmails } = require('../sync');

exports.getEmails = async (req, res) => {
  try {
    const emails = await graph.getEmails(
      req.app.locals.msalClient,
      req.session.userId
    );
    console.log('Emails: ', emails);
    res.status(200).send({ message: 'ms oauth successful', emails });
  } catch (error) {
    console.error('Error fetching emails:', error);
  }
};

exports.syncEmails = async (req, res) => {
  const accessToken = req.session.accessToken;
  const idToken = req.session.idToken;
  console.log('ACCESS_TOKEN::', accessToken);

  if (!accessToken) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const userInfo = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    const userId = userInfo.data.id;

    await syncEmails(accessToken, userId);

    res.send('Emails are being synchronized');
  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).send('Error during email synchronization');
  }
};
