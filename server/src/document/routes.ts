import { Hono } from 'hono'
import { docTypeSchema } from './schemas.js'
import { uploadDocument, listDocumentsForUser, getOwnedDocumentFile } from './service.js'
import {
  InvalidFileTypeError,
  FileTooLargeError,
  DocumentNotFoundError,
  DocumentAccessDeniedError,
} from './errors.js'
import { requireAuth, type AuthVariables } from '../lib/auth-middleware.js'

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
    if (err instanceof InvalidFileTypeError || err instanceof FileTooLargeError) {
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

documentRoutes.get('/:id/download', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  try {
    const { document, data } = await getOwnedDocumentFile({ documentId: id, userId: user.sub })
    // Sanitize before putting a client-supplied value into a header:
    // strip CR/LF (header injection) and quotes (would break out of the
    // filename="..." syntax), rather than trusting it as-is.
    const safeFilename = document.originalFilename.replace(/[\r\n"]/g, '')
    c.header('Content-Type', document.mimeType)
    c.header('Content-Disposition', `attachment; filename="${safeFilename}"`)
    return c.body(data)
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
