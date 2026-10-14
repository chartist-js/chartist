# TypeScript Coding Guidelines

This document defines the TypeScript coding standards and best practices for TypeScript projects.

## Table of Contents

- [Core Principles](#core-principles)
- [Type Safety & Immutability](#type-safety--immutability)
- [Naming Conventions](#naming-conventions)
- [Type Definitions](#type-definitions)
- [Functions & Methods](#functions--methods)
- [Classes & Services](#classes--services)
- [Async Operations](#async-operations)
- [Error Handling](#error-handling)
- [Modern JavaScript Features](#modern-javascript-features)
- [Imports & Exports](#imports--exports)
- [Comments & Documentation](#comments--documentation)

---

## Core Principles

### Functional Programming First

**Always prefer pure functions over classes.** Extract business logic into helper modules.

```typescript
// ✅ DO: Pure helper functions
export function validateEntityName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'empty' };
  }
  if (name.length > 100) {
    return { success: false, error: 'too-long' };
  }
  return { success: true, value: name.trim() };
}

export function generateRequestId(): string {
  return randomUUID();
}

// ❌ DON'T: Class for pure logic
class EntityValidator {
  validate(name: string): ValidationResult {
    // ... validation logic
  }
}
```

**When to use classes:**

- Framework requirements (NestJS services, Angular components, DTOs)
- When you need dependency injection
- When managing stateful objects

```typescript
// ✅ DO: Classes for framework services
@Injectable()
export class DataService {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: AppConfig,
  ) {}

  async createEntity(dto: CreateEntityDto): Promise<Entity> {
    // Service logic using injected dependencies
  }
}
```

---

## Type Safety & Immutability

### Always Use `readonly` in Interfaces

All interface properties should be `readonly` to promote immutability.

```typescript
// ✅ DO: Readonly interface properties
export interface Entity {
  readonly id: string;
  readonly name: string;
  readonly type: 'A' | 'B' | 'C';
  readonly properties: Record<string, unknown>;
}

export interface ScanResult {
  readonly isValid: boolean;
  readonly message?: string;
  readonly output: string;
  readonly scannedAt: Date;
}

// ❌ DON'T: Mutable interface properties
export interface Entity {
  id: string;
  name: string;
  type: string;
}
```

### Never Use Enums - Use String Literal Union Types

```typescript
// ✅ DO: String literal union types
export type EntityStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
export type SizeLevel = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

// ❌ DON'T: Enums
enum EntityStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
}
```

### Prefer `unknown` Over `any`

Use `unknown` for truly unknown types, then narrow with type guards.

```typescript
// ✅ DO: Use unknown and narrow with type guards
function handleError(error: unknown): void {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
}

// ❌ DON'T: Use any
function handleError(error: any): void {
  console.error(error.message); // No type safety
}
```

### Use Discriminated Unions for Type Safety

```typescript
// ✅ DO: Discriminated unions with readonly
export interface LocalSource {
  readonly type: 'local';
  readonly path: string;
  readonly maxResults?: number;
}

export interface RemoteSource {
  readonly type: 'remote';
  readonly url: string;
  readonly resourceId: string;
  readonly maxResults?: number;
}

export type SourceConfig = LocalSource | RemoteSource;

// Type guard
export function isLocalSource(source: SourceConfig): source is LocalSource {
  return source.type === 'local';
}
```

---

## Naming Conventions

### Variables and Functions

Use **camelCase** for variables, functions, and methods.

```typescript
// ✅ DO: camelCase
const userId = 'user-123';
const entityId = 'entity-456';
const isActive = true;

function validateEntityName(name: string): ValidationResult {}
function generateRequestId(): string {}
```

### Classes, Interfaces, and Types

Use **PascalCase** for classes, interfaces, types, and DTOs.

```typescript
// ✅ DO: PascalCase
export class DataService {}
export interface Entity {}
export type EntityStatus = 'DRAFT' | 'IN_PROGRESS';
export class CreateEntityDto {}
export class EnhancedError extends Error {}
```

### Constants

Use **UPPER_SNAKE_CASE** only for true constants (not configuration values).

```typescript
// ✅ DO: UPPER_SNAKE_CASE for true constants
const MAX_FILE_SIZE_MB = 50;
const DEFAULT_PAGE_SIZE = 20;
const API_VERSION = 'v1';

// ✅ DO: camelCase for configuration
const config = {
  maxFileSize: 50,
  apiVersion: 'v1',
};
```

### Private Fields

**NestJS/Backend:** Use `private readonly` modifier.

```typescript
// ✅ DO: NestJS services
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly authProvider: AuthProviderService,
  ) {}
}
```

**Angular/Frontend:** Use `#` prefix for private fields (ECMAScript private fields).

```typescript
// ✅ DO: Angular services
@Injectable({ providedIn: 'root' })
export class DataApiService {
  readonly #http = inject(HttpClient);
  readonly #config = inject(AppConfig);

  getItems(): Observable<Item[]> {
    return this.#http.get<Item[]>('/api/items');
  }
}
```

### Boolean Variables

Prefix boolean variables with `is`, `has`, `should`, or `can`.

```typescript
// ✅ DO: Boolean prefixes
const isActive = true;
const hasPermission = false;
const shouldRetry = true;
const canEdit = false;
const isValid = scanResult.isValid;
```

---

## Type Definitions

### Interfaces vs Type Aliases

**Use interfaces for object shapes** (always with `readonly`).

```typescript
// ✅ DO: Interfaces for object shapes
export interface GraphNode {
  readonly id: string;
  readonly type: string;
  readonly properties: Record<string, unknown>;
}

export interface SessionContext {
  readonly userId: string;
  readonly entityId: string;
  readonly sessionId: string;
}
```

**Use type aliases for unions, intersections, and mapped types.**

```typescript
// ✅ DO: Type aliases for unions
export type EntityStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
export type ValidationResult =
  { success: true; value: string } | { success: false; error: string };

// ✅ DO: Type aliases for intersections
export type AuthenticatedUser = User & { token: string };
```

### Type Guards

Use type guards with `is` predicates for runtime type checking.

```typescript
// ✅ DO: Type guards with 'is' predicate
export function isStringValue(
  definition: FieldDefinition,
  value: unknown,
): value is string {
  return definition.fieldType === 'STRING' && typeof value === 'string';
}

export function isLocalSource(source: SourceConfig): source is LocalSource {
  return source.type === 'local';
}

// Usage in code
if (isStringValue(definition, value)) {
  // TypeScript knows 'value' is string here
  return value;
}
```

### Generic Types

Use meaningful single-letter or descriptive names for generics.

```typescript
// ✅ DO: Standard generic names
function identity<T>(value: T): T {
  return value;
}

export interface Result<TData, TError = Error> {
  readonly data?: TData;
  readonly error?: TError;
}

// ✅ DO: Descriptive generic names for complex types
export interface Repository<TEntity extends BaseEntity> {
  findById(id: string): Promise<TEntity | null>;
  save(entity: TEntity): Promise<TEntity>;
}
```

### Utility Types

Leverage TypeScript's built-in utility types.

```typescript
// ✅ DO: Use utility types
type PartialEntity = Partial<Entity>;
type RequiredMetadata = Required<FileMetadata>;
type ReadonlyConfig = Readonly<AppConfig>;
type UserProps = Pick<User, 'id' | 'email' | 'role'>;
type UserWithoutPassword = Omit<User, 'password'>;
```

---

## Functions & Methods

### Function Declarations

Use **arrow functions** for standalone functions. Use **function declarations** when hoisting is needed.

```typescript
// ✅ DO: Arrow functions for helpers
export const validateEntityName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'empty' };
  }
  return { success: true, value: name.trim() };
};

// ✅ DO: Traditional function for hoisting
function setupEnvironment() {
  validateConfig();
  initializeDatabase();
}
```

### Parameter Types

Always type function parameters and return types.

```typescript
// ✅ DO: Explicit parameter and return types
export function generateRequestId(): string {
  return randomUUID();
}

export function evaluateRule(
  expression: string,
  context: RuleContext,
): RuleEvaluationResult {
  // Implementation
}

// ❌ DON'T: Missing types
function evaluateRule(expression, context) {
  // No type safety
}
```

### Default Parameters

Use default parameters instead of checking for undefined.

```typescript
// ✅ DO: Default parameters
export function validateFile(
  file: File,
  maxSizeMB = 50,
  allowedTypes: readonly string[] = ['application/pdf', 'image/jpeg'],
): ValidationResult {
  // Implementation
}

// ❌ DON'T: Manual undefined checks
export function validateFile(
  file: File,
  maxSizeMB: number,
  allowedTypes: string[],
): ValidationResult {
  maxSizeMB = maxSizeMB || 50;
  allowedTypes = allowedTypes || ['application/pdf'];
}
```

### Rest Parameters

Use rest parameters for variable arguments.

```typescript
// ✅ DO: Rest parameters
export function mergeMetadata(
  ...metadata: Record<string, unknown>[]
): Record<string, unknown> {
  return metadata.reduce(
    (merged, current) => {
      return { ...merged, ...current };
    },
    {} as Record<string, unknown>,
  );
}
```

---

## Classes & Services

### Class Property Initialization

Use property initialization syntax for simple values. Use constructor for injected dependencies.

```typescript
// ✅ DO: Property initialization and constructor injection
@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly config: AppConfig,
    private readonly eventEmitter: EventEmitter2,
  ) {}
}
```

### Method Visibility

Explicitly declare method visibility (`public`, `private`, `protected`).

```typescript
// ✅ DO: Explicit visibility
@Injectable()
export class EntityService {
  private readonly logger = new Logger(EntityService.name);

  constructor(private readonly db: DatabaseService) {}

  // Public method
  async createEntity(dto: CreateEntityDto): Promise<Entity> {
    const validated = this.validateInput(dto);
    return this.saveEntity(validated);
  }

  // Private helper methods
  private validateInput(dto: CreateEntityDto): ValidatedInput {
    // Implementation
  }

  private async saveEntity(input: ValidatedInput): Promise<Entity> {
    // Implementation
  }
}
```

### DTOs (Data Transfer Objects)

Use class-validator decorators for validation when using NestJS. Always use `readonly` for properties.

```typescript
// ✅ DO: DTO with validation decorators (NestJS)
export class CreateEntityDto {
  @ApiProperty({
    description: 'User ID who is creating the entity (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsString()
  @IsNotEmpty()
  readonly userId!: string;

  @ApiProperty({
    description: 'Entity name',
    example: 'My Entity',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  readonly name!: string;

  @ApiPropertyOptional({
    description: 'Optional description',
    example: 'Entity description',
  })
  @IsOptional()
  @IsString()
  readonly description?: string;
}
```

---

## Async Operations

### Always Use `async/await`

Prefer `async/await` over `.then()` chains for better readability.

```typescript
// ✅ DO: async/await
async function processDocument(documentId: string): Promise<ProcessingResult> {
  try {
    const document = await fetchDocument(documentId);
    const ocr = await performOCR(document);
    const summary = await generateSummary(ocr);
    return { success: true, summary };
  } catch (error) {
    logger.error('Document processing failed:', error);
    return { success: false, error };
  }
}

// ❌ DON'T: .then() chains
function processDocument(documentId: string): Promise<ProcessingResult> {
  return fetchDocument(documentId)
    .then((document) => performOCR(document))
    .then((ocr) => generateSummary(ocr))
    .then((summary) => ({ success: true, summary }))
    .catch((error) => {
      logger.error('Document processing failed:', error);
      return { success: false, error };
    });
}
```

### Error Handling with Try-Catch

Always use try-catch with async/await.

```typescript
// ✅ DO: Proper error handling
async function uploadFile(file: File): Promise<UploadResult> {
  try {
    const scanResult = await scanService.validateFile(file.path);

    if (!scanResult.isValid) {
      throw new BadRequestException(`Validation failed: ${scanResult.message}`);
    }

    const path = await storageService.uploadFile(file);
    await db.fileMetadata.create({ data: { path } });

    return { success: true, path };
  } catch (error) {
    logger.error(`Upload failed for ${file.originalname}:`, error);

    if (error instanceof BadRequestException) {
      throw error;
    }

    throw new InternalServerErrorException('Failed to upload file');
  }
}
```

### Promisify Callback-Based APIs

Use `util.promisify` to convert callbacks to promises.

```typescript
// ✅ DO: Promisify callbacks
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

async function runCommand(command: string): Promise<string> {
  const { stdout, stderr } = await execAsync(command);
  return stdout || stderr;
}
```

---

## Error Handling

### Error Type Narrowing

Always narrow error types before accessing properties.

```typescript
// ✅ DO: Type narrowing for errors
try {
  await performOperation();
} catch (error) {
  if (error instanceof Error) {
    logger.error(`Operation failed: ${error.message}`);
  } else {
    logger.error(`Operation failed: ${String(error)}`);
  }
}

// ✅ DO: Extract error message safely
const errorMessage = error instanceof Error ? error.message : 'Unknown error';
```

### Never Silently Swallow Errors

Always log or handle errors appropriately.

```typescript
// ✅ DO: Log errors
try {
  await cleanup();
} catch (error) {
  logger.warn('Cleanup failed, but continuing:', error);
}

// ❌ DON'T: Silent error swallowing
try {
  await cleanup();
} catch {
  // Error ignored - bad practice
}
```

---

## Modern JavaScript Features

### Destructuring

Use destructuring for objects and arrays.

```typescript
// ✅ DO: Object destructuring
const { userId, entityId, sessionId } = request.body;
const { success, error } = validateInput(data);

// ✅ DO: Array destructuring
const [first, second, ...rest] = items;

// ✅ DO: Destructuring in function parameters
function processUser({ userId, email, role }: User): void {
  // Implementation
}

// ✅ DO: Nested destructuring with defaults
const {
  database: { url: dbUrl = 'localhost' },
  redis: { port: redisPort = 6379 },
} = config;
```

### Spread Operators

Use spread operators for immutability.

```typescript
// ✅ DO: Object spreading for immutability
const updatedUser = { ...user, email: newEmail };
const mergedConfig = { ...defaultConfig, ...userConfig };

// ✅ DO: Array spreading
const allItems = [...existingItems, ...newItems];
const clonedArray = [...originalArray];

// ✅ DO: Function arguments
function mergeCorrelationIds(...ids: CorrelationIds[]): CorrelationIds {
  return ids.reduce((merged, current) => ({ ...merged, ...current }), {});
}
```

### Optional Chaining and Nullish Coalescing

Use `?.` for optional access and `??` for null/undefined defaults.

```typescript
// ✅ DO: Optional chaining
const userName = user?.profile?.name;
const firstItem = array?.[0];
const result = obj?.method?.();

// ✅ DO: Nullish coalescing
const port = config.port ?? 3000;
const name = input ?? 'default';

// ❌ DON'T: Old-style checking
const port =
  config.port !== null && config.port !== undefined ? config.port : 3000;
```

### Template Literals

Use template literals for string interpolation.

```typescript
// ✅ DO: Template literals
const message = `User ${userId} created entity ${entityId}`;
const url = `${baseUrl}/api/entities/${entityId}`;
const multiline = `
  This is a multi-line
  string with proper formatting
`;

// ❌ DON'T: String concatenation
const message = 'User ' + userId + ' created entity ' + entityId;
```

### Arrow Functions

Use arrow functions for callbacks and short functions.

```typescript
// ✅ DO: Arrow functions
const doubled = numbers.map((n) => n * 2);
const filtered = items.filter((item) => item.isActive);
const sorted = users.sort((a, b) => a.name.localeCompare(b.name));

// ✅ DO: Arrow functions preserve 'this' context
class MyClass {
  private value = 42;

  method() {
    setTimeout(() => {
      console.log(this.value); // 'this' is preserved
    }, 1000);
  }
}
```

---

## Imports & Exports

### Named Exports Only

Always use named exports, never default exports.

```typescript
// ✅ DO: Named exports
export class DataService {}
export interface TaxEntity {}
export function validateInput(data: unknown): ValidationResult {}

// ❌ DON'T: Default exports
export default class DataService {}
```

### Import Organization

Group imports by source: external libraries, then internal modules.

```typescript
// ✅ DO: Organized imports
// External libraries
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';

// Internal shared libraries (use your project's path aliases)
import { AppConfig } from '@myapp/config';
import { DatabaseService } from '@myapp/database';
import { StorageService } from '@myapp/services';

// Relative imports
import { DataService } from './data.service';
import { validateEntityName } from '../helpers/validation.helpers';
```

### Barrel Files

**Only use barrel files (`index.ts`) at library root.** Never for subfolders.

```typescript
// ✅ DO: Root level barrel file (libs/services/src/index.ts)
export * from './lib/storage.service';
export * from './lib/cache.service';

// ❌ DON'T: Barrel files in subfolders
// libs/services/src/lib/storage/index.ts - Don't create this
```

### Import Aliases

Use path aliases from `tsconfig.base.json`.

```typescript
// ✅ DO: Use path aliases from tsconfig
import { StorageService } from '@myapp/services';
import { AppConfig } from '@myapp/config';
import { EntityStatus } from '@myapp/shared-types';

// ❌ DON'T: Relative paths for libraries
import { StorageService } from '../../../libs/services/src/lib/storage.service';
```

---

## Comments & Documentation

### JSDoc for Public APIs

Use JSDoc comments for exported functions, classes, and interfaces.

````typescript
// ✅ DO: JSDoc for public API
/**
 * Evaluate a rule expression with context objects
 *
 * This API accepts domain objects and values directly for type-safe rule evaluation.
 *
 * @param expression - The rule expression to evaluate
 * @param contextObjects - Array of context objects for evaluation
 * @returns Evaluation result with success flag and result value
 *
 * @example
 * ```typescript
 * evaluateRuleWithContext('balance > 5000', [
 *   { type: 'entity', value: entity },
 *   { type: 'entity', value: entityProps },
 * ]);
 * ```
 */
export function evaluateRuleWithContext(
  expression: string,
  contextObjects: RuleContextObject[],
): RuleEvaluationResult {
  // Implementation
}
````

### Code Comments

Use comments to explain **why**, not **what**.

```typescript
// ✅ DO: Explain why
// Use optimized variant when available (e.g., daemon vs CLI for 10x faster execution)
const { stdout, stderr } = await execAsync(`process-file "${filePath}"`);

// Clear timeout - job completed successfully before timeout
if (timeoutHandle) {
  clearTimeout(timeoutHandle);
}

// ❌ DON'T: Explain what (code is self-explanatory)
// Create a new user
const user = await createUser(dto);

// Loop through items
for (const item of items) {
  // ...
}
```

### TODO and FIXME Comments

Use standardized comment prefixes for tracking.

```typescript
// TODO: Implement caching for frequently accessed data
// FIXME: Handle edge case when entity is deleted during processing
// NOTE: This approach was chosen for performance reasons
// HACK: Temporary workaround until library is updated
```

---

## Summary Checklist

- ✅ Use `readonly` for all interface properties
- ✅ Never use enums, use string literal union types
- ✅ Prefer pure functions, minimize classes
- ✅ Use `unknown` instead of `any`
- ✅ Always type function parameters and return types
- ✅ Use `async/await` over `.then()` chains
- ✅ Use type guards for runtime type checking
- ✅ Use optional chaining (`?.`) and nullish coalescing (`??`)
- ✅ Use destructuring and spread operators
- ✅ Use template literals for string interpolation
- ✅ Named exports only, no default exports
- ✅ No barrel files in subfolders, only at library root
- ✅ Document public APIs with JSDoc
- ✅ Use camelCase for variables/functions, PascalCase for classes/types
