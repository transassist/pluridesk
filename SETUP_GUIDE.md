# PluriDesk - Quick Setup Guide for UX Fixes

## 🚀 Getting Started

This guide will help you apply the recent UX fixes and get everything working.

---

## Step 1: Apply Database Migration

The file management system requires a new database table. Apply the migration:

```bash
# If using Supabase CLI (local development)
supabase migration up

# Or push to remote
supabase db push
```

**Migration file:** `supabase/migrations/0002_add_job_files.sql`

**What it creates:**
- `job_files` table for file metadata
- RLS policies for file access control
- Storage policies for the `job-files` bucket
- Proper indexes for performance

---

## Step 2: Verify Supabase Storage Bucket

Ensure the `job-files` bucket exists and is configured correctly:

### Via Supabase Dashboard:
1. Go to Storage section
2. Verify `job-files` bucket exists
3. Configure bucket settings:
   - **Public:** No (keep private)
   - **File size limit:** 50MB (recommended)
   - **Allowed MIME types:** Leave as "All" or restrict as needed

### Via SQL (if bucket doesn't exist):
```sql
-- Already in migration, but run manually if needed
SELECT storage.create_bucket('job-files', false);
```

---

## Step 3: Verify RLS Policies

Check that Row Level Security policies are active:

```sql
-- Check job_files policies
SELECT * FROM pg_policies WHERE tablename = 'job_files';

-- Should show 4 policies: select, insert, update, delete
```

If policies are missing, they're in the migration file. Run:
```bash
supabase db reset
```

---

## Step 4: Install Dependencies (if needed)

All necessary dependencies should already be installed. If you see import errors:

```bash
npm install
# or
pnpm install
```

**Key dependencies used:**
- `@tanstack/react-query` - Data fetching and caching
- `lucide-react` - Icons
- `@radix-ui/*` - UI primitives (via shadcn/ui)

---

## Step 5: Run the Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000`

---

## Step 6: Test Critical Features

### Test File Upload:
1. Go to any job detail page
2. Click on "Files & Documents" tab
3. Drag and drop a file or click "Browse Files"
4. Select a category (Source, Deliverable, etc.)
5. Click "Upload"
6. Verify file appears in the list
7. Test download by clicking download icon
8. Test deletion by clicking trash icon

**Expected behavior:**
- File uploads successfully
- Download generates a signed URL
- Delete removes from both database and storage

**If file upload fails:**
- Check browser console for errors
- Verify Supabase environment variables are set
- Ensure storage bucket exists
- Check RLS policies allow operations

---

### Test Notifications:
1. Create a test notification (via SQL or API):
   ```sql
   INSERT INTO notifications (owner_id, type, title, message)
   VALUES (
     'YOUR_OWNER_ID',
     'jobs',
     'Test notification',
     'This is a test message'
   );
   ```
2. Check notification bell in topbar shows badge
3. Click bell to see notification preview
4. Navigate to `/notifications` page
5. Test "Mark as read" button
6. Test delete (X) button

**Expected behavior:**
- Notification appears in bell dropdown
- Badge shows unread count
- Mark as read updates state
- Delete removes notification

---

### Test Error Boundary:
1. Force an error (temporarily add invalid code)
2. Verify error boundary catches it
3. See user-friendly error message
4. "Refresh Page" button works

---

### Test Breadcrumbs:
1. Navigate to any job detail page
2. See breadcrumb: "Jobs > Job Code"
3. Click "Jobs" to navigate back
4. Verify navigation works

---

## Step 7: Check for TypeScript Errors

```bash
npm run type-check
# or
npx tsc --noEmit
```

**All type errors should be resolved.** If you see errors:
1. Regenerate Supabase types:
   ```bash
   supabase gen types typescript --local > src/lib/supabase/types.ts
   ```
2. Restart TypeScript server in your editor

---

## Step 8: Seed Test Data (Optional)

To test with realistic data, create sample records:

