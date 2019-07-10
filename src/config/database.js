require('dotenv/config');

module.exports = {
  username: 'postgres',
  password: 'docker',
  database: 'meetapp',
  host: 'localhost',
  dialect: 'postgres',
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};
