mkdir food-delivery-app
cd food-delivery-app
npm init -y
npm install express sequelize pg pg-hstore jsonwebtoken bcrypt


// config/config.js
module.exports = {
  development: {
    username: "your_username",
    password: "your_password",
    database: "food_delivery_db",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  // Add configurations for other environments if needed
};


npx sequelize-cli init


npx sequelize-cli model:generate --name User --attributes username:string,email:string,password:string,roleId:integer
npx sequelize-cli model:generate --name Role --attributes name:string
npx sequelize-cli model:generate --name Restaurant --attributes name:string,location:string
npx sequelize-cli model:generate --name Menu --attributes name:string,price:decimal,restaurantId:integer
npx sequelize-cli model:generate --name Order --attributes userId:integer,menuId:integer,status:string


// models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    roleId: DataTypes.INTEGER
  }, {});
  User.associate = function(models) {
    User.belongsTo(models.Role, { foreignKey: 'roleId' });
  };
  return User;
};

// models/role.js
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    name: DataTypes.STRING
  }, {});
  Role.associate = function(models) {
    Role.hasMany(models.User, { foreignKey: 'roleId' });
  };
  return Role;
};

// Similarly set up associations for other models


npx sequelize-cli db:migrate

// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  const data = jwt.verify(token, 'your_jwt_secret');
  try {
    const user = await User.findOne({ where: { id: data.id } });
    if (!user) {
      throw new Error();
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Not authorized to access this resource' });
  }
};

module.exports = auth;

// middleware/role.js
const { Role } = require('../models');

const role = (roleName) => {
  return async (req, res, next) => {
    try {
      const role = await Role.findOne({ where: { name: roleName } });
      if (req.user.roleId !== role.id) {
        return res.status(403).send({ error: 'Access denied' });
      }
      next();
    } catch (error) {
      res.status(500).send({ error: 'Internal server error' });
    }
  };
};

module.exports = role;


// routes/user.js
const express = require('express');
const { User, Role } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const role = await Role.findOne({ where: { name: 'user' } });
  const user = await User.create({
    ...req.body,
    password: await bcrypt.hash(req.body.password, 10),
    roleId: role.id
  });
  const token = jwt.sign({ id: user.id }, 'your_jwt_secret');
  res.status(201).send({ user, token });
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ where: { email: req.body.email } });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(401).send({ error: 'Login failed' });
  }
  const token = jwt.sign({ id: user.id }, 'your_jwt_secret');
  res.send({ user, token });
});

router.get('/me', auth, async (req, res) => {
  res.send(req.user);
});

module.exports = router;



// controllers/restaurantController.js
const { Restaurant, Menu } = require('../models');

exports.createRestaurant = async (req, res) => {
  const restaurant = await Restaurant.create(req.body);
  res.status(201).send(restaurant);
};

exports.createMenu = async (req, res) => {
  const menu = await Menu.create(req.body);
  res.status(201).send(menu);
};


  // app.js
const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/user');
const restaurantRoutes = require('./routes/restaurant');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/order');

const app = express();
app.use(bodyParser.json());

app.use('/users', userRoutes);
app.use('/restaurants', restaurantRoutes);
app.use('/menus', menuRoutes);
app.use('/orders', orderRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

  
