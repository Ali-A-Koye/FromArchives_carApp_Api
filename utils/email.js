const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlTotext = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.Email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Car Application <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.NODE_ENV === 'development'
    ) {
      //sendgrid
      return nodemailer.createTransport({
        service: 'sendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async send(template, subject) {
    //Send the actual email
    //1) render HTML based on a Pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        FirstName: this.firstName,
        url: this.url,
        subject
      }
    );
    //2) define email options
    const mailoptions = {
      from: this.from,
      to: this.to,
      subject,
      html: html,
      text: htmlTotext.fromString(html)
      //html
    };

    //3) create a transport and sen email
    this.newTransport().sendMail(mailoptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Sirius Website');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordreset',
      'Your PasswordReset Token(Valid for only 10 minutes)'
    );
  }
};
