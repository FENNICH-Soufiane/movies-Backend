const { isValidObjectId } = require('mongoose');
const emailVerificationToken = require('../models/emailVerificationTokenSchema');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const passwordResetToken = require('../models/passwordResetToken');
const { generateOTP, generateMailTransporter } = require('../utils/mail');
const { generateRandomByte } = require('../utils/helper');

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
    let OTP = generateOTP()

    // store otp inside in db
    const newEmailVerificationToken = new emailVerificationToken({ owner: newUser._id, token: OTP });
    console.log(newEmailVerificationToken);

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
      res.status(201).json({
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email
        },
        message: 'Please verify you email. OTP has been sent to your email account!'
      });
    });

  } catch (error) {
    res.status(500).json({ error })
  }

};

exports.verifyEmail = async (req, res) => {
  const { userId, OTP } = req.body

  if (!isValidObjectId(userId)) return res.json({ error: "Invalid user!" })

  const user = await User.findById(userId)
  if (!user) return res.json({ error: "user not found!" })

  if (user.isVerified) return res.json({ error: "user is already verified!" })

  const token = await emailVerificationToken.findOne({ owner: userId })
  console.log(token);
  if (!token) return res.json({ error: 'token not found!' });

  const isMatched = await token.compareToken(OTP)
  if (!isMatched) return res.json({ error: 'Please submit a valid OTP!' })

  user.isVerified = true;
  await user.save();

  await emailVerificationToken.findByIdAndDelete(token._id);

  var transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "9c6a9026369578",
      pass: process.env.pass_nodemailer
    }
  });

  transport.sendMail({
    from: 'fennich0011soufiane@gmail.com',
    to: user.email,
    subject: 'Welcome Email',
    html: '<h1>Welcome to our app and thanks for choosing us.</h1>'
  })

  const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET)
  res.json({ user: { id: user._id, name: user.name, email: user.email, token: jwtToken }, message: "Your email is verified." })

}

exports.resendEmailVerificationToken = async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.json({ error: "user not found!" });

  if (user.isVerified)
    return res.json({ error: "This email id is already verified!" });

  const alreadyHasToken = await emailVerificationToken.findOne({
    owner: userId,
  });
  if (alreadyHasToken)
    return res.json({ error: "Only after one hour you can request for another token!" });

  // generate 6 digit otp
  let OTP = generateOTP()

  // store otp inside our db
  const newEmailVerificationToken = new emailVerificationToken({ owner: user._id, token: OTP })

  await newEmailVerificationToken.save()

  // send that otp to our user

  var transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "f29ed41f1f4bd3",
      pass: "db3edd88e2927f"
    }
  });

  transport.sendMail({
    from: 'verification@reviewapp.com',
    to: user.email,
    subject: 'Email Verification',
    html: `
      <p>You verification OTP</p>
      <h1>${OTP}</h1>
    `
  })

  res.json({
    message: "New OTP has been sent to your registered email accout.",
  });
};

exports.forgetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(401).josn("email is missing!");

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json("User not found!")

  const alreadyHasToken = await passwordResetToken.findOne({ owner: user._id });
  if (alreadyHasToken)
    return res.status(401).json("Only after one hour you can request for another token!");

  const token = await generateRandomByte();
  const newPasswordResetToken = await passwordResetToken({
    owner: user._id,
    token,
  });
  await newPasswordResetToken.save();

  const resetPasswordUrl = `http://localhost:3000/reset-password?token=${token}&id=${user._id}`;

  const transport = generateMailTransporter();

  transport.sendMail({
    from: "fennich0011soufiane@gmail.com",
    to: user.email,
    subject: "Reset Password Link",
    html: `
      <p>Click here to reset password</p>
      <a href='${resetPasswordUrl}'>Change Password</a>
    `,
  });

  res.json({ message: "Link sent to your email!" });
};

exports.sendResetPasswordTokenStatus = (req, res) => {
  res.json({ valid: true })
}

exports.resetPassword = async (req, res) => {
  const { newPassword, userId } = req.body;

  const user = await User.findById(userId);
  const matched = await user.comparePassword(newPassword);
  if (matched)
    return sendError(
      res,
      "The new password must be different from the old one!"
    );

  user.password = newPassword;
  await user.save();

  await passwordResetToken.findByIdAndDelete(req.resetToken._id);

  const transport = generateMailTransporter();

  transport.sendMail({
    from: "fennich0011soufiane@gmail.com",
    to: user.email,
    subject: "Password Reset Successfully",
    html: `
      <h1>Password Reset Successfully</h1>
      <p>Now you can use new password.</p>

    `,
  });

  res.json({
    message: "Password reset successfully, now you can use new password.",
  });
}

exports.signIn = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "Email/Password mismatch!");

  const matched = await user.comparePassword(password);
  if (!matched) return sendError(res, "Email/Password mismatch!");

  const { _id, name, role, isVerified } = user;

  const jwtToken = jwt.sign({ userId: _id }, process.env.JWT_SECRET);

  res.json({
    user: { id: _id, name, email, role, token: jwtToken, isVerified },
  });
};
