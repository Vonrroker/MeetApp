module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('meetups', 'subscription_id', {
      type: Sequelize.INTEGER,
      references: { model: 'subscriptions', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true,
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('meetups', 'subscription_id');
  },
};
