---
description: AdminPage 測試案例
---

> 狀態：初始為 [ ]、完成為 [x]
> 注意：狀態只能在測試通過後由流程更新。
> 測試類型：前端元素、function 邏輯、Mock API、驗證權限...

---

## [x] 【前端元素】渲染管理員頁面
**範例輸入**：無
**期待輸出**：畫面應顯示返回連結「← 返回」、標題「🛠️ 管理後台」、角色 Badge、登出按鈕及管理員專屬資訊區塊。

---

## [x] 【前端元素】根據角色顯示不同 Badge
**範例輸入**：Context 提供 user 的 role 分別為 `admin` 與 `user`
**期待輸出**：當為 `admin` 時 Badge 顯示「管理員」，當為 `user` 時顯示「一般用戶」。

---

## [x] 【function 邏輯】點擊登出按鈕
**範例輸入**：點擊「登出」按鈕
**期待輸出**：應呼叫 Context 的 `logout()`，並使用 `navigate('/login', { replace: true, state: null })` 跳轉至登入頁。
