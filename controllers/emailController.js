const graph = require('../graph');

exports.getEmails = async (req, res) => {
  try {
    console.log('Response: ', req.session.userId);
    const emails = await graph.getEmails(
      req.app.locals.msalClient,
      req.session.userId
    );
    console.log('Emails: ', emails);
    res.status(200).send({ message: 'ms oauth successful', emails });
  } catch (error) {
    console.error('Error fetching emails:', error.message);
  }
};

exports.getUserDetails = async (req, res, next) => {};
