function base64ToBlob(imageBase64, mimeType = 'image/png') {
  const raw = String(imageBase64).includes(',')
    ? String(imageBase64).split(',')[1]
    : String(imageBase64);
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/** Build multipart/form-data for POST /screenshots/dispatch (multer field `image`). */
export function buildScreenshotDispatchForm(data) {
  const form = new FormData();

  const ext = data.mimeType === 'image/jpeg' ? 'jpg' : 'png';
  const filename = `screenshot.${ext}`;

  if (data.imageBlob) {
    form.append('image', data.imageBlob, filename);
  } else if (data.imageBase64) {
    form.append('image', base64ToBlob(data.imageBase64, data.mimeType), filename);
  }

  if (data.scheduleId) {
    form.append('scheduleId', String(data.scheduleId));
  }
  if (data.groupId) {
    form.append('groupId', String(data.groupId));
  }
  if (data.caption) {
    form.append('caption', String(data.caption));
  }
  if (data.manual) {
    form.append('manual', 'true');
  }

  return form;
}
