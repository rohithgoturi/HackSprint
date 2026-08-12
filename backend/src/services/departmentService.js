const Department = require('../models/Department');

const CATEGORY_DEPARTMENT_MAP = {
  road_infrastructure: {
    name: 'Roads Department',
    code: 'ROADS'
  },
  garbage_sanitation: {
    name: 'Sanitation Department',
    code: 'SANITATION'
  },
  streetlight_electrical: {
    name: 'Electrical Department',
    code: 'ELECTRICAL'
  },
  water_supply: {
    name: 'Water Supply Department',
    code: 'WATER'
  },
  drainage: {
    name: 'Drainage Department',
    code: 'DRAINAGE'
  },
  fallen_tree: {
    name: 'Parks / Disaster Management',
    code: 'PARKS_DISASTER'
  },
  public_infrastructure: {
    name: 'Public Works Department',
    code: 'PUBLIC_WORKS'
  },
  other: {
    name: 'General Civic Services',
    code: 'GENERAL'
  }
};

/**
 * Deterministically get or create department document based on issue category
 * @param {string} category Category string
 * @returns {Promise<Document>} Mongoose Department document
 */
const getDepartmentForCategory = async (category) => {
  const normCategory = (category || 'other').toLowerCase().trim();
  const deptInfo = CATEGORY_DEPARTMENT_MAP[normCategory] || CATEGORY_DEPARTMENT_MAP.other;
  const targetCategory = CATEGORY_DEPARTMENT_MAP[normCategory] ? normCategory : 'other';

  const department = await Department.findOneAndUpdate(
    { category: targetCategory },
    {
      name: deptInfo.name,
      code: deptInfo.code,
      category: targetCategory
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return department;
};

module.exports = {
  getDepartmentForCategory,
  CATEGORY_DEPARTMENT_MAP
};
