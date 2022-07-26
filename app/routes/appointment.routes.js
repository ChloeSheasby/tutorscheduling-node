module.exports = app => {
    const appointment = require("../controllers/appointment.controller.js");
    const { authenticate,isAdmin} = require("../authorization/authorization.js");
  
    var router = require("express").Router();
  
    // Create a new Appointment
    router.post("/", [authenticate],appointment.create);
  
    // Retrieve all Appointment
    router.get("/", [authenticate],appointment.findAll);

    // Retrieve all Appointment
    router.get("/person/:personId", [authenticate],appointment.findAllForPerson);

    // Retrieve all Appointment
    router.get("/group/:groupId", [authenticate],appointment.findAllForGroup);

    // Retrieve all Appointment
    router.get("/allGroup/:groupId", [authenticate],appointment.findAppointmentsForGroup);

    // Retrieve all upcoming Appointment
    router.get("/upGroup/:groupId", [authenticate],appointment.findAllUpcomingForGroup);

    // Retrieve all Appointment
    router.get("/group/:groupId/person/:personId",[authenticate], appointment.findAllForPersonForGroup);

    // Retrieve all upcoming Appointment
    router.get("/upGroup/:groupId/person/:personId", [authenticate],appointment.findAllUpcomingForPersonForGroup);

    // Retrieve all upcoming Appointment
    router.get("/passGroupTutor/:groupId/person/:personId", [authenticate],appointment.findAllPassedForPersonForGroupTutor);

    // Retrieve all upcoming Appointment
    router.get("/passGroupStudent/:groupId/person/:personId", [authenticate],appointment.findAllPassedForPersonForGroupStudent);

    // Retrieve tutor for an appointment
    router.get("/tutorAppointment/:id", [authenticate],appointment.getTutorForAppointment);
  
    // Retrieve a single Appointment with id
    router.get("/:id", [authenticate],appointment.findOne);
  
    // Update a Appointment with id
    router.put("/:id", [authenticate],appointment.update);

    // Update a Appointment for google stuff
    router.put("/google/:id", [authenticate],appointment.updateForGoogle);
  
    // Delete a Appointment with id
    router.delete("/:id", [authenticate],appointment.delete);
  
    // Delete all Appointment
    router.delete("/", [authenticate],appointment.deleteAll);
  
    app.use('/appointment', router);
  };
  