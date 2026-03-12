import type { TObject, TProperties } from '@sinclair/typebox'
import type { Table } from 'drizzle-orm'
import { type BuildSchema, createInsertSchema, createSelectSchema } from 'drizzle-orm/typebox-legacy'

type TableProperties<
  T extends Table,
  Mode extends 'insert' | 'select'
> = BuildSchema<Mode, T['_']['columns'], undefined>['properties']

// 强行展开交叉类型，解决 Elysia 推导失败
type Evaluate<T> = { [K in keyof T]: T[K] } & {}

/**
 * 合并原始属性和自定义的 refine 属性
 * 使用 Evaluate 确保结果是一个干净的键值对，而不是 A & B
 */
type MergeProperties<P extends TProperties, R> = Evaluate<Omit<P, keyof R> & R>

/**
 * 定义单个 Model 的结构：包含平铺字段 + 原始 schema 引用
 */
type ModelWithSchema<P extends TProperties> = P & { schema: TObject<P> }

/**
 * 批量生成所有 Model 的 Insert 和 Select 字段, 以及 schema 对象
 * @param tables
 * @param refines
 */
export const createModel = <
  T extends Record<string, Table>,
  R extends { [K in keyof T]?: Record<string, any> }
>(
  tables: T,
  refines: R = {} as R,
) => {
  const models = {} as Record<string, any>

  for (const key of Object.keys(tables)) {
    const table = tables[key]
    const refine = refines[key] || {}

    // 生成原始的 TypeBox Schema 对象
    const insertSchema = createInsertSchema(table, refine)
    const selectSchema = createSelectSchema(table, refine)

    // 动态生成扁平的 Key，构造包含了 spread 字段和 .schema 属性的对象
    models[`${key}Insert`] = {
      ...insertSchema.properties,
      schema: insertSchema,
    }
    models[`${key}Select`] = {
      ...selectSchema.properties,
      schema: selectSchema,
    }
  }

  // 完善类型推导，利用 TS 模板字面量类型重塑返回类型
  return models as {
    [K in keyof T & string as `${K}Insert`]: ModelWithSchema<
      MergeProperties<TableProperties<T[K], 'insert'>, (K extends keyof R ? R[K] : {})>
    >
  } & {
    [K in keyof T & string as `${K}Select`]: ModelWithSchema<
      MergeProperties<TableProperties<T[K], 'select'>, (K extends keyof R ? R[K] : {})>
    >
  }
}