const axios = require('axios');
const path = require('path');
const environment = require('dotenv');
const varium = require('varium');
const manifestPath = path.join(__dirname, '../env.manifest');

environment.config({ path: './test/.env' });
varium({ manifestPath });

const instance = axios.create({
  baseURL: process.env.SERVER
});

let adminToken = false;

const login = () =>
  instance
    .post(
      '/fmi/admin/api/v2/user/auth',
      {},
      {
        auth: {
          username: process.env.ADMIN_USER,
          password: process.env.ADMIN_PASSWORD
        }
      }
    )
    .then(response => {
      adminToken = response.data.response.token;
      return response.data.response.token;
    });

const logout = (token = adminToken) =>
  token
    ? instance
        .delete(`/fmi/admin/api/v2/user/auth/${token}`, {})
        .then(response => {
          adminToken = false;
          return response.data.response.token;
        })
    : Promise.resolve();

const remove = ({ id }, token = adminToken) =>
  instance
    .delete(`/fmi/admin/api/v2/clients/${id}`, {
      params: {
        graceTime: 0
      },
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => response.data)
    .catch(error => console.log(error.response.data));

const drop = account =>
  find(account).then(sessions => {
    const removals = [];
    sessions.forEach(session => removals.push(remove(session)));
    return Promise.all(removals);
  });

const find = ({ userName }, token = adminToken) =>
  instance
    .get('/fmi/admin/api/v2/clients', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response =>
      response.data.response.clients.filter(
        client => client.userName === userName
      )
    );

module.exports = { admin: { login, logout, sessions: { find, drop } } };
