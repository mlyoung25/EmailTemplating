const axios = require('axios');
const validator = require('validator');

/**
 * GET /email
 * Email page.
 */

async function getEmailsFromHubspot() {
  try {
    const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
      properties: ['email'],
      headers: { Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}` }
    });

    return response.data.results.map((contact) => contact.properties.email);
  } catch (err) {
    console.error('Error retrieving emails from Hubspot', err.message);
    return [];
  }
}

exports.index = async (req, res) => {
  const emailList = await getEmailsFromHubspot();
  res.render('email', {
    title: 'Email',
    emailList,
  });
};

exports.sendEmailPost = async (req, res, next) => {
  const validationErrors = [];
  if (validator.isEmpty(req.body.email)) { validationErrors.push({ msg: 'Please enter an email' }); }
  if (validator.isEmpty(req.body.subject)) { validationErrors.push({ msg: 'Subject cannot be blank' }); }
  if (validator.isEmpty(req.body.message)) { validationErrors.push({ msg: 'Message cannot be blank' }); }

  if (validationErrors.length) {
    res.json({ success: false, errors: validationErrors });
    return;
  }

  // Hubspot email object
  const emailData = {
    properties: {
      hs_email_direction: 'EMAIL',
      hs_email_html: req.body.message,
      hs_email_subject: req.body.subject,
      hs_email_from: 'simonbatodetroit@outlook.com',
      hs_email_status: 'SENT',
      hs_timestamp: Date.now()
    }
  };

  try {
    await axios.post('https://api.hubapi.com/crm/v3/objects/emails', emailData, {
      headers: { Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}` }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.emailStats = async (req, res) => {
  const emailList = await getEmailsFromHubspot();
  let stats;
  try {
    const response = await axios.get('MARKETING_EMAILS_API_URL', {
      headers: { Authorization: `Bearer ${process.env.MARKETING_EMAILS_API_KEY}` }
    });

    const emails = response.data.objects;

    const emailStats = emails.map((email) => ({
      name: email.name,
      stats: {
        nodes: [
          { node: 0, name: `${email.name} Sent` },
          { node: 1, name: `${email.name} Delivered` },
          { node: 2, name: `${email.name} Opened` },
        ],
        links: [
          { source: 0, target: 1, value: email.stats.counters.delivered },
          { source: 1, target: 2, value: email.stats.counters.open },
        ]
      }
    }));

    stats = emailStats;
  } catch (err) {
    console.error('Error retrieving stats', err.message);
    stats = {};
  }

  res.render('emailStats', {
    title: 'EmailStats',
    emailList,
    stats,
  });
};
