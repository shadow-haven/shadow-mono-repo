/* eslint-disable no-console */
import { TaskInstanceType, BaseFunction } from '@shadow/task'

type TaskRecord<T extends TaskInstanceType = TaskInstanceType> = {
  task: T
}

type Tasks = Record<string, TaskRecord>

// Define the ParseArgumentsResult interface for better typing
export interface ParseArgumentsResult {
  taskName: string;
  args: unknown;
}

export class Runner<InputType = unknown, OutputType = unknown> {
  public _tasks: Tasks
  public parseArguments: (data: InputType) => ParseArgumentsResult

  constructor(parseArgumentsFn?: (data: InputType) => ParseArgumentsResult) {
    this._tasks = {}
    // Use provided parseArguments function or default implementation
    this.parseArguments = parseArgumentsFn || ((data: InputType): ParseArgumentsResult => {
      // Check if data is an object and has the expected properties
      if (data && typeof data === 'object' && 'task' in data && 'args' in data) {
        return {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          taskName: String((data as any).task),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: (data as any).args
        }
      }

      // If data doesn't have the expected structure, throw an error
      throw new Error('Invalid task data: expected object with task and args properties')
    })
  }

  describe(): void {
    const listItems: string[] = this.getTaskList()
    console.log('Available tasks:')
    listItems.forEach(taskName => {
      console.log(`- ${taskName}`)
    })
  }

  load<T extends BaseFunction>(name: string, task: TaskInstanceType<T>): void {
    this._tasks[name] = { task }
  }

  getTask<T extends BaseFunction = BaseFunction>(name: string): TaskInstanceType<T> | undefined {
    if (this._tasks[name] === undefined) {
      return undefined
    }

    const { task } = this._tasks[name]

    return task as TaskInstanceType<T>
  }

  getTasks(): Tasks {
    return this._tasks
  }

  getTaskList(): string[] {
    return Object.keys(this._tasks)
  }

  async run<T extends BaseFunction, P extends Parameters<T>[0], R = ReturnType<T>>(
    name: string,
    args: P
  ): Promise<Awaited<R>> {
    const exists = this._tasks[name]

    if (exists === undefined) {
      throw new Error(`Task ${name} not found`)
    }

    const { task } = exists

    if (task === undefined) {
      throw new Error(`Task ${name} not found`)
    }

    const results = await task.run(args)
    return results as Awaited<R>
  }

  async handler(data: InputType): Promise<OutputType> {
    const { taskName, args } = this.parseArguments(data)
    const res = await this.run(taskName, args)
    return res as unknown as OutputType
  }
}

export default Runner
