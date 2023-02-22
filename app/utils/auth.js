const db = require("../models");
const authconfig = require("../config/auth.config");
const Person = db.person;
const Session = db.session;
const PersonRole = db.personrole;
const Role = db.role;
const Group = db.group;
const Op = db.Sequelize.Op;

const { google } = require("googleapis");

var jwt = require("jsonwebtoken");

let googleUser = {};

const google_id = process.env.GOOGLE_AUDIENCE;

exports.login = async (req, res) => {
  console.log(req.body);

  var googleToken = req.body.credential;

  const { OAuth2Client } = require("google-auth-library");
  const client = new OAuth2Client(google_id);
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: google_id,
    });
    googleUser = ticket.getPayload();
    console.log("Google payload is " + JSON.stringify(googleUser));
  }
  await verify().catch(console.error);

  let email = googleUser.email;
  let firstName = googleUser.given_name;
  let lastName = googleUser.family_name;

  console.log(lastName);

  let person = {};
  let session = {};
  let access = [];

  await Person.findOne({
    where: {
      email: email,
    },
  })
    .then((data) => {
      if (data != null) {
        person = data.dataValues;
      } else {
        // create a new Person and save to database
        person = {
          fName: firstName,
          lName: lastName,
          email: email,
          phoneNum: "",
        };
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });

  // this lets us get the person id
  if (person.id === undefined) {
    console.log("need to get person's id");
    await Person.create(person)
      .then((data) => {
        console.log("person was registered");
        person = data.dataValues;
        // res.send({ message: "Person was registered successfully!" });
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
      });
  } else {
    // doing this to ensure that the person's name is the one listed with Google
    person.fName = firstName;
    person.lName = lastName;
    await Person.update(person, { where: { id: person.id } })
      .then((num) => {
        if (num == 1) {
          console.log("updated person's name");
        } else {
          console.log(
            `Cannot update Person with id=${person.id}. Maybe Person was not found or req.body is empty!`
          );
        }
      })
      .catch((err) => {
        console.log("Error updating Person with id=" + person.id + " " + err);
      });
  }

  // sets access for user
  await Group.findAll({
    include: [
      {
        model: Role,
        include: [
          {
            where: { "$role->personrole.personId$": person.id },
            model: PersonRole,
            as: "personrole",
            required: true,
          },
        ],
        as: "role",
        required: true,
      },
    ],
    order: [["name", "ASC"]],
  })
    .then((data) => {
      for (let i = 0; i < data.length; i++) {
        let element = data[i].dataValues;
        let roles = [];
        let sortedRoles = [];

        for (let j = 0; j < element.role.length; j++) {
          let item = element.role[j];
          let role = {
            type: item.type,
            personRoleId: item.personrole[0].id,
          };
          roles.push(role);
        }

        // sets the order of the roles
        if (roles.find((role) => role.type === "Admin") !== undefined)
          sortedRoles[0] = roles.find((role) => role.type === "Admin");
        else if (roles.find((role) => role.type === "Tutor") !== undefined)
          sortedRoles[0] = roles.find((role) => role.type === "Tutor");
        else if (roles.find((role) => role.type === "Student") !== undefined)
          sortedRoles[0] = roles.find((role) => role.type === "Student");

        if (
          roles.find((role) => role.type === "Tutor") !== undefined &&
          sortedRoles.find((role) => role.type === "Tutor") === undefined
        )
          sortedRoles[1] = roles.find((role) => role.type === "Tutor");
        else if (
          roles.find((role) => role.type === "Student") !== undefined &&
          sortedRoles.find((role) => role.type === "Student") === undefined
        )
          sortedRoles[1] = roles.find((role) => role.type === "Student");

        if (
          roles.find((role) => role.type === "Student") !== undefined &&
          sortedRoles.find((role) => role.type === "Student") == undefined
        )
          sortedRoles[2] = roles.find((role) => role.type === "Student");

        let group = {
          name: element.name,
          roles: sortedRoles,
        };
        access.push(group);
      }
      console.log(access);
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });

  // try to find session first

  await Session.findOne({
    where: {
      email: email,
      token: { [Op.ne]: "" },
    },
  })
    .then(async (data) => {
      if (data !== null) {
        session = data.dataValues;
        if (session.expirationDate < Date.now()) {
          session.token = "";
          // clear session's token if it's expired
          await Session.update(session, { where: { id: session.id } })
            .then((num) => {
              if (num == 1) {
                console.log("successfully logged out");
              } else {
                console.log("failed");
                res.send({
                  message: `Error logging out user.`,
                });
              }
            })
            .catch((err) => {
              console.log(err);
              res.status(500).send({
                message: "Error logging out user.",
              });
            });
          //reset session to be null since we need to make another one
          session = {};
        } else {
          // if the session is still valid, then send info to the front end
          let userInfo = {
            email: person.email,
            fName: person.fName,
            lName: person.lName,
            phoneNum: person.phoneNum,
            access: access,
            userID: person.id,
            token: session.token,
            refresh_token: person.refresh_token,
            expiration_date: person.expiration_date,
          };
          console.log("found a session, don't need to make another one");
          console.log(userInfo);
          res.send(userInfo);
        }
      }
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving sessions.",
      });
    });

  if (session.id === undefined) {
    // create a new Session with an expiration date and save to database
    let token = jwt.sign({ id: email }, authconfig.secret, {
      expiresIn: 86400,
    });
    let tempExpirationDate = new Date();
    tempExpirationDate.setDate(tempExpirationDate.getDate() + 1);
    session = {
      token: token,
      email: email,
      personId: person.id,
      expirationDate: tempExpirationDate,
    };

    console.log("making a new session");
    console.log(session);

    await Session.create(session)
      .then(() => {
        let userInfo = {
          email: person.email,
          fName: person.fName,
          lName: person.lName,
          phoneNum: person.phoneNum,
          access: access,
          userID: person.id,
          token: session.token,
          refresh_token: person.refresh_token,
          expiration_date: person.expiration_date,
        };
        console.log(userInfo);
        res.send(userInfo);
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
      });
  }
};

