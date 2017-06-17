const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const {
  MAIL_HOST: host,
  MAIL_PORT: port,
  MAIL_USER: user,
  MAIL_PASS: pass,
} = process.env;

const auth = { user, pass };

const transport = nodemailer.createTransport({
  host,
  port,
  auth,
});

const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(
    `${__dirname}/../views/email/${filename}.pug`,
    options
  );
  return juice(html);
};

exports.send = options => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html);
  const mailOptions = {
    from: 'Steven Scaffidi <sscaff1@gmail.com>',
    to: options.user.email,
    subject: options.subject,
    html,
    text,
  };
  const sendMail = promisify(transport.sendMail, transport);
  return sendMail(mailOptions);
};
