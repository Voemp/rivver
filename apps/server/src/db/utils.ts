// 类型管道文件：从 Drizzle 表定义生成 TypeBox 模型，此处 any 为刻意的类型体操手段
/* oxlint-disable typescript/no-explicit-any */
import type { TObject, TProperties } from '@sinclair/typebox'
import type { Table } from 'drizzle-orm'

import { type BuildSchema, createSchemaFactory } from 'drizzle-orm/typebox-legacy'
import { t } from 'elysia'

const { createInsertSchema, createSelectSchema } = createSchemaFactory({
  typeboxInstance: t,
})

type TableProperties<T extends Table, Mode extends 'insert' | 'select'> = BuildSchema<
  Mode,
  T['_']['columns'],
  undefined
>['properties']

type Evaluate<T> = { [K in keyof T]: T[K] } & {}

type MergeProperties<P extends TProperties, R> = Evaluate<Omit<P, keyof R> & R>

type RefineOf<R, K extends PropertyKey> = K extends keyof R ? NonNullable<R[K]> : {}

type SchemaProperties<T extends Table, Mode extends 'insert' | 'select', R> = MergeProperties<
  TableProperties<T, Mode>,
  Extract<R, Record<string, any>>
>

type ModelWithSchema<P extends TProperties> = Evaluate<P & { schema: TObject<P> }>

type SingleModelResult<TTable extends Table, TRefine extends Record<string, any>> = ReturnType<
  typeof createSingleModel<TTable, TRefine>
>

type ModelResult<
  T extends Record<string, Table>,
  R extends { [K in keyof T]?: Record<string, any> },
> = {
  [K in keyof T & string as `${K}Insert`]: SingleModelResult<
    T[K],
    Extract<RefineOf<R, K>, Record<string, any>>
  >['insert']
} & {
  [K in keyof T & string as `${K}Select`]: SingleModelResult<
    T[K],
    Extract<RefineOf<R, K>, Record<string, any>>
  >['select']
}

function createSingleModel<TTable extends Table, TRefine extends Record<string, any> = {}>(
  table: TTable,
  refine?: TRefine,
) {
  const insertSchema = createInsertSchema(table, refine)
  const selectSchema = createSelectSchema(table, refine)

  type InsertProps = SchemaProperties<TTable, 'insert', TRefine>
  type SelectProps = SchemaProperties<TTable, 'select', TRefine>

  return {
    insert: {
      ...insertSchema.properties,
      schema: insertSchema as TObject<InsertProps>,
    } as ModelWithSchema<InsertProps>,

    select: {
      ...selectSchema.properties,
      schema: selectSchema as TObject<SelectProps>,
    } as ModelWithSchema<SelectProps>,
  }
}

export const createModel = <
  T extends Record<string, Table>,
  const R extends { [K in keyof T]?: Record<string, any> },
>(
  tables: T,
  refines: R = {} as R,
) => {
  const models = {} as ModelResult<T, R>

  type TableEntry = {
    [K in keyof T & string]: [K, T[K]]
  }[keyof T & string]

  const buildOne = <K extends keyof T & string>(key: K, table: T[K]) => {
    const refine = (refines[key] ?? {}) as Extract<RefineOf<R, K>, Record<string, any>>

    const model = createSingleModel(table, refine)

    Object.assign(models, {
      [`${key}Insert`]: model.insert,
      [`${key}Select`]: model.select,
    })
  }

  const entries = Object.entries(tables) as TableEntry[]

  for (const [key, table] of entries) {
    buildOne(key, table)
  }

  return models
}
