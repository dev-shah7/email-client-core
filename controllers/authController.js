const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  const esClient = req.app.locals.esClient;
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const indexExists = await esClient.indices.exists({ index: 'users' });

    console.log('Index exists:', indexExists.body);
    if (!indexExists.body) {
      const response = await esClient.index({
        index: 'users',
        body: {
          username,
          password: hashedPassword,
          userAccountId: '',
          displayName: '',
          email: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        refresh: true,
      });

      const token = jwt.sign(
        { username, localId: response._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res
        .status(201)
        .send({ message: 'User created successfully', token });
    } else {
      const searchResponse = await esClient.search({
        index: 'users',
        body: {
          query: {
            match: { username },
          },
        },
      });

      if (searchResponse.body.hits.total.value > 0) {
        return res.status(409).send({ message: `${username} already exists!` });
      } else {
        const response = await esClient.index({
          index: 'users',
          body: {
            username,
            password: hashedPassword,
            userAccountId: '',
            displayName: '',
            email: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          refresh: true,
        });

        console.log('Response:', response);
        const token = jwt.sign(
          { username, localId: response._id },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        return res
          .status(201)
          .send({ message: 'User created successfully', token });
      }
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).send({ error: 'Error creating user' });
  }
};

exports.login = async (req, res) => {
  const esClient = req.app.locals.esClient;
  const { username, password } = req.body;

  try {
    const body = await esClient.search({
      index: 'users',
      body: {
        query: {
          match: { username },
        },
      },
    });

    if (body.hits.total.value === 0) {
      return res.status(400).send({ error: 'Invalid username or password' });
    }

    const user = body.hits.hits[0]._source;

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).send({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { username, localId: body.hits.hits[0]._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    req.session.token = token;

    res.status(200).send({ message: 'Logged in successfully', token });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).send({ error: 'Error logging in user' });
  }
};

exports.outlook = async function (req, res) {
  const scopes =
    process.env.OAUTH_SCOPES || 'https://graph.microsoft.com/.default';
  const urlParameters = {
    scopes: scopes.split(','),
    redirectUri: process.env.OAUTH_REDIRECT_URI,
  };

  try {
    const authUrl = await req.app.locals.msalClient.getAuthCodeUrl(
      urlParameters
    );
    res.redirect(authUrl);
  } catch (error) {
    console.log(`Error: ${error}`);
    req.flash('error_msg', {
      message: 'Error getting auth URL',
      debug: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
    res.redirect('/');
  }
};

exports.outlookCallback = async function (req, res) {
  const scopes =
    process.env.OAUTH_SCOPES || 'https://graph.microsoft.com/.default';
  const tokenRequest = {
    code: req.query.code,
    scopes: scopes.split(','),
    redirectUri: process.env.OAUTH_REDIRECT_URI,
  };

  try {
    const response = await req.app.locals.msalClient.acquireTokenByCode(
      tokenRequest
    );

    req.session.userId = response.account.homeAccountId;

    const user = await graph.getUserDetails(
      req.app.locals.msalClient,
      req.session.userId
    );

    req.app.locals.users[req.session.userId] = {
      displayName: user.displayName,
      email: user.mail || user.userPrincipalName,
      timeZone: user.mailboxSettings.timeZone,
    };

    req.session.userId = response.account.homeAccountId;
    req.session.idToken = response.idToken;
    req.session.accessToken = response.accessToken;

    req.app.locals.users[req.session.userId] = {
      displayName: user.displayName,
      email: user.mail || user.userPrincipalName,
      timeZone: user.mailboxSettings.timeZone,
    };

    const esClient = req.app.locals.esClient;

    const indexExists = await esClient.indices.exists({ index: 'users' });

    console.log('Index Exisist in outlook : ', indexExists);
    if (!indexExists) {
      await esClient.index({
        index: 'users',
        body: {
          userAccountId: tokenResponse.account.homeAccountId,
          displayName: user.displayName,
          email: user.email || user.userPrincipalName,
        },
      });

      const emails = await readEmails(
        req.app.locals.msalClient,
        req.session.userId
      );

      res.status(200).send({ message: 'ms oauth successful', emails });
    } else {
      const body = await esClient.search({
        index: 'users',
        body: {
          query: {
            match: { email: user.userPrincipalName },
          },
        },
      });

      if (body && body.hits.total.value > 0) {
        const emails = await readEmails(
          req.app.locals.msalClient,
          req.session.userId
        );

        return res.status(200).send({
          message: `ms oauth successful`,
          emails,
        });
      }
    }
  } catch (error) {
    req.flash('error_msg', {
      message: 'Error completing authentication',
      debug: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
  }

  res.redirect('/');
};

exports.signout = async function (req, res) {
  if (req.session.userId) {
    const accounts = await req.app.locals.msalClient
      .getTokenCache()
      .getAllAccounts();

    const userAccount = accounts.find(
      (a) => a.homeAccountId === req.session.userId
    );

    if (userAccount) {
      req.app.locals.msalClient.getTokenCache().removeAccount(userAccount);
    }
  }

  req.session.destroy(function () {
    res.redirect('/');
  });
};
