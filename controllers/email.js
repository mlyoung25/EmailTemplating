/**
 * GET /email
 * Email page.
 */
exports.index = (req, res) => {
  res.render('email', {
    title: 'Email',
  });
};
