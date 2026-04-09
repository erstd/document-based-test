"""
Document Skill - 文档格式定义
定义测试规格文档的格式模板
"""

DOCUMENT_TEMPLATE = '''# {module_name} 测试规格文档

## 模块概述

- **模块路径**: `{module_path}`
- **功能描述**: {overview}
- **依赖模块**: {dependencies}

## 函数规格

{function_specs}

## 测试场景矩阵

| 用例名称 | 场景类型 | 描述 | 输入 | 预期结果 |
|----------|----------|------|------|----------|
{test_matrix}

## 边界条件汇总

{boundary_summary}

## 异常场景汇总

{error_summary}
'''

FUNCTION_SPEC_TEMPLATE = '''### {func_name}

**签名**: `{signature}`

**参数说明**:
| 参数名 | 类型 | 业务含义 | 验证规则 | 默认值 |
|--------|------|----------|----------|--------|
{param_table}

**返回值**: {return_type} - {return_business_meaning}

**正常路径**:
{normal_paths}

**边界条件**:
{boundary_cases}

**异常场景**:
{error_cases}

**验证规则**:
{validation_rules}
'''

PARAM_TABLE_ROW = '| {name} | {type} | {meaning} | {rules} | {default} |'
