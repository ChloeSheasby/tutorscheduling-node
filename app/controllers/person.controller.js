const { Sequelize } = require("../models");
const db = require("../models");
const Person = db.person;
const PersonRole = db.personrole;
const PersonAppointment = db.personappointment;
const Appointment = db.appointment;
const Role = db.role;
const Op = db.Sequelize.Op;

// Create and Save a new Person
exports.create = (req, res) => {
    // Validate request
    if (!req.body.fName) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
      return;
    }
  
    // Create a Person
    const person = {
      id: req.body.id,
      fName: req.body.fName,
      lName: req.body.lName,
      email: req.body.email,
      phoneNum: req.body.phoneNum,
      refresh_token: req.body.refresh_token,
      expiration_date: req.body.expiration_date
    };
  
    // Save Person in the database
    Person.create(person)
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the Person."
        });
      });
  };

// Retrieve all People from the database.
exports.findAll = (req, res) => {
    const id = req.query.id;
    var condition = id ? { id: { [Op.like]: `%${id}%` } } : null;
  
    Person.findAll({ where: condition })
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving people."
        });
      });
  };

// Find the first tutor for an appointment to get google token
exports.findFirstTutorForAppointment = (req, res) => {
const appId = req.params.appointmentId;

  Person.findAll({
    include: [ {
        model: PersonAppointment, 
        as: 'personappointment',
        required: true,
        where: { isTutor: true },
        include: [ {
          model: Appointment, 
          as: 'appointment',
          required: true,
          where: { '$personappointment->appointment.id$': appId}
      }]
    }]
  })
  .then((data) => {
    // only need to send the first tutor in the appointment to be the organizer
    //console.log(data[0])
      res.send(data[0]);
  })
  .catch(err => {
      res.status(500).send({ message: err.message });
  });
};

// Find a single Person with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
  
    Person.findByPk(id)
      .then(data => {
        if (data) {
          res.send(data);
        } else {
          res.status(404).send({
            message: `Cannot find Person with id=${id}.`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error retrieving Person with id=" + id
        });
      });
  };

// Find a single Person with an email
exports.findByEmail = (req, res) => {
  const email = req.params.email;

  Person.findOne({ 
    where: {
      email: email 
    }
  })
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.send({email: 'not found'});
        /*res.status(404).send({
          message: `Cannot find Person with email=${email}.`
        });*/
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Person with email=" + email
      });
    });
};

// Find a single Person with an email
exports.findAllForGroup = (req, res) => {
  const groupId = req.params.groupId;

  Person.findAll({
    include: [ {
        model: PersonRole, 
        as: 'personrole',
        required: true,
        include: [ {
          model: Role, 
          as: 'role',
          required: true,
          where: { '$personrole->role.groupId$': groupId}
      }]
    }]
  })
  .then((data) => {
      res.send(data);
  })
  .catch(err => {
      res.status(500).send({ message: err.message });
  });
};

// Find pending tutors for group
exports.findPendingTutorsForGroup = (req, res) => {
  const groupId = req.params.groupId;

  Person.findAll({
    include: [ {
        model: PersonRole, 
        as: 'personrole',
        required: true,
        where: { '$personrole.status$': "applied"},
        include: [ {
          model: Role, 
          as: 'role',
          required: true,
          where: { '$personrole->role.groupId$': groupId, '$personrole->role.type$': "Tutor"}
      }]
    }]
  })
  .then((data) => {
      res.send(data);
  })
  .catch(err => {
      res.status(500).send({ message: err.message });
  });
};

// Find approved tutors for group
exports.findApprovedTutorsForGroup = (req, res) => {
  const groupId = req.params.groupId;

  Person.findAll({
    include: [ {
        model: PersonRole, 
        as: 'personrole',
        required: true,
        where: Sequelize.or({'$personrole.status$': "approved"},
                            {'$personrole.status$': "Approved"}),
        include: [ {
          model: Role, 
          as: 'role',
          required: true,
          where: { '$personrole->role.groupId$': groupId, '$personrole->role.type$': "Tutor"}
      }]
    }]
  })
  .then((data) => {
      res.send(data);
  })
  .catch(err => {
      res.status(500).send({ message: err.message });
  });
};

// Update a Person by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;
  
    Person.update(req.body, {
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Person was updated successfully."
          });
        } else {
          res.send({
            message: `Cannot update Person with id=${id}. Maybe Person was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error updating Person with id=" + id
        });
      });
  };

// Delete a Person with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
  
    Person.destroy({
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Person was deleted successfully!"
          });
        } else {
          res.send({
            message: `Cannot delete Person with id=${id}. Maybe Person was not found!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Could not delete Person with id=" + id
        });
      });
  };

// Delete all People from the database.
exports.deleteAll = (req, res) => {
    Person.destroy({
      where: {},
      truncate: false
    })
      .then(nums => {
        res.send({ message: `${nums} People were deleted successfully!` });
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while removing all people."
        });
      });
  };
  