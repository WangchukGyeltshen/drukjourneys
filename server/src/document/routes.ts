import { Hono } from 'hono'
import { docTypeSchema, documentStatusFilterSchema, reviewDocumentSchema } from './schemas.js'
import {
  uploadDocument,
  listDocumentsForUser,
  getDocumentFileForUser,
  listAllDocuments,
  reviewDocument,
} from './service.js'
import {
  InvalidFileTypeError,
  FileTooLargeError,
  FileContentMismatchError,
  DocumentNotFoundError,
  DocumentAccessDeniedError,
} from './errors.js'
import { requireAuth, requireRole, type AuthVariables } from '../lib/auth-middleware.js'

export const documentRoutes = new Hono<{ Variables: AuthVariables }>()

// Every route here requires authentication — document upload/access
// always ties to a specific logged-in user. Applying requireAuth once,
// at the app level for this whole sub-app, instead of per-route.
documentRoutes.use('*', requireAuth)

documentRoutes.post('/', async (c) => {
  const user = c.get('user')

  const body = await c.req.parseBody()
  const file = body['file']
  const docTypeRaw = body['docType']

  if (!(file instanceof File)) {
    return c.json({ error: 'A file upload named "file" is required' }, 400)
  }

  const parsedDocType = docTypeSchema.safeParse(docTypeRaw)
  if (!parsedDocType.success) {
    return c.json(
      { error: 'Validation failed', details: parsedDocType.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const document = await uploadDocument({
      userId: user.sub,
      docType: parsedDocType.data,
      file,
    })
    return c.json({ document }, 201)
  } catch (err) {
    if (
      err instanceof InvalidFileTypeError ||
      err instanceof FileTooLargeError ||
      err instanceof FileContentMismatchError
    ) {
      return c.json({ error: err.message }, 400)
    }
    throw err
  }
})

documentRoutes.get('/', async (c) => {
  const user = c.get('user')
  const documents = await listDocumentsForUser(user.sub)
  return c.json({ documents })
})

// Staff-only: every traveler's documents, optionally ?status=PENDING etc.
// Registered before '/:id/...' routes; '/all' has a single segment so it
// can't be confused with them.
documentRoutes.get('/all', requireRole('AGENT', 'ADMIN'), async (c) => {
  const statusRaw = c.req.query('status')
  let status: ReturnType<typeof documentStatusFilterSchema.parse> | undefined
  if (statusRaw !== undefined) {
    const parsed = documentStatusFilterSchema.safeParse(statusRaw)
    if (!parsed.success) {
      return c.json({ error: 'status must be one of PENDING, SUBMITTED, APPROVED, REJECTED' }, 400)
    }
    status = parsed.data
  }
  const documents = await listAllDocuments(status)
  return c.json({ documents })
})

documentRoutes.get('/:id/download', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  try {
    const { document, data } = await getDocumentFileForUser({
      documentId: id,
      userId: user.sub,
      role: user.role,
    })
    // Sanitize before putting a client-supplied value into a header:
    // strip CR/LF (header injection) and quotes (would break out of the
    // filename="..." syntax), rather than trusting it as-is.
    const safeFilename = document.originalFilename.replace(/[\r\n"]/g, '')
    c.header('Content-Type', document.mimeType)
    c.header('Content-Disposition', `attachment; filename="${safeFilename}"`)
    return c.body(new Uint8Array(data))
  } catch (err) {
    if (err instanceof DocumentNotFoundError) {
      return c.json({ error: err.message }, 404)
    }
    if (err instanceof DocumentAccessDeniedError) {
      return c.json({ error: err.message }, 403)
    }
    throw err
  }
})

// Staff-only: approve or reject a traveler's document.
documentRoutes.patch('/:id/status', requireRole('AGENT', 'ADMIN'), async (c) => {
  const id = c.req.param('id')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = reviewDocumentSchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const document = await reviewDocument({ documentId: id, status: result.data.status })
    return c.json({ document })
  } catch (err) {
    if (err instanceof DocumentNotFoundError) {
      return c.json({ error: err.message }, 404)
    }
    throw err
  }
})
