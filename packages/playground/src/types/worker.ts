/**
 * The type worker: one language service per playground, sharing
 * a document registry so the lib files are parsed once per page.
 */
import ts from 'typescript';
import { LIBS } from './libs.ts';
import { createProject, type Declarations, type Project } from './service.ts';
import type { TypeRequest, TypeResponse } from './protocol.ts';

const registry = ts.createDocumentRegistry();
const projects = new Map<number, Project>();
const declarations = new Map<string, Promise<Declarations>>();

const fetchText = async (url: string) => {
  try {
    const response = await fetch(url);
    return response.ok ? await response.text() : undefined;
  } catch {
    return undefined;
  }
};

/** Chartist's declarations by URL, fetched once per page. */
function declarationsAt(typesUrl: string): Promise<Declarations> {
  let loaded = declarations.get(typesUrl);
  if (!loaded) {
    loaded = Promise.all([
      fetchText(new URL('index.d.ts', typesUrl).href),
      fetchText(new URL('compat.d.ts', typesUrl).href)
    ]).then(([index, compat]) => ({ index, compat }));
    declarations.set(typesUrl, loaded);
  }
  return loaded;
}

async function handle(request: TypeRequest): Promise<unknown> {
  if (request.type === 'open') {
    const found = await declarationsAt(request.typesUrl);
    projects.set(
      request.project,
      createProject({
        ts,
        libs: LIBS,
        declarations: found,
        untyped: request.untyped,
        registry
      })
    );
    return { typed: Boolean(found.index) };
  }
  const project = projects.get(request.project);
  if (!project) {
    throw new Error(`No project ${request.project}`);
  }
  switch (request.type) {
    case 'update':
      return project.update(request.files);
    case 'diagnostics':
      return project.diagnostics(request.file);
    case 'completions':
      return project.completions(
        request.file,
        request.position,
        request.trigger
      );
    case 'completionDetails':
      return project.completionDetails(
        request.file,
        request.position,
        request.entry
      );
    case 'quickInfo':
      return project.quickInfo(request.file, request.position);
    case 'close':
      project.dispose();
      projects.delete(request.project);
      return undefined;
  }
}

// One at a time, in order: an update must land before the next query.
let queue = Promise.resolve();
self.addEventListener(
  'message',
  (event: MessageEvent<{ id: number; request: TypeRequest }>) => {
    const { id, request } = event.data;
    queue = queue.then(async () => {
      let response: TypeResponse;
      try {
        response = { id, result: await handle(request) };
      } catch (error) {
        response = { id, error: String(error) };
      }
      self.postMessage(response);
    });
  }
);
