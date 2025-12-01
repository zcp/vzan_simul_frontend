# LiveView 页面追加「自定义 Tab」与「直播间留言」功能提示词

## 角色与目标（在原有 LiveView 重构基础上的增量改造）

你仍然是一名资深前端重构工程师，**精通 Element Plus**，现在需要在已经完成的 `LiveView` Element Plus 版 UI 基础上，**增量接入两个新模块**：

- **直播间 Tab 配置展示模块**（前端只做展示与切换，不实现后台管理）
- **直播间留言模块**（观众与管理员留言展示与发送）

后端的功能与接口规范请严格参考：《直播核心功能设计文档 V3 - 增加 Tab 和留言》（学院派架构版）。

**重要约束**：

- **禁止改动现有业务逻辑的核心流程**（房间与场次加载、播放逻辑、回放逻辑、鉴权逻辑等）。
- 允许在 `<script setup>` 内**追加必要的状态与 API 调用**来支撑 Tab 与留言功能，但不得重写已有请求/Store。
- 所有 UI 元素仍然必须使用 **Element Plus 组件** 构建，保持与 `@LiveView页面代码生成提示词.md` 一致的视觉与代码风格。

---

## 一、功能一：直播间 Tab 配置展示

### 1. 功能目标

- 从后端的房间详情接口中读取 `tabs` 数组字段，并在 **左侧主内容区的视频下方**，使用 Element Plus 的 `<el-tabs>` 和 `<el-tab-pane>` 展示多 Tab 内容。
- Tab 内容来源于后端的 `live_room_tabs` 表，通过房间详情接口 `GET /api/v1/rooms/{room_id}` 增量返回的 `tabs` 字段。
- 典型 Tab 类型：
  - `tab_key = "room"` → 直播间简介
  - `tab_key = "doctor"` → 医生/讲者简介
  - 其他自定义 Tab

### 2. 数据结构与绑定

**假设后端返回结构（节选）**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "room_uuid",
    "title": "新产品发布会直播",
    "description": "房间简介...",
    "tabs": [
      {
        "id": "tab_uuid_1",
        "tab_key": "room",
        "title": "直播间简介",
        "content_type": "text",  // text | image | mixed
        "text_content": "图文介绍...",
        "image_url": null,
        "sort_order": 0,
        "is_active": true
      }
    ]
  }
}
```

在 `LiveView.vue` 中：

- **新增计算属性**：
  - `roomTabs`: 从 `roomDetail.value?.tabs` 派生，按 `sort_order` 排序，只保留 `is_active === true` 的 Tab。
  - `activeTabKey`: 当前选中的 Tab key，类型为 `string`，默认优先选中：
    1. 有 `tab_key === 'room'` 的话选它；
    2. 否则选数组第一个 Tab 的 `tab_key`；
    3. 若无 Tab，则回退到现有的“直播介绍”固定 Tab。

- **Tab 内容渲染规则**（按 `content_type`）：
  - `text`：使用 `<el-scrollbar>` + `<el-text>`/`<p>` 显示 `text_content`，支持基础排版；
  - `image`：使用 `<el-image>` 显示 `image_url`；
  - `mixed`：上方 `<el-text>` 显示 `title` + `text_content`，下方 `<el-image>` 显示 `image_url`；
  - 对 `text_content` 中可能存在的换行，使用 `white-space: pre-wrap` 或简单分段显示。

### 3. UI 结构集成（在原有功能页签区域上“升级”）

在原提示词中已有的 **功能页签区域 (Function Tabs)** 基础上，做如下增量改造：

1. 仍然使用 `<el-tabs>` 作为统一的 Tab 容器；
2. 将“直播介绍”“病例介绍”“返回主会场”等视为**基础内置 Tab**；
3. 在内置 Tab 之前或之间，**动态注入来自后端的 `roomTabs`**：

```vue
<el-tabs v-model="activeTabKey" @tab-click="handleRoomTabClick">
  <!-- 动态 Tabs（来自后端） -->
  <el-tab-pane
    v-for="tab in roomTabs"
    :key="tab.tab_key"
    :name="tab.tab_key"
    :label="tab.title"
  >
    <!-- 根据 content_type 渲染不同内容 -->
  </el-tab-pane>

  <!-- 内置固定 Tab：直播介绍 / 病例介绍 / 返回主会场等 -->
  <el-tab-pane label="直播介绍" name="builtin-intro">
    <!-- 如果没有后端 Tab，则复用原有 roomDetail.description 显示 -->
  </el-tab-pane>
  <el-tab-pane label="病例介绍" name="builtin-case">
    <!-- 保持占位内容逻辑不变 -->
  </el-tab-pane>
  <el-tab-pane label="返回主会场" name="builtin-back-main">
    <el-button type="primary" link @click="goToVenuePage">返回主会场</el-button>
  </el-tab-pane>
