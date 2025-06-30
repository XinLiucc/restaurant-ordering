// controllers/cart.js - 购物车控制器
const { Dish, Category } = require('../models');
const { success, error, created, notFound } = require('../utils/response');
const { CustomError, asyncHandler } = require('../middleware/error');

/**
 * 购物车控制器
 * 使用Session存储购物车数据（简单实现）
 */
class CartController {
  /**
   * 获取购物车
   */
  getCart = asyncHandler(async (req, res) => {
    const userId = req.session.user?.id;
    
    if (!userId) {
      return error(res, '请先登录', 401, 'UNAUTHORIZED');
    }

    try {
      // 从Session获取购物车数据
      const cart = req.session.cart || { items: [], total: 0, itemCount: 0 };

      // 验证购物车中的菜品是否还有效
      if (cart.items && cart.items.length > 0) {
        const dishIds = cart.items.map(item => item.dishId);
        const availableDishes = await Dish.findAll({
          where: { 
            id: dishIds,
            status: 'available' 
          },
          include: [{
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
            where: { status: 'active' }
          }]
        });

        // 更新购物车中的菜品信息和价格
        const validItems = [];
        let newTotal = 0;
        let itemCount = 0;

        cart.items.forEach(cartItem => {
          const dish = availableDishes.find(d => d.id === cartItem.dishId);
          if (dish) {
            const updatedItem = {
              dishId: dish.id,
              dishName: dish.name,
              price: parseFloat(dish.price),
              quantity: cartItem.quantity,
              subtotal: parseFloat(dish.price) * cartItem.quantity,
              image: dish.image,
              category: dish.category
            };
            validItems.push(updatedItem);
            newTotal += updatedItem.subtotal;
            itemCount += updatedItem.quantity;
          }
        });

        // 更新Session中的购物车
        req.session.cart = {
          items: validItems,
          total: parseFloat(newTotal.toFixed(2)),
          itemCount
        };

        return success(res, req.session.cart, '获取购物车成功');
      }

      return success(res, cart, '获取购物车成功');

    } catch (err) {
      console.error('获取购物车失败:', err);
      return error(res, '获取购物车失败', 500);
    }
  });

