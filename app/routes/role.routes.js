module.exports = app => {
    const role = require("../controllers/role.controller.js");
  
    var router = require("express").Router();
  
    // Create a new Role
    router.post("/", role.create);
  
    // Retrieve all Role
    router.get("/", role.findAll);
  
    // Retrieve a single Role with id
    router.get("/:id", role.findOne);

    // Retrieve roles for a specific group
    router.get("/group/:groupId", role.findAllForGroup);

    // Retrieve roles for a specific person including personrole
    router.get("/person/:personId", role.findRoleForPerson);

    // Retrieve roles by group for a specific person including personroles
    router.get("/group/:groupId/person/:personId", role.findRoleByGroupForPerson);

    // Retrieve incomplete roles for a specific person including personrole
    router.get("/personIn/:personId", role.findIncompleteRoleForPerson);
  
    // Update a Role with id
    router.put("/:id", role.update);
  
    // Delete a Role with id
    router.delete("/:id", role.delete);
  
    // Delete all Roles
    router.delete("/", role.deleteAll);
  
    app.use('/role', router);
  };