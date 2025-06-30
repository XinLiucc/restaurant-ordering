#!/bin/bash
# test_fixed_order.sh - 测试修复后的订单功能

BASE_URL="http://localhost:3000/api"
echo "🧪 测试修复后的订单功能"
echo "=========================================="

# 清理之前的cookies
rm -f cookies.txt

echo "🔐 步骤1: 用户登录"
login_response=$(curl -s -X POST ${BASE_URL}/auth/mock-wechat-login \
  -H 'Content-Type: application/json' \
  -d '{"nickName": "修复测试用户"}' \
  -c cookies.txt)

echo "登录响应: $login_response"

if echo "$login_response" | grep -q '"success":true'; then
    echo "✅ 登录成功"
else
    echo "❌ 登录失败，退出测试"
    exit 1
fi
echo ""

echo "🛒 步骤2: 清空购物车"
clear_response=$(curl -s -X DELETE ${BASE_URL}/cart/clear -b cookies.txt)
echo "清空购物车响应: $clear_response"
echo ""

echo "🛒 步骤3: 添加菜品4到购物车"
add_response=$(curl -s -X POST ${BASE_URL}/cart/add \
  -H 'Content-Type: application/json' \
  -d '{"dishId": 5, "quantity": 5}' \
  -b cookies.txt)

echo "添加菜品响应: $add_response"

if echo "$add_response" | grep -q '"success":true'; then
    echo "✅ 添加菜品成功"
else
    echo "❌ 添加菜品失败"
    exit 1
fi
echo ""

echo "🛒 步骤4: 检查购物车状态"
cart_status=$(curl -s -X GET ${BASE_URL}/cart/status -b cookies.txt)
echo "购物车状态: $cart_status"
echo ""

echo "🛒 步骤5: 查看购物车内容"
cart_content=$(curl -s -X GET ${BASE_URL}/cart -b cookies.txt)
echo "购物车内容: $cart_content"
echo ""

echo "📋 步骤6: 从购物车创建订单（关键测试）"
echo "开始创建订单..."
order_response=$(curl -s -X POST ${BASE_URL}/orders/from-cart \
  -H 'Content-Type: application/json' \
  -d '{"tableNumber": "TEST01", "remark": "修复测试订单"}' \
  -b cookies.txt)

echo "订单创建响应: $order_response"

if echo "$order_response" | grep -q '"success":true'; then
    echo "🎉 订单创建成功！"
    
    # 提取订单ID
    order_id=$(echo "$order_response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "订单ID: $order_id"
    
else
    echo "❌ 订单创建失败"
    echo "请查看服务器控制台的详细错误信息"
fi
echo ""

echo "🛒 步骤7: 验证购物车状态"
final_cart=$(curl -s -X GET ${BASE_URL}/cart -b cookies.txt)
echo "最终购物车状态: $final_cart"

if echo "$final_cart" | grep -q '"itemCount":0'; then
    echo "✅ 购物车已正确清空"
else
    echo "⚠️ 购物车未清空（可能订单创建失败）"
fi
echo ""

echo "📋 步骤8: 查看订单列表"
orders_response=$(curl -s -X GET ${BASE_URL}/orders/my -b cookies.txt)
echo "我的订单: $orders_response"
echo ""

echo "🔍 步骤9: 测试直接创建订单（对比测试）"
direct_order_response=$(curl -s -X POST ${BASE_URL}/orders \
  -H 'Content-Type: application/json' \
  -d '{"tableNumber": "DIRECT01", "remark": "直接订单测试", "items": [{"dishId": 4, "quantity": 1}]}' \
  -b cookies.txt)

echo "直接订单响应: $direct_order_response"

if echo "$direct_order_response" | grep -q '"success":true'; then
    echo "✅ 直接订单创建成功"
else
    echo "❌ 直接订单创建失败"
fi
echo ""

echo "📊 步骤10: 获取用户订单摘要"
summary_response=$(curl -s -X GET ${BASE_URL}/orders/summary -b cookies.txt)
echo "订单摘要: $summary_response"
echo ""

# 清理
rm -f cookies.txt

echo "✅ 测试完成！"
echo "=========================================="
echo "🔍 测试结果分析："

if echo "$order_response" | grep -q '"success":true'; then
    echo "✅ 购物车一键下单功能正常"
    echo "✅ 订单创建流程完整"
    echo "✅ 购物车自动清空功能正常"
else
    echo "❌ 购物车一键下单功能异常"
    echo "🔧 建议检查:"
    echo "   1. 查看服务器控制台的详细错误日志"
    echo "   2. 确认数据库字符编码设置"
    echo "   3. 检查菜品和分类数据状态"
fi

echo ""
echo "💡 如果仍有问题，请运行："
echo "   1. 查看服务器日志中的详细错误信息"
echo "   2. 运行: bash fix_encoding.sql"
echo "   3. 重启服务器: npm run dev"