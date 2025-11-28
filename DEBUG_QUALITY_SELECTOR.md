# 🔍 Debug Guide: Quality Selector Not Showing

## Steps to Debug

1. **Open Browser Console** (F12)
2. **Load a video** (HLS or regular)
3. **Click Settings button** (⚙️)
4. **Click "Quality"**
5. **Check console logs** for:
   - `[Player] HLS Detection:` - Shows if HLS is detected
   - `[Player] HLS Levels loaded:` - Shows when levels are loaded
   - `[QualitySelector] Quality Options:` - Shows what options are available

## Expected Behavior

### For HLS Videos:
- Should detect master playlist automatically
- Should load 3 quality levels (1080p, 720p, 480p)
- Should show: Auto, 1080p, 720p, 480p

### For Regular Videos:
- Should show: Auto (and any other qualities if provided)

## Common Issues

### Issue 1: Quality Selector Not Visible
**Check:**
- Is the Settings button visible?
- Does clicking Settings show the menu?
- Does clicking "Quality" show the selector?

**Solution:**
- Make sure controls are visible (hover over video)
- Click Settings button (⚙️)
- Click "Quality" option

### Issue 2: Only "Auto" Showing
**Possible causes:**
- HLS levels not loaded yet
- Video is not HLS format
- Master playlist not found

**Check console for:**
- `[Player] HLS Levels loaded:` - Should show levels array
- If empty array: HLS levels not detected

### Issue 3: Empty Quality Selector
**Check:**
- Console logs for `[QualitySelector] Quality Options:`
- If optionsCount is 0, there's an issue

## Quick Fix

If quality selector is not showing options:

1. Wait a few seconds for HLS levels to load
2. Check browser console for errors
3. Refresh the page and try again
4. Verify video has HLS master playlist at: `{baseName}/{baseName}.m3u8`






