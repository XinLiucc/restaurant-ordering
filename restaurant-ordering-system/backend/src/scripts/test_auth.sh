#!/bin/bash

echo "🧪 餐厅点餐系统认证测试"
echo "========================="

BASE_URL="http://localhost:3000/api"

# 清理之前的cookie
rm -f *.txt

echo ""
echo "1️⃣ 测试健康检查"
curl -s "$BASE_URL/health" | jq '.'

echo ""
echo "2️⃣ 测试未登录访问受保护资源（应该返回401）"
curl -s "$BASE_URL/auth/profile" | jq '.'

echo ""
echo "3️⃣ 测试管理员登录"
curl -s -X POST "$BASE_URL/auth/admin-login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c admin_cookies.txt | jq '.'

echo ""
echo "4️⃣ 测试管理员获取个人信息"
curl -s "$BASE_URL/auth/profile" -b admin_cookies.txt | jq '.'

echo ""
echo "5️⃣ 测试管理员访问管理功能（创建分类）"
curl -s -X POST "$BASE_URL/categories" \
  -H "Content-Type: application/json" \
  -d '{"name":"测试分类","description":"这是一个测试分类"}' \
  -b admin_cookies.txt | jq '.'

echo ""
echo "6️⃣ 测试模拟微信用户登录（开发环境）"
curl -s -X POST "$BASE_URL/auth/mock-wechat-login" \
  -H "Content-Type: application/json" \
  -d '{"nickName":"张三","avatar":"http://example.com/avatar.jpg"}' \
  -c user_cookies.txt | jq '.'

echo ""
echo "7️⃣ 测试微信用户获取个人信息"
curl -s "$BASE_URL/auth/profile" -b user_cookies.txt | jq '.'

echo ""
echo "8️⃣ 测试微信用户访问管理功能（应该返回403）"
curl -s -X POST "$BASE_URL/categories" \
  -H "Content-Type: application/json" \
  -d '{"name":"用户尝试创建分类"}' \
  -b user_cookies.txt | jq '.'

echo ""
echo "9️⃣ 测试用户可以访问的功能（查看菜品）"
curl -s "$BASE_URL/dishes" -b user_cookies.txt | jq '.'

echo ""
echo "🔟 测试退出登录"
curl -s -X POST "$BASE_URL/auth/logout" -b admin_cookies.txt | jq '.'

echo ""
echo "1️⃣1️⃣ 测试退出后访问受保护资源（应该返回401）"
curl -s "$BASE_URL/auth/profile" -b admin_cookies.txt | jq '.'

echo ""
echo "✅ 测试完成！"

# 清理cookie文件
rm -f *.txt