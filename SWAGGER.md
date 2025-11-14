# Swagger/OpenAPI Documentation

This project includes comprehensive Swagger/OpenAPI 3.0 documentation for all API endpoints.

## Accessing the Documentation

### Swagger UI (Interactive)
- **URL**: `http://localhost:3000/api-docs`
- **Features**:
  - Interactive API testing
  - Request/response examples
  - Schema definitions
  - Try-it-out functionality

### OpenAPI JSON Specification
- **URL**: `http://localhost:3000/api-docs.json`
- **Use Cases**:
  - Import into API testing tools (Postman, Insomnia)
  - Generate client SDKs
  - API contract validation

## Documentation Structure

### Schemas

All data models are defined in the Swagger configuration:

- **Book**: Complete book entity with all fields
- **BookCreateInput**: Required fields for creating a book
- **BookUpdateInput**: Optional fields for updating a book
- **PaginationResult**: Pagination metadata
- **ApiResponse**: Standard API response format
- **Error**: Error response format

### Endpoints Documented

1. **POST /api/books** - Create a new book
2. **GET /api/books** - Get paginated list with filters
3. **GET /api/books/search** - Search books by title/author
4. **GET /api/books/:id** - Get a single book
5. **PUT /api/books/:id** - Update a book
6. **DELETE /api/books/:id** - Soft delete a book
7. **GET /health** - Health check endpoint

## Configuration

### Swagger Configuration File
Located at: `src/config/swagger.ts`

Key features:
- OpenAPI 3.0 specification
- Comprehensive schema definitions
- Request/response examples
- Error response documentation
- Tag-based organization

### Adding New Endpoints

To document a new endpoint, add Swagger JSDoc comments above the route handler:

```typescript
/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     summary: Endpoint description
 *     tags: [TagName]
 *     parameters:
 *       - in: query
 *         name: param
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response
 */
router.get('/endpoint', handler);
```

## Customization

### Swagger UI Customization

The Swagger UI is configured in `src/server.ts`:

```typescript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Library Management System API Documentation',
}));
```

You can customize:
- CSS styling
- Site title
- Swagger UI options
- Custom CSS classes

## Best Practices

1. **Keep Documentation Updated**: Update Swagger docs when changing endpoints
2. **Provide Examples**: Include realistic request/response examples
3. **Document Errors**: Document all possible error responses
4. **Use Schemas**: Reuse schema definitions for consistency
5. **Tag Organization**: Group related endpoints with tags

## Integration with Tools

### Postman
1. Import from: `http://localhost:3000/api-docs.json`
2. Use Postman's OpenAPI import feature

### Insomnia
1. Import from: `http://localhost:3000/api-docs.json`
2. Use Insomnia's OpenAPI import feature

### Code Generation
Use tools like:
- `openapi-generator` - Generate client SDKs
- `swagger-codegen` - Generate server stubs
- `redoc` - Generate beautiful documentation

## Troubleshooting

### Documentation Not Loading
- Ensure server is running
- Check that `/api-docs` route is accessible
- Verify Swagger configuration is correct

### Missing Endpoints
- Check that JSDoc comments are properly formatted
- Verify file paths in `swagger.ts` `apis` array
- Ensure route files are included in the scan

### Schema Errors
- Validate OpenAPI spec at: https://editor.swagger.io/
- Check for syntax errors in JSDoc comments
- Verify schema references are correct

## Production Considerations

1. **Security**: Consider adding authentication to `/api-docs` in production
2. **Rate Limiting**: Apply rate limiting to documentation endpoints
3. **Caching**: Cache the OpenAPI JSON for better performance
4. **Versioning**: Update API version in Swagger config when releasing new versions

