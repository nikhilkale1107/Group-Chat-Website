const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const sequelize = require("../utils/database");

const generateToken = (id, userName) => {
  return jwt.sign({ id: id, userName: userName }, process.env.TOKEN_SECRET);
};

exports.postNewUser = async (req, res, next) => {
  const { userName, email, phone, password } = req.body;
  const t = await sequelize.transaction();
  try {
    const existingUser = await User.findAll({ where: { email: email } });
    console.log(existingUser);
    if (existingUser.length !== 0) {
      return res.status(409).json({
        message: "User already exists",
      });
    }
    bcrypt.hash(password, 10, async (err, hash) => {
      console.log(err);
      // console.log("hash", hash);
      const user = await User.create({
        userName: userName,
        email: email,
        phone: phone,
        password: hash,
      },
      { transaction: t }
    );
      await t.commit();
      res.status(200).json({
        success: true,
        user: user,
      });
    });
  } catch (err) {
    await t.rollback();
    console.log(err);
    res.status(500).json({
      success: false,
    });
  }
};

exports.postLoginUser = async (req, res, next) => {
    const { email, password } = req.body;
    console.log(req.body);
    try {
      const user = await User.findAll({ where: { email: email } });
      // console.log(user);
      if (user.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }
      bcrypt.compare(password, user[0].password, (err, result) => {
        if (result) {
          const token = generateToken(user[0].id, user[0].userName);
          res.status(200).json({
            success: true,
            message: "user logged in",
            token: token,
          });
        } else {
          res.status(401).json({
            success: false,
            message: "passwords do not match",
          });
        }
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Something went wrong",
        success: false,
      });
    }
  };