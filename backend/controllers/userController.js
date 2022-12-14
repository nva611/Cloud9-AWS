import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { getImg } from "../utils/saveFile.js"
import { getUrlImageObj } from "../utils/getUrlImage.js";
import AWS from "aws-sdk"
let awsConfig = {
  "region": "us-east-1"
}

AWS.config.update(awsConfig)

let docClient = new AWS.DynamoDB.DocumentClient();
// update user
export const updateUser = async (req, res, next) => {
  try {
    let image = null
    let body;
    // nếu có ảnh
    if (req.body.img !== null) {
      image = getImg(req.body.img);
      body = { ...req.body, img: image };
    }
    else {
      body = { ...req.body }
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: body },
      { new: true }
    );
    const { password, img, ...otherDetails } = updatedUser._doc;
    let imgPath;
    if (img === null)
      imgPath = otherDetails.avatar;
    else
      imgPath = getUrlImageObj(img);
    res.status(200).json({ ...otherDetails, imgPath: imgPath });
  } catch (err) {
    next(err);
  }
};

// update user password + others
export const updateUserPassword = async (req, res, next) => {
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);
    const body = { ...req.body, password: hash };
    const updatedUser = await User.findOneAndUpdate(
      { email: req.params.email },
      { $set: body },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};

// delete user
export const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("User has been deleted");
  } catch (err) {
    next(err);
  }
};

// select a user by user id
export const selectUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// select a user by user id
export const selectUserByEmail = async (req, res, next) => {
  try {
    var user;
    var params = {
      TableName: "users",
      FilterExpression: "#email= :email",

      ExpressionAttributeNames: {
        "#email": "email"
      },
      ExpressionAttributeValues: {
        ":email": req.params.email
      },
    }
    console.log(req.params.email)
    await docClient.scan(params, function (err, data) {
      if (err) {
        //console.log("ERROR", JSON.stringify(err, null, 2));
        res.status(200).json(null)
      }
      else {
        user = data.Items[0]
        if (user !== undefined)
          res.status(200).json({ email: user.email });
        else res.status(200).json(null)
      }
    })
  } catch (err) {
    next(err);
  }
};

// select all users
export const selectAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};