```sql
-- Create a test supplier
INSERT INTO suppliers (owner_id, name, email, default_rate_word)
VALUES ('YOUR_OWNER_ID', 'Acme Translations', 'contact@acme.com', 0.12);

-- Create a test quote
INSERT INTO quotes (owner_id, client_id, quote_number, total, currency, status)
VALUES (
  'YOUR_OWNER_ID',
  'EXISTING_CLIENT_ID',
  'Q-2025-001',
  5000,
  'USD',
  'sent'
);

-- Create test notifications
INSERT INTO notifications (owner_id, type, title, message) VALUES
  ('YOUR_OWNER_ID', 'invoices', 'Invoice 2025-0001 overdue', 'Payment is 3 days late'),
  ('YOUR_OWNER_ID', 'jobs', 'Job VP24111501 due soon', 'Due in 2 days'),
  ('YOUR_OWNER_ID', 'outsourcing', 'Supplier payment pending', 'Payment to Acme Translations due');
```

Replace `YOUR_OWNER_ID` with your actual owner ID from environment variables or database.

---

## Troubleshooting

### Issue: File upload returns 500 error

**Solution:**
1. Check Supabase service role key is set in `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
2. Verify storage bucket policies exist
3. Check browser console for specific error message

---

### Issue: Notifications not appearing

**Solution:**
1. Check API route is responding:
   ```bash
   curl http://localhost:3000/api/notifications
   ```
2. Verify `PLURIDESK_OWNER_ID` environment variable matches user ID
3. Check notifications table has records for your owner_id

---

### Issue: "Error boundary caught an error"

**Solution:**
1. Check browser console for actual error
2. Verify all imports are correct
3. Ensure database connection is working
4. Check React Query provider is wrapped around app

---

### Issue: Breadcrumbs not showing

**Solution:**
1. Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+R)
2. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```
3. Verify breadcrumb component is imported correctly

---

### Issue: TypeScript errors in IDE

**Solution:**
1. Restart TypeScript server:
   - VS Code: Cmd+Shift+P > "TypeScript: Restart TS Server"
   - WebStorm: File > Invalidate Caches
2. Regenerate types (see Step 7)
3. Check `tsconfig.json` includes all necessary paths

---

## Environment Variables Checklist

Ensure your `.env.local` has:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_DB_PASSWORD=your-db-password
PLURIDESK_OWNER_ID=your-owner-uuid
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_ACCESS_TOKEN=your-access-token
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Run `npm run build` to verify build succeeds
- [ ] Apply migrations to production database
- [ ] Update environment variables on hosting platform
- [ ] Verify Supabase RLS policies are active
- [ ] Test file upload on staging environment
- [ ] Configure storage bucket limits
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Review security policies
- [ ] Set up automatic backups for file storage

---

## Performance Optimization (Optional)

For better performance:

1. **Enable file upload progress:**
   ```typescript
   // In file-upload.tsx, add to fetch options:
   onUploadProgress: (progressEvent) => {
     const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
     setUploadProgress(percentCompleted);
   }
   ```

2. **Add image thumbnails:**
   - Use Supabase Image Transformation
   - Generate thumbnails on upload
   - Display in file list

3. **Implement pagination for large file lists:**
   - Currently shows all files
   - Add pagination after ~20 files

4. **Use Supabase Realtime for notifications:**
   ```typescript
   const channel = supabase.channel('notifications')
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'notifications'
     }, payload => {
       queryClient.invalidateQueries(['notifications'])
     })
     .subscribe()
   ```

---

## Support

If you encounter issues not covered here:
1. Check the main `UX_FIXES_SUMMARY.md` document
2. Review Supabase dashboard for errors
3. Check browser console for client-side errors
4. Review server logs for API errors

**Common resources:**
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [React Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui Docs](https://ui.shadcn.com)

---

## What's Next?

After verifying everything works, consider implementing:
1. **Bulk actions** - Select and act on multiple items
2. **Export functionality** - CSV/PDF exports
3. **Advanced notifications** - Email notifications, custom triggers
4. **Mobile optimization** - Better responsive design
5. **Search improvements** - Full-text search across jobs

---

*Last Updated: 2025-11-15*

