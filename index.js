const { Sequelize } = require('sequelize');

// 从环境变量获取数据库配置
const DB_URL = process.env.DATABASE_URL;

let sequelize;
// 始终定义默认空模型，确保即使数据库连接失败也能正常导出
const defaultModels = {
  User: {
    findByPk: async () => null,
    findOne: async () => null,
    findAll: async () => []
  },
  Transaction: {
    findByPk: async () => null,
    findOne: async () => null,
    findAll: async () => []
  },
  Announcement: {
    findByPk: async () => null,
    findOne: async () => null,
    findAll: async () => []
  }
};

let db = {
  Sequelize: Sequelize,
  sequelize: null,
  ...defaultModels
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
    try {
      const UserModel = require('./user')(sequelize, Sequelize);
      const TransactionModel = require('./transaction')(sequelize, Sequelize);
      const AnnouncementModel = require('./announcement')(sequelize, Sequelize);
      
      // 替换默认空模型
      db.User = UserModel;
      db.Transaction = TransactionModel;
      db.Announcement = AnnouncementModel;
      
      // 定义关联关系
      // 用户与交易记录
      db.User.hasMany(db.Transaction, { foreignKey: 'userId', as: 'transactions' });
      db.Transaction.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
      
      // 用户与推荐人
      db.User.belongsTo(db.User, { foreignKey: 'referrerId', as: 'referrer' });
      db.User.hasMany(db.User, { foreignKey: 'referrerId', as: 'referrals' });
    } catch (modelError) {
      console.error('模型初始化失败:', modelError);
      // 保持默认空模型
    }
  }
} catch (error) {
  console.error('数据库初始化失败:', error);
  // 保持默认空模型
}

// 确保所有模型属性都存在
Object.keys(defaultModels).forEach(modelName => {
  if (!db[modelName]) {
    db[modelName] = defaultModels[modelName];
  }
});

module.exports = db;
