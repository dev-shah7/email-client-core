const axios = require('axios');
const User = require('../models/User');
const { Client } = require('@microsoft/microsoft-graph-client');
const config = require('../config');
const { cca } = require('../services/authService');

exports.getEmails = async (req, res) => {
  try {
    const graphTokenRequest = {
      scopes: config.scopes,
      clientSecret: config.outlookClientSecret,
    };

    const graphTokenResponse = await cca.acquireTokenByClientCredential(
      graphTokenRequest
    );
    const graphAccessToken =
      'eyJ0eXAiOiJKV1QiLCJub25jZSI6IjNqX3RiOVZSME94SmxFaEN1RFIxOXVsdjN2emYzajA1UE96VlRXLVp6T2ciLCJhbGciOiJSUzI1NiIsIng1dCI6IkwxS2ZLRklfam5YYndXYzIyeFp4dzFzVUhIMCIsImtpZCI6IkwxS2ZLRklfam5YYndXYzIyeFp4dzFzVUhIMCJ9.eyJhdWQiOiJodHRwczovL2dyYXBoLm1pY3Jvc29mdC5jb20iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC8zZjg4YTgxMS1iYjRmLTRlZTQtYmM0MS00MTM2OTc5MjkyOWQvIiwiaWF0IjoxNzE2MTI2NTc4LCJuYmYiOjE3MTYxMjY1NzgsImV4cCI6MTcxNjEzMDQ3OCwiYWlvIjoiRTJOZ1lJaVN2NTczN2FpZFdjakZLODFheDZxbkFBQT0iLCJhcHBfZGlzcGxheW5hbWUiOiJlbWFpbC1jbGllbnQtY29yZSIsImFwcGlkIjoiMDRmMGQzOGQtNWFhYy00OTJkLThmNmItMTcxMzA1MWE2ZWMxIiwiYXBwaWRhY3IiOiIxIiwiaWRwIjoiaHR0cHM6Ly9zdHMud2luZG93cy5uZXQvM2Y4OGE4MTEtYmI0Zi00ZWU0LWJjNDEtNDEzNjk3OTI5MjlkLyIsImlkdHlwIjoiYXBwIiwib2lkIjoiNzg4NjJmZjctYzdlYi00ZGY1LTk4ZjctYjZkM2Q3ZjVmYzE0IiwicmgiOiIwLkFhOEFFYWlJUDAtNzVFNjhRVUUybDVLU25RTUFBQUFBQUFBQXdBQUFBQUFBQUFBZEFRQS4iLCJzdWIiOiI3ODg2MmZmNy1jN2ViLTRkZjUtOThmNy1iNmQzZDdmNWZjMTQiLCJ0ZW5hbnRfcmVnaW9uX3Njb3BlIjoiRVUiLCJ0aWQiOiIzZjg4YTgxMS1iYjRmLTRlZTQtYmM0MS00MTM2OTc5MjkyOWQiLCJ1dGkiOiJWa0NwRnRha28wQ2lQX0RQblJHbEFBIiwidmVyIjoiMS4wIiwid2lkcyI6WyIwOTk3YTFkMC0wZDFkLTRhY2ItYjQwOC1kNWNhNzMxMjFlOTAiXSwieG1zX3RjZHQiOjE3MTU5NDAyNzJ9.m4L35sugoD-1ifeK-LAn2Gd4nuFoxpWAMt_fRl-fRkZaBUhV_xkWi6QfpnCy7p6cArjE5_SD24XqRq-_DYcwVzkfA9L9MKtJTTf-J_d8iHUioRz7QP_bzmGZ01U8JnB36I9-qYH-2wRiRnDNCbCoV1SNGcjQHHCGktNvMWUCjPApnKDyFHEeQzKLIEwTF_5FtUWbyuWu-kI8D5DzsjNei9dou50vinNIiUfCBd6Kzrtyvxko0SiJlp5X0g0J1h_dqtkydWPlwNK17Oqiar1Itn3VLY3j9S4bDnn_cnLj-QuP5lqwMGOoGsFIx3Kahh00cVNbrz9YXHUrwhxltjHaCA';

    const graphRequestParams = {
      method: 'GET',
      url: 'https://graph.microsoft.com/v1.0/me/messages',
      headers: {
        Authorization: `Bearer ${graphAccessToken}`,
      },
    };

    // Make a request to the Microsoft Graph API
    const graphResponse = await axios(graphRequestParams);
    const emails = graphResponse.data.value;

    res.status(200).json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error.response.data);
    res.status(500).send(error.message);
  }
  // try {
  //   const user = await User.findById(req.user.id);
  //   if (!user) {
  //     return res.status(404).send('User not found');
  //   }

  //   const accessToken = user.accessToken;
  //   console.log('Access Token: ', accessToken);
  //   const response = await axios.get(
  //     'https://graph.microsoft.com/v1.0/me/messages',
  //     {
  //       headers: {
  //         Authorization: `Bearer ${accessToken}`,
  //         ContentType: 'application/json',
  //       },
  //     }
  //   );

  //   const emails = response.data.value;
  //   res.status(200).json(emails);
  // } catch (error) {
  //   console.error('Error fetching emails:', error.response.data);
  //   res.status(200).send('Server Error', error.response.data);
  // }
};
