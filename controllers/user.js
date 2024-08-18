const emailVerificationToken = require('../models/emailVerificationTokenSchema');
const User = require('../models/user');
const nodemailer = require('nodemailer')

exports.create = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(401).json({ error: "This email is already in use !" });
    }
    const newUser = new User({ name, email, password });
    await newUser.save();


    // generate 6 digit otp
    let OTP = '';
    for (let i = 0; i <= 5; i++) {
      const randomVal = Math.round(Math.random() * 9)
      OTP += randomVal;
    }

    // store otp inside in db
    const newEmailVerificationToken = new emailVerificationToken({ owner: newUser._id, token: OTP });

    await newEmailVerificationToken.save();

    // send that otp to user
    var transport = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "9c6a9026369578",
        pass: process.env.pass_nodemailer
      }
    });

    let mailOptions = {
      from: 'fennich0011soufiane@gmail.com',
      to: newUser.email,
      subject: 'Email Verification',
      html: `
        <p>You verification OTP</p>
        <h1>${OTP}</h1>
      `
    };

    transport.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send({ message: 'Erreur lors de l\'envoi de l\'email' });
      }
      res.status(201).json({ message: 'Please verify you email. OTP has been sent to your email account!' });
    });

  } catch (error) {
    res.status(500).json({ error })
  }

};
