# PluriDesk - Testing Checklist

## ✅ Migration Applied Successfully!

Now let's test all the new features to make sure everything works.

---

## 🧪 Test 1: File Upload System

### Prerequisites:
- [ ] Make sure your Next.js dev server is running
  ```bash
  npm run dev
  ```
- [ ] Restart the server if it was already running (to pick up new types)

### Test Steps:
1. Navigate to `http://localhost:3000/jobs`
2. Click on any existing job (or create a new one)
3. Click on the **"Files & Documents"** tab
4. You should see the new file upload interface (not "coming soon"!)

### Test Upload:
- [ ] **Drag & Drop Test**: Drag a file onto the upload area
- [ ] **Browse Test**: Click "Browse Files" and select a file
- [ ] **Category Test**: Change the category (Source/Deliverable/Reference/Other)
- [ ] **Upload Test**: Click "Upload" button
- [ ] **Verify**: File should appear in the list below with:
  - File name
  - File size (formatted, e.g., "2.5 MB")
  - Category badge (color-coded)
  - Upload date
  - Download button
  - Delete button

### Test Download:
- [ ] Click the download icon on an uploaded file
- [ ] File should download to your computer
- [ ] Verify the file opens correctly

### Test Delete:
- [ ] Click the trash icon on a file
- [ ] Confirm deletion in the dialog
- [ ] File should disappear from the list

### Expected Behavior:
✅ Files upload successfully  
✅ Files display with correct metadata  
✅ Download works (generates signed URL)  
✅ Delete removes file from both database and storage  
✅ Empty state shows when no files exist  

---

## 🔔 Test 2: Notifications System

### Test Notification Creation:
First, create a test notification via SQL:

```sql
INSERT INTO public.notifications (owner_id, type, title, message, read)
VALUES (
  (SELECT id FROM public.users LIMIT 1), -- Uses your user ID
  'jobs',
  'Test Notification - Job Ready',
  'Your translation job is ready for review!',
  false
);
```

Run this in Supabase Dashboard → SQL Editor

### Test Notification Bell:
- [ ] Check the **bell icon** in the top right of the navbar
- [ ] You should see a **red badge** with the number "1"
- [ ] Click the bell icon
- [ ] Notification should appear in the dropdown
- [ ] Should show:
  - Badge type ("JOBS")
  - Title
  - Relative time ("Just now")
  - Blue dot for unread status

### Test Notifications Page:
- [ ] Navigate to `/notifications` (or click "View all" in the bell dropdown)
- [ ] Should see your test notification
- [ ] Should show unread count at the top
- [ ] Notification should have slightly higher opacity (unread indicator)

### Test Mark as Read:
- [ ] Click **"Mark as read"** button
- [ ] Notification should:
  - Fade to lower opacity
  - Remove the blue dot
  - Update the bell badge count
  - Hide the "Mark as read" button

### Test Delete:
- [ ] Click the **X** button on a notification
- [ ] Notification should disappear
- [ ] Bell badge should update

### Test Auto-Refresh:
- [ ] Keep the page open
- [ ] Add another notification via SQL (see above)
- [ ] Within 60 seconds, the bell should update automatically

### Expected Behavior:
✅ Notifications display in real-time  
✅ Unread count is accurate  
✅ Mark as read works  
✅ Delete works  
✅ Auto-refresh updates every minute  
✅ Empty state shows when no notifications  

---

## 🧭 Test 3: Breadcrumb Navigation

### Test Steps:
- [ ] Go to any job detail page
- [ ] Look at the top of the page
- [ ] You should see: **Jobs > [Job Code]**
- [ ] Click on **"Jobs"** in the breadcrumb
- [ ] Should navigate back to the jobs list
- [ ] Navigation should be smooth (no full page reload)

### Expected Behavior:
✅ Breadcrumbs visible on job detail pages  
✅ Shows correct hierarchy  
✅ Links work properly  
✅ Styling matches the rest of the UI  

---

## 🛡️ Test 4: Error Boundary

### Test Steps (Force an Error):
1. Temporarily break something to test error handling
2. For example, in `src/app/(workspace)/jobs/[id]/page.tsx`, add this line inside the component:
   ```typescript
   throw new Error("Test error boundary");
   ```
3. Navigate to a job detail page
4. You should see:
   - ✅ User-friendly error message (not a white screen)
   - ✅ Error details in a gray box
   - ✅ "Refresh Page" button
5. Click "Refresh Page" - error should be gone after you remove the test error

### Expected Behavior:
✅ Catches React errors gracefully  
✅ Shows user-friendly message  
✅ Provides recovery option  
✅ Doesn't crash the entire app  

**Don't forget to remove the test error after testing!**

---

## 🔍 Test 5: Verify Storage Bucket

### Check Storage Bucket:
1. Go to Supabase Dashboard
2. Navigate to **Storage** section
3. Look for `job-files` bucket

### If Bucket Doesn't Exist:
1. Click **"New bucket"**
2. Name: `job-files`
3. **Public:** No (keep it private)
4. Click **"Create bucket"**
5. The file upload should now work

### Verify Bucket Policies:
In Supabase Dashboard → Storage → `job-files` → Policies, you should see 4 policies:
- ✅ Users can view their own job files (SELECT)
- ✅ Users can upload their own job files (INSERT)
- ✅ Users can update their own job files (UPDATE)
- ✅ Users can delete their own job files (DELETE)

---

## 🐛 Common Issues & Solutions

### Issue: File upload returns 500 error

**Check:**
1. Browser console for specific error
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is in your `.env` file
3. Check that `job-files` storage bucket exists
4. Verify storage policies are applied

**Solution:**
```bash
# Verify environment variables
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY
```

---

### Issue: Notifications not appearing

**Check:**
1. Run SQL to verify notifications exist:
   ```sql
   SELECT * FROM public.notifications;
   ```
2. Check that `owner_id` matches your user ID
3. Verify API route is responding:
   ```bash
   curl http://localhost:3000/api/notifications
   ```

**Solution:** Check `PLURIDESK_OWNER_ID` in `.env` matches your user

---

### Issue: Breadcrumbs not showing

**Solution:**
1. Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
2. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

---

### Issue: TypeScript errors in editor

**Solution:**
1. Restart TypeScript server in VS Code:
   - Cmd+Shift+P → "TypeScript: Restart TS Server"
2. Or regenerate types:
   ```bash
   supabase gen types typescript --project-id rmavktscqxgarjykfazc > src/lib/supabase/types.ts
   ```

---

## 📊 Success Criteria

All features working = Ready for production! ✅

- [x] Database migration applied
- [ ] File upload works
- [ ] File download works
- [ ] File delete works
- [ ] Notifications display
- [ ] Mark as read works
- [ ] Notification bell updates
- [ ] Breadcrumbs navigate correctly
- [ ] Error boundary catches errors
- [ ] Storage bucket configured

---

## 🎉 What's Next?

After testing, consider:
1. **Add seed data** - Create sample suppliers and quotes
2. **Test on different browsers** - Chrome, Firefox, Safari
3. **Test on mobile** - Responsive design check
4. **Set up error monitoring** - Consider Sentry for production
5. **Backup strategy** - Automated backups for Supabase

---

## 📝 Notes

**File Upload Limits:**
- Current: No enforced limit on frontend
- Recommended: Add 50MB max file size check
- Supabase default: 50MB per file

**Performance:**
- Notification bell refetches every 60 seconds
- Consider Supabase Realtime for instant updates
- File list shows all files (add pagination if >20 files)

---

*Last Updated: 2025-11-15*