exports.authorize = async (req, res) => {
  console.log("authorize client");
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_AUDIENCE,
    process.env.CLIENT_SECRET,
    "postmessage"
  );

  console.log("authorize token");
  // Get access and refresh tokens (if access_type is offline)
  let { tokens } = await oauth2Client.getToken(req.body.code);
  oauth2Client.setCredentials(tokens);

  let person = {};
  console.log("findPerson");

  await Person.findOne({
    where: {
      id: req.params.id,
    },
  })
    .then((data) => {
      if (data != null) {
        person = data.dataValues;
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
      return;
    });
  console.log("person");
  console.log(person);
  person.refresh_token = tokens.refresh_token;
  let tempExpirationDate = new Date();
  tempExpirationDate.setDate(tempExpirationDate.getDate() + 100);
  person.expiration_date = tempExpirationDate;

  await Person.update(person, { where: { id: person.id } })
    .then((num) => {
      if (num == 1) {
        console.log("updated person's google token stuff");
      } else {
        console.log(
          `Cannot update Person with id=${person.id}. Maybe Person was not found or req.body is empty!`
        );
      }
      let userInfo = {
        refresh_token: person.refresh_token,
        expiration_date: person.expiration_date,
      };
      console.log(userInfo);
      res.send(userInfo);
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });

  console.log(tokens);
  console.log(oauth2Client);
};

exports.logout = async (req, res) => {
  // invalidate session -- delete token out of session table
  let session = {};

  await Session.findAll({ where: { token: req.body.token } })
    .then((data) => {
      if (data[0] !== undefined) session = data[0].dataValues;
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving sessions.",
      });
      return;
    });

  session.token = "";

  // session won't be null but the id will if no session was found
  if (session.id !== undefined) {
    Session.update(session, { where: { id: session.id } })
      .then((num) => {
        if (num == 1) {
          console.log("successfully logged out");
          res.send({
            message: "User has been successfully logged out!",
          });
        } else {
          console.log("failed");
          res.send({
            message: `Error logging out user.`,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send({
          message: "Error logging out user.",
        });
      });
  } else {
    console.log("already logged out");
    res.send({
      message: "User has already been successfully logged out!",
    });
  }
};