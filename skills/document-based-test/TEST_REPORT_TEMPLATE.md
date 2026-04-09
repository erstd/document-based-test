# {module_name} 测试报告

## 测试基本信息

- **模块名称**: {module_name}
- **测试时间**: {test_date}
- **测试人员**: {tester}
- **测试环境**: {environment}

## 测试执行摘要

| 指标 | 数值 |
|------|------|
| 总用例数 | {total_cases} |
| 通过数 | {passed_cases} |
| 失败数 | {failed_cases} |
| 跳过数 | {skipped_cases} |
| 通过率 | {pass_rate} |

## 测试结果详情

### 通过的测试用例

| 用例 ID | 用例名称 | 执行时间 | 说明 |
|---------|----------|----------|------|
{passed_cases_table}

### 失败的测试用例

| 用例 ID | 用例名称 | 失败原因 | 错误详情 |
|---------|----------|----------|----------|
{failed_cases_table}

### 跳过的测试用例

| 用例 ID | 用例名称 | 跳过原因 |
|---------|----------|----------|
{skipped_cases_table}

## 问题汇总

### 高优先级问题

{high_priority_issues}

### 中优先级问题

{medium_priority_issues}

### 低优先级问题

{low_priority_issues}

## 测试覆盖率

- **代码覆盖率**: {code_coverage}%
- **分支覆盖率**: {branch_coverage}%
- **函数覆盖率**: {function_coverage}%

## 测试结论

{conclusion}

## 后续建议

{recommendations}

---

*报告生成时间: {report_generation_time}*