</el-tabs>
```

### 4. 逻辑绑定与事件

- **数据来源**：继续沿用现有 `getRoomDetail(room_id)` 请求，确保后端已在响应中追加 `tabs` 字段；
- **计算属性/状态**：
  - `const activeTabKey = ref<string>('builtin-intro')`；
  - `const roomTabs = computed(() => normalizeTabs(roomDetail.value?.tabs || []))`；
- **事件处理**：
  - `handleRoomTabClick`：仅用于记录当前激活 Tab，不新增业务逻辑；
- **兜底策略**：
  - 当 `roomTabs.length === 0` 时，整个 `<el-tabs>` 行为退化为原来的“固定三页签”结构，保证向后兼容。

---

## 二、功能二：直播间留言模块（观众 & 管理员）

### 1. 功能目标

- 在 **右侧聊天互动区** 基础上，将当前的“静态 mock 评论列表”替换/增强为：
  - 自后端接口获取的分页留言列表；
  - 支持观众发送留言；
  - 支持基础校验并与后端的权限/规则对齐：
    - 普通用户不允许发送 URL；
    - 管理员可以发送任意文本；
- 前端只负责：
  - 调用后台留言 API；
  - 展示列表与发送结果；
  - 不实现消息撤回、删除、审核等高级功能（可预留按钮 + `ElMessage.info` 占位）。
### 2. 后端接口约束（需遵守文档 V3.3）

基于设计文档中的 API：

- 发送留言：
  - `POST /api/v1/rooms/{room_id}/messages`
  - 请求体：`{ "content": "医生讲得很好 👍" }`
  - 权限：所有登录用户 (`REGULAR` 及以上)
  - 若普通用户发送 URL，后端会返回 `code = 4004` 的错误
- 获取留言列表（按直播间）：
  - `GET /api/v1/rooms/{room_id}/messages`
  - Query：`page`, `size`, `since`
  - 权限：所有登录用户 (`REGULAR` 及以上)

### 3. `<script setup>` 中需要新增的状态与方法（说明性提示）

在不破坏现有逻辑的前提下，可增量添加以下响应式状态与方法：

- **状态**：
  - `const messages = ref<LiveRoomMessage[]>([])`：留言列表；
  - `const messageLoading = ref(false)`：留言加载状态；
  - `const messageInput = ref('')`：当前输入框内容；
  - `const messagePage = ref(1)` / `const messagePageSize = ref(20)`；
  - `const hasMoreMessages = ref(true)`：是否还有更多；

- **类型（可选声明）**：

```ts
interface LiveRoomMessage {
  id: string;
  room_id: string;
  session_id?: string | null;
  user_id: string;
  user_role: 'REGULAR' | 'MODERATOR' | 'ADMIN' | 'SUPERADMIN';
  content: string;
  created_at: string;
}
```

- **方法**：
  - `async function fetchRoomMessages(initial = false)`：
    - 读取当前房间 ID（优先使用 `currentSession.value?.room_id`）；
    - 调用 `GET /api/v1/rooms/{room_id}/messages`；
    - 初次加载时重置 `messages`；分页加载时在末尾追加；
    - 依据返回的总数或返回条数判断 `hasMoreMessages`。
  - `async function sendMessage()`：
    - 本地校验：`messageInput.value.trim()` 非空；
    - 可选：简单防 URL 校验（仅作为 UX 提示，最终仍以后端校验为准）；
    - 调用 `POST /api/v1/rooms/{room_id}/messages`；
    - 成功后清空输入框，并将新消息插入到 `messages` 列表顶部或重新加载当前页；
    - 出错时根据 `code` 显示不同的 `ElMessage.error` 文案：
      - `4004` → "普通用户不允许发送包含 URL 的留言"；
      - 其他 → "留言发送失败，请稍后重试"。

- **生命周期集成**：
  - 在现有 `onLoad` / `onMounted` 中，当 `currentSession` 与 `roomDetail` 就绪、且拿到 `room_id` 后，调用 `fetchRoomMessages(true)` 初始化留言列表。
  - 监听房间切换时重置留言状态。

### 4. 聊天 UI 升级（Element Plus 组件结构）

基于现有 `@LiveView页面代码生成提示词.md` 中的 **右侧聊天互动区 (Chat Sidebar)**，对 UI 做以下增强：

1. **管理员欢迎消息**：保持原有静态欢迎词逻辑不变，可与真实留言列表分区展示；
2. **留言列表区**：

```vue
<div class="user-messages">
  <el-scrollbar style="max-height: 320px;">
    <div
      v-for="msg in messages"
      :key="msg.id"
      class="message-item"
    >
      <el-avatar class="user-avatar" size="small">
        {{ computeMessageAvatarText(msg) }}
      </el-avatar>
      <div class="message-main">
        <div class="message-header">
          <span class="user-name">{{ computeMessageUserName(msg) }}</span>
          <!-- 使用辅助函数判定是否显示管理员标签 -->
          <el-tag v-if="isAdminRole(msg.user_role)" size="small" type="success">
            管理员
          </el-tag>
          <span class="message-time">{{ formatTime(msg.created_at) }}</span>
        </div>
        <div class="message-text">{{ msg.content }}</div>
      </div>
    </div>

    <div v-if="hasMoreMessages" class="load-more">
      <el-button text size="small" @click="fetchRoomMessages(false)">
        加载更多留言
      </el-button>
    </div>
  </el-scrollbar>
