const { Sequelize } = require('sequelize');

// 从环境变量获取数据库配置
const DB_URL = process.env.DATABASE_URL;

let sequelize;
let db = {
  Sequelize: Sequelize,
  sequelize: null
};

try {
  if (!DB_URL) {
    console.warn('DATABASE_URL环境变量未设置，数据库功能可能无法使用');
  } else {
    sequelize = new Sequelize(DB_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
    
    db.sequelize = sequelize;
    
    // 导入模型
    db.User = require('./user')(sequelize, Sequelize);
    db.Transaction = require('./transaction')(sequelize, Sequelize);
    db.Announcement = require('./announcement')(sequelize, Sequelize);
    
    // 定义关联关系
    // 用户与交易记录
    db.User.hasMany(db.Transaction, { foreignKey: 'userId', as: 'transactions' });
    db.Transaction.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
    
    // 用户与推荐人
    db.User.belongsTo(db.User, { foreignKey: 'referrerId', as: 'referrer' });
    db.User.hasMany(db.User, { foreignKey: 'referrerId', as: 'referrals' });
  }
} catch (error) {
  console.error('数据库初始化失败:', error);
}

module.exports = db;