  /**
   * 添加到购物车
   */
  addToCart = asyncHandler(async (req, res) => {
    const userId = req.session.user?.id;
    const { dishId, quantity = 1 } = req.body;

    if (!userId) {
      return error(res, '请先登录', 401, 'UNAUTHORIZED');
    }

    if (!dishId) {
      return error(res, '菜品ID不能为空', 400, 'MISSING_DISH_ID');
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return error(res, '数量必须是正整数', 400, 'INVALID_QUANTITY');
    }

    if (quantity > 99) {
      return error(res, '单个菜品数量不能超过99', 400, 'QUANTITY_EXCEEDED');
    }

    try {
      // 验证菜品是否存在且可用
      const dish = await Dish.findByPk(dishId, {
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
          where: { status: 'active' }
        }]
      });

      if (!dish) {
        return notFound(res, '菜品不存在');
      }

      if (dish.status !== 'available') {
        return error(res, '该菜品暂不可用', 400, 'DISH_UNAVAILABLE');
      }

      // 获取购物车
      let cart = req.session.cart || { items: [], total: 0, itemCount: 0 };

      // 检查菜品是否已在购物车中
      const existingItemIndex = cart.items.findIndex(item => item.dishId === dishId);

      if (existingItemIndex !== -1) {
        // 更新数量
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        if (newQuantity > 99) {
          return error(res, '单个菜品数量不能超过99', 400, 'QUANTITY_EXCEEDED');
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].subtotal = parseFloat(dish.price) * newQuantity;
      } else {
        // 添加新商品
        const newItem = {
          dishId: dish.id,
          dishName: dish.name,
          price: parseFloat(dish.price),
          quantity: quantity,
          subtotal: parseFloat(dish.price) * quantity,
          image: dish.image,
          category: dish.category
        };
        cart.items.push(newItem);
      }

      // 重新计算总价和数量
      cart.total = parseFloat(cart.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
      cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

      // 保存到Session
      req.session.cart = cart;

      return success(res, {
        cart: cart,
        addedItem: {
          dishId,
          dishName: dish.name,
          quantity
        }
      }, '添加到购物车成功');

    } catch (err) {
      console.error('添加到购物车失败:', err);
      return error(res, '添加到购物车失败', 500);
    }
  });

  /**
   * 更新购物车项
   */
  updateCartItem = asyncHandler(async (req, res) => {
    const userId = req.session.user?.id;
    const { dishId, quantity } = req.body;

    if (!userId) {
      return error(res, '请先登录', 401, 'UNAUTHORIZED');
    }

    if (!dishId) {
      return error(res, '菜品ID不能为空', 400, 'MISSING_DISH_ID');
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return error(res, '数量必须是非负整数', 400, 'INVALID_QUANTITY');
    }

    if (quantity > 99) {
      return error(res, '单个菜品数量不能超过99', 400, 'QUANTITY_EXCEEDED');
    }

    try {
      let cart = req.session.cart || { items: [], total: 0, itemCount: 0 };

      const itemIndex = cart.items.findIndex(item => item.dishId === dishId);

      if (itemIndex === -1) {
        return notFound(res, '购物车中未找到该菜品');
      }

      if (quantity === 0) {
        // 移除商品
        cart.items.splice(itemIndex, 1);
      } else {
        // 更新数量
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].subtotal = cart.items[itemIndex].price * quantity;
      }

      // 重新计算总价和数量
      cart.total = parseFloat(cart.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
      cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

      // 保存到Session
      req.session.cart = cart;

      return success(res, cart, '更新购物车成功');

    } catch (err) {
      console.error('更新购物车失败:', err);
      return error(res, '更新购物车失败', 500);
    }
  });

  /**
   * 移除购物车项
   */
  removeCartItem = asyncHandler(async (req, res) => {
    const userId = req.session.user?.id;
    const { dishId } = req.body;

    if (!userId) {
      return error(res, '请先登录', 401, 'UNAUTHORIZED');
    }

    if (!dishId) {
      return error(res, '菜品ID不能为空', 400, 'MISSING_DISH_ID');
    }

    try {
      let cart = req.session.cart || { items: [], total: 0, itemCount: 0 };

      const itemIndex = cart.items.findIndex(item => item.dishId === dishId);

      if (itemIndex === -1) {
        return notFound(res, '购物车中未找到该菜品');
      }

      const removedItem = cart.items[itemIndex];
      cart.items.splice(itemIndex, 1);

      // 重新计算总价和数量
      cart.total = parseFloat(cart.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
      cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

      // 保存到Session
      req.session.cart = cart;

      return success(res, {
        cart: cart,
        removedItem: {
          dishId: removedItem.dishId,
          dishName: removedItem.dishName
        }
      }, '移除购物车项成功');

    } catch (err) {
      console.error('移除购物车项失败:', err);
      return error(res, '移除购物车项失败', 500);
    }
  });

  /**
   * 清空购物车
   */
  clearCart = asyncHandler(async (req, res) => {
    const userId = req.session.user?.id;

    if (!userId) {
      return error(res, '请先登录', 401, 'UNAUTHORIZED');
    }

    try {
      // 清空购物车
      req.session.cart = { items: [], total: 0, itemCount: 0 };

      return success(res, req.session.cart, '清空购物车成功');

    } catch (err) {
      console.error('清空购物车失败:', err);
      return error(res, '清空购物车失败', 500);
    }
  });

  /**
   * 获取购物车商品数量
   */
  getCartItemCount = asyncHandler(async (req, res) => {
    const userId = req.session.user?.id;

    if (!userId) {
      return error(res, '请先登录', 401, 'UNAUTHORIZED');
    }

    try {
      const cart = req.session.cart || { items: [], total: 0, itemCount: 0 };

      return success(res, {
        itemCount: cart.itemCount,
        total: cart.total
      }, '获取购物车数量成功');

    } catch (err) {
      console.error('获取购物车数量失败:', err);
      return error(res, '获取购物车数量失败', 500);
    }
  });
}

module.exports = new CartController();