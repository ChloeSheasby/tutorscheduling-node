module.exports = (sequelize, Sequelize) => {
    const Appointment = sequelize.define("appointment", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      googleEventId: {
        type: Sequelize.STRING,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      endTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tutorStart: {
        type: Sequelize.TIME
      },
      tutorEnd: {
        type: Sequelize.TIME
      },
      URL: {
        type: Sequelize.STRING
      },
      preSessionInfo: {
        type: Sequelize.STRING
      }
    });
  
    return Appointment;
};
