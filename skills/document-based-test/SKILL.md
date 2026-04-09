---
name: document-based-test
description: 基于文档驱动的自动化测试方法，先阅读代码生成测试文档，再根据文档和代码生成测试用例，迭代修复直到通过
---

# document-based-test

基于文档驱动的自动化测试方法。文档格式定义在 `document_format.py` 中。

## 核心流程

```
阅读源码 → 生成测试规格文档 → 根据文档 + 源码生成测试代码 → 运行测试，迭代修复
```

1. 阅读源码，理解业务逻辑，生成一套针对后端和前端的详细测试
2. 按 `document_format.py` 中的格式生成测试文档，保存到 `tests/test_docs/{module}_test_spec.md`
3. 根据文档和源码生成 pytest 测试代码，保存到 `tests/test_{module}.py`
4. 运行测试，若失败则分析错误，对代码进行修复并按照`ITERATION_LOG_TEMPLATE.md`中的格式生成修复日志文档，并重复测试直到通过， 最终按照`TEST_REPORT_TEMPLATE`中格式生成一份总结报告文档。

## 触发方式

`/document-skill` 或 `Skill("document-skill")`

## 输出

- 测试文档: `tests/test_docs/{module}_test_spec.md`
- 测试代码: `tests/test_{module}.py`
- 修复日志文档：`tests/log.md`
- 总结报告: `tests/TEST_REPORT.md`

## 前端测试

使用 Playwright 进行前端页面测试（测试脚本来自scripts文件夹）


### 常用交互

| Action | 说明 | 示例 |
|--------|------|------|
| click | 点击元素 | `click "button#submit"` |
| type | 输入文本 | `type "input[name=q]" "search text"` |
| wait | 等待元素 | `wait ".loading" 5000` |
| screenshot | 截图 | `screenshot "result.png"` |
| exists | 检查元素存在 | `exists ".modal"` |
| assert | 断言属性 | `assert ".error" text "Not found"` |


