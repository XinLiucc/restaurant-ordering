// middleware/validation.js - 数据验证中间件
const Joi = require('joi');
const { validationError } = require('../utils/response');

/**
 * 通用验证中间件
 * @param {Object} schema - Joi验证模式
 * @param {string} source - 验证数据源 ('body', 'query', 'params')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // 显示所有错误
      allowUnknown: false, // 不允许未知字段
      stripUnknown: true // 移除未知字段
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
        value: detail.context.value
      }));

      return validationError(res, details, '数据验证失败');
    }

    // 将验证后的数据替换原数据
    req[source] = value;
    next();
  };
};

// ===== 分类验证模式 =====

/**
 * 创建分类验证
 */
const createCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': '分类名称不能为空',
      'string.min': '分类名称至少1个字符',
      'string.max': '分类名称不能超过50个字符',
      'any.required': '分类名称是必填项'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': '分类描述不能超过500个字符'
    }),
  sortOrder: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base': '排序必须是数字',
      'number.integer': '排序必须是整数',
      'number.min': '排序不能小于0'
    })
});

/**
 * 更新分类验证
 */
const updateCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.empty': '分类名称不能为空',
      'string.min': '分类名称至少1个字符',
      'string.max': '分类名称不能超过50个字符'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': '分类描述不能超过500个字符'
    }),
  sortOrder: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '排序必须是数字',
      'number.integer': '排序必须是整数',
      'number.min': '排序不能小于0'
    }),
  status: Joi.string()
    .valid('active', 'inactive')
    .optional()
    .messages({
      'any.only': '状态必须是 active 或 inactive'
    })
});

// ===== 菜品验证模式 =====

/**
 * 创建菜品验证
 */
const createDishSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': '菜品名称不能为空',
      'string.min': '菜品名称至少1个字符',
      'string.max': '菜品名称不能超过100个字符',
      'any.required': '菜品名称是必填项'
    }),
  description: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': '菜品描述不能超过1000个字符'
    }),
  price: Joi.number()
    .positive()
    .precision(2)
    .max(9999.99)
    .required()
    .messages({
      'number.base': '价格必须是数字',
      'number.positive': '价格必须大于0',
      'number.precision': '价格最多保留2位小数',
      'number.max': '价格不能超过9999.99',
      'any.required': '价格是必填项'
    }),
  categoryId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': '分类ID必须是数字',
      'number.integer': '分类ID必须是整数',
      'number.positive': '分类ID必须大于0',
      'any.required': '分类ID是必填项'
    }),
  image: Joi.string()
    .trim()
    .uri({ allowRelative: true })
    .allow('')
    .optional()
    .messages({
      'string.uri': '图片URL格式不正确'
    }),
  tags: Joi.array()
    .items(Joi.string().trim().max(20))
    .max(10)
    .default([])
    .messages({
      'array.base': '标签必须是数组',
      'array.max': '标签最多10个',
      'string.max': '单个标签不能超过20个字符'
    }),
  sortOrder: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base': '排序必须是数字',
      'number.integer': '排序必须是整数',
      'number.min': '排序不能小于0'
    })
});

/**
 * 更新菜品验证
 */
const updateDishSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': '菜品名称不能为空',
      'string.min': '菜品名称至少1个字符',
      'string.max': '菜品名称不能超过100个字符'
    }),
  description: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': '菜品描述不能超过1000个字符'
    }),
  price: Joi.number()
    .positive()
    .precision(2)
    .max(9999.99)
    .optional()
    .messages({
      'number.base': '价格必须是数字',
      'number.positive': '价格必须大于0',
      'number.precision': '价格最多保留2位小数',
      'number.max': '价格不能超过9999.99'
    }),
  categoryId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': '分类ID必须是数字',
      'number.integer': '分类ID必须是整数',
      'number.positive': '分类ID必须大于0'
    }),
  image: Joi.string()
    .trim()
    .uri({ allowRelative: true })
    .allow('')
    .optional()
    .messages({
      'string.uri': '图片URL格式不正确'
    }),
  tags: Joi.array()
    .items(Joi.string().trim().max(20))
    .max(10)
    .optional()
    .messages({
      'array.base': '标签必须是数组',
      'array.max': '标签最多10个',
      'string.max': '单个标签不能超过20个字符'
    }),
  sortOrder: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '排序必须是数字',
      'number.integer': '排序必须是整数',
      'number.min': '排序不能小于0'
    }),
  status: Joi.string()
    .valid('available', 'unavailable')
    .optional()
    .messages({
      'any.only': '状态必须是 available 或 unavailable'
    })
});

/**
 * 批量更新状态验证
 */
const batchUpdateStatusSchema = Joi.object({
  dishIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .messages({
      'array.base': '菜品ID列表必须是数组',
      'array.min': '至少选择一个菜品',
      'any.required': '菜品ID列表是必填项'
    }),
  status: Joi.string()
    .valid('available', 'unavailable')
    .required()
    .messages({
      'any.only': '状态必须是 available 或 unavailable',
      'any.required': '状态是必填项'
    })
});

// ===== 查询参数验证 =====

/**
 * 分页查询验证
 */
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': '页码必须是数字',
      'number.integer': '页码必须是整数',
      'number.min': '页码必须大于0'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': '每页数量必须是数字',
      'number.integer': '每页数量必须是整数',
      'number.min': '每页数量必须大于0',
      'number.max': '每页数量不能超过100'
    }),
  search: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .optional()
    .messages({
      'string.max': '搜索关键词不能超过100个字符'
    }),
  categoryId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': '分类ID必须是数字',
      'number.integer': '分类ID必须是整数',
      'number.positive': '分类ID必须大于0'
    }),
  status: Joi.string()
    .valid('active', 'inactive', 'available', 'unavailable')
    .optional(),
  sortBy: Joi.string()
    .valid('name', 'price', 'sortOrder', 'createdAt')
    .default('sortOrder')
    .optional(),
  sortOrder: Joi.string()
    .valid('ASC', 'DESC', 'asc', 'desc')
    .default('ASC')
    .optional()
});

/**
 * ID参数验证
 */
const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID必须是数字',
      'number.integer': 'ID必须是整数',
      'number.positive': 'ID必须大于0',
      'any.required': 'ID是必填项'
    })
});

// ===== 导出验证中间件 =====

module.exports = {
  // 通用验证函数
  validate,
  
  // 分类验证
  validateCreateCategory: validate(createCategorySchema),
  validateUpdateCategory: validate(updateCategorySchema),
  
  // 菜品验证
  validateCreateDish: validate(createDishSchema),
  validateUpdateDish: validate(updateDishSchema),
  validateBatchUpdateStatus: validate(batchUpdateStatusSchema),
  
  // 查询验证
  validatePagination: validate(paginationSchema, 'query'),
  validateIdParam: validate(idParamSchema, 'params'),
  
  // 验证模式（供其他地方使用）
  schemas: {
    createCategorySchema,
    updateCategorySchema,
    createDishSchema,
    updateDishSchema,
    batchUpdateStatusSchema,
    paginationSchema,
    idParamSchema
  }
};