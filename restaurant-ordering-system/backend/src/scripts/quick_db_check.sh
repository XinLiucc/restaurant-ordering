#!/bin/bash
# quick_db_check.sh - 快速检查数据库状态

echo "🔍 快速数据库检查"
echo "=========================================="

echo "1. 检查菜品表数据:"
docker exec -it restaurant_mysql mysql -u root -p restaurant_db -e "
SELECT 
    d.id, 
    d.name, 
    d.status as dish_status, 
    d.category_id, 
    c.name as category_name, 
    c.status as category_status 
FROM dishes d 
LEFT JOIN categories c ON d.category_id = c.id 
ORDER BY d.id 
LIMIT 10;
"

echo ""
echo "2. 检查分类表数据:"
docker exec -it restaurant_mysql mysql -u root -p restaurant_db -e "
SELECT id, name, status, sort_order 
FROM categories 
ORDER BY sort_order;
"

echo ""
echo "3. 专门检查菜品ID 4:"
docker exec -it restaurant_mysql mysql -u root -p restaurant_db -e "
SELECT 
    d.*, 
    c.name as category_name, 
    c.status as category_status 
FROM dishes d 
LEFT JOIN categories c ON d.category_id = c.id 
WHERE d.id = 4;
"

echo ""
echo "4. 检查可用菜品数量:"
docker exec -it restaurant_mysql mysql -u root -p restaurant_db -e "
SELECT 
    COUNT(*) as total_dishes,
    SUM(CASE WHEN d.status = 'available' THEN 1 ELSE 0 END) as available_dishes,
    SUM(CASE WHEN c.status = 'active' THEN 1 ELSE 0 END) as active_categories
FROM dishes d 
LEFT JOIN categories c ON d.category_id = c.id;
"

echo ""
echo "5. 检查表结构是否正确:"
docker exec -it restaurant_mysql mysql -u root -p restaurant_db -e "DESCRIBE dishes;"

echo ""
echo "6. 检查外键约束:"
docker exec -it restaurant_mysql mysql -u root -p restaurant_db -e "
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'restaurant_db' 
AND REFERENCED_TABLE_NAME IS NOT NULL;
"