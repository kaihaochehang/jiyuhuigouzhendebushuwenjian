module.exports = (sequelize, DataTypes) => {
  const Announcement = sequelize.define('Announcement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '公告标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '公告内容'
    },
    platform: {
      type: DataTypes.STRING(50),
      defaultValue: '金渔惠购',
      comment: '发布平台'
    },
    publishTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '发布时间'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否有效'
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '优先级（数字越大越优先）'
    }
  }, {
    tableName: 'announcements',
    timestamps: true,
    indexes: [
      { fields: ['isActive'] },
      { fields: ['priority'] }
    ]
  });

  return Announcement;
};
