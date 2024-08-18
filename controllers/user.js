const User = require('../models/user');


exports.create = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const oldUser = await User.findOne({email});
    
    if(oldUser) {
      return res.status(401).json({error: "This email is already in use !"});
    }
    const newUser = new User({ name, email, password })
    await newUser.save()

    var transport = nodemailer.createTransport({

      host: "sandbox.smtp.mailtrap.io",    
      port: 2525,    
      auth: {
        user: "9c6a9026369578",
        pass: process.env.pass_nodemailer
      }
    });

    res.status(201).json({ user: newUser })
  } catch (error) {
    res.status(500).json({ error })
  }

};
