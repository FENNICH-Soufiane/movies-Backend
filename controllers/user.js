const User = require('../models/user');


exports.create = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const newUser = new User({ name, email, password })
    await newUser.save()

    res.json({ user: newUser })
  } catch (error) {
    res.status(500).json({ error })
  }

};