</div>
```

3. **输入区与发送按钮**：

```vue
<div class="chat-input-area">
  <div class="input-with-icons">
    <div class="input-icons">
      <el-button link size="small" @click="() => ElMessage.info('表情功能待开发')">🙂</el-button>
      <el-button link size="small" @click="() => ElMessage.info('收藏功能待开发')">⭐</el-button>
    </div>
    <el-input
      v-model="messageInput"
      placeholder="说点什么~"
      @keyup.enter="sendMessage"
    />
  </div>
  <el-button type="primary" size="small" @click="sendMessage">发送</el-button>
</div>
```

4. **错误与加载状态反馈**：

- 加载留言时在列表上方或替换区域显示 `ElSkeleton` 或简单的 "留言加载中..." 文案；
- 发送中可通过 `sending` 状态禁用按钮并显示加载动画。

### 5. 样式补充

在原有 `.chat-sidebar` 样式基础上增量添加：

```scss
.chat-sidebar {
  .user-messages {
    .message-item {
      display: flex;
      margin-bottom: 12px;

      .message-main {
        flex: 1;
      }

      .message-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .message-time {
        margin-left: auto;
        font-size: 12px;
        color: #909399;
      }
    }

    .load-more {
      text-align: center;
      margin-top: 8px;
    }
  }
}
```

---

## 三、实现优先级与占位策略（针对新模块）

### 1. P0（必须实现）

- 从房间详情中读取并展示 `tabs`，至少支持 `text` 类型；
- 从后端读取留言列表并展示；
- 支持发送文本留言，并处理后端 `4004` 错误码。

### 2. P1（重要增强）

- 完整支持 `content_type = 'image' | 'mixed'` 的 Tab 展示；
- 留言“加载更多”分页；
- 对发送频率做简单限制（例如按钮冷却）。

### 3. P2（体验优化）

- 留言区域滚动到底部自动显示最新消息；
- @管理员等高亮显示；
- 表情选择面板（占位）。

### 4. 占位与兼容策略

- 若后端暂未接好 `tabs` 或 `messages` 接口：
  - Tab 区域自动回退到原有固定的 `el-tab-pane` 结构；
  - 留言区域继续使用原有的 `mockComments` 作为静态展示，发送按钮点击时提示 `ElMessage.info('留言功能待接入后台，敬请期待')`。
- 整个页面在接口未就绪时也能正常渲染和访问，确保对当前线上版本完全**后向兼容**。

---

请在生成新的 `src/pages/live/new/LiveView.vue` 代码时：

1. 继续遵循 `@LiveView页面代码生成提示词.md` 中的所有通用规范与布局要求；
2. 在此基础上，**增量**实现上述 Tab 展示与留言模块；
3. 所有新增逻辑需与后端《直播核心功能设计文档 V3 - 增加 Tab 和留言》保持字段名与接口路径一致；
4. 不修改原有播放逻辑与 `playback_url` 相关实现，仅在 UI 与数据结构上追加新能力。